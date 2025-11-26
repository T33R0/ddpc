// Helper function to check if a string is a UUID
export function isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
}

/**
 * Creates a URL-friendly slug from a string
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-')   // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '')       // Trim - from end of text
}

/**
 * Determines the best slug for a vehicle
 * Priority:
 * 1. Nickname (if unique among user's vehicles)
 * 2. YMMT (Year-Make-Model-Trim) (if unique among user's vehicles)
 * 3. ID (fallback)
 */
export function getVehicleSlug(vehicle: { id: string, nickname?: string | null, year?: number | string | null, make?: string | null, model?: string | null, trim?: string | null }, allVehicles: { id: string, nickname?: string | null, year?: number | string | null, make?: string | null, model?: string | null, trim?: string | null }[]): string {
    // 1. Check Nickname
    if (vehicle.nickname) {
        const isNicknameUnique = !allVehicles.some(v =>
            v.id !== vehicle.id &&
            v.nickname?.toLowerCase() === vehicle.nickname?.toLowerCase()
        )

        if (isNicknameUnique) {
            return vehicle.nickname
        }
    }

    // 2. Check YMMT
    // Construct YMMT string
    const ymmtParts = [
        vehicle.year,
        vehicle.make,
        vehicle.model,
        vehicle.trim
    ].filter(Boolean).join(' ')

    const ymmtSlug = slugify(ymmtParts)

    if (ymmtSlug) {
        // Check if any other vehicle generates the same YMMT slug
        const isYmmtUnique = !allVehicles.some(v => {
            if (v.id === vehicle.id) return false

            const otherParts = [
                v.year,
                v.make,
                v.model,
                v.trim
            ].filter(Boolean).join(' ')

            return slugify(otherParts) === ymmtSlug
        })

        if (isYmmtUnique) {
            return ymmtSlug
        }
    }

    // 3. Fallback to ID
    return vehicle.id
}
