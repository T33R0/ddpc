/**
 * Vehicle Privacy Filter
 *
 * Provides field-level privacy controls for public vehicle views.
 * When a vehicle is set to PUBLIC, the owner can control which
 * data categories are visible to other users.
 */

export interface VehiclePrivacySettings {
  show_odometer: boolean
  show_cost: boolean
  show_maintenance_history: boolean
  show_fuel_logs: boolean
  show_mods: boolean
  show_parts: boolean
  show_vin: boolean
}

export const DEFAULT_PRIVACY_SETTINGS: VehiclePrivacySettings = {
  show_odometer: true,
  show_cost: false,
  show_maintenance_history: true,
  show_fuel_logs: false,
  show_mods: true,
  show_parts: false,
  show_vin: false,
}

/**
 * Parse privacy_settings from a vehicle record.
 * Falls back to defaults if null or invalid.
 */
export function parsePrivacySettings(raw: unknown): VehiclePrivacySettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PRIVACY_SETTINGS }
  const settings = raw as Record<string, unknown>
  return {
    show_odometer: typeof settings.show_odometer === 'boolean' ? settings.show_odometer : DEFAULT_PRIVACY_SETTINGS.show_odometer,
    show_cost: typeof settings.show_cost === 'boolean' ? settings.show_cost : DEFAULT_PRIVACY_SETTINGS.show_cost,
    show_maintenance_history: typeof settings.show_maintenance_history === 'boolean' ? settings.show_maintenance_history : DEFAULT_PRIVACY_SETTINGS.show_maintenance_history,
    show_fuel_logs: typeof settings.show_fuel_logs === 'boolean' ? settings.show_fuel_logs : DEFAULT_PRIVACY_SETTINGS.show_fuel_logs,
    show_mods: typeof settings.show_mods === 'boolean' ? settings.show_mods : DEFAULT_PRIVACY_SETTINGS.show_mods,
    show_parts: typeof settings.show_parts === 'boolean' ? settings.show_parts : DEFAULT_PRIVACY_SETTINGS.show_parts,
    show_vin: typeof settings.show_vin === 'boolean' ? settings.show_vin : DEFAULT_PRIVACY_SETTINGS.show_vin,
  }
}

/** Strips cost from a single log entry */
function stripCost<T extends Record<string, unknown>>(entry: T): T {
  const copy = { ...entry }
  delete copy.cost
  delete copy.total_cost
  delete copy.price_per_gallon
  delete copy.acquisition_cost
  return copy
}

/**
 * Filter stats object for public view based on privacy settings.
 */
export function filterStatsForPublicView(
  stats: Record<string, unknown>,
  settings: VehiclePrivacySettings
): Record<string, unknown> {
  const filtered = { ...stats }

  if (!settings.show_odometer) {
    filtered.odometer = null
  }

  if (!settings.show_vin) {
    filtered.vin = null
  }

  if (!settings.show_cost) {
    filtered.totalCompletedModCost = null
  }

  if (!settings.show_fuel_logs) {
    filtered.avgMpg = null
    filtered.lastFuelDate = null
  }

  if (!settings.show_maintenance_history) {
    filtered.serviceCount = 0
    filtered.lastServiceDate = null
    filtered.nextServiceDate = null
  }

  return filtered
}

/**
 * Filter the unified activity log for public view.
 * Removes entire log categories based on settings, and strips
 * cost/odometer from remaining entries as needed.
 */
export function filterLogsForPublicView(
  logs: Array<Record<string, unknown>>,
  settings: VehiclePrivacySettings
): Array<Record<string, unknown>> {
  return logs
    .filter((log) => {
      const type = log.type as string
      if (type === 'fuel' && !settings.show_fuel_logs) return false
      if (type === 'service' && !settings.show_maintenance_history) return false
      if (type === 'mod' && !settings.show_mods) return false
      if (type === 'part' && !settings.show_parts) return false
      // Jobs are tied to maintenance history
      if (type === 'job' && !settings.show_maintenance_history) return false
      return true
    })
    .map((log) => {
      let entry = { ...log }
      if (!settings.show_cost) {
        entry = stripCost(entry)
      }
      if (!settings.show_odometer) {
        delete entry.odometer
      }
      return entry
    })
}

/**
 * Filter mods array for public view.
 */
export function filterModsForPublicView(
  mods: Array<Record<string, unknown>>,
  settings: VehiclePrivacySettings
): Array<Record<string, unknown>> {
  if (!settings.show_mods) return []
  if (!settings.show_cost) {
    return mods.map((m) => stripCost(m))
  }
  return mods
}

/**
 * Filter inventory stats for public view.
 */
export function filterInventoryForPublicView(
  inventoryStats: Record<string, unknown> | null,
  settings: VehiclePrivacySettings
): Record<string, unknown> | null {
  if (!settings.show_parts) return null
  return inventoryStats
}

/**
 * Strips sensitive fields from a public profile.
 * Email, plan tier, and banned status should never be exposed.
 */
export function filterPublicProfile<T extends Record<string, unknown>>(profile: T): T {
  const filtered = { ...profile }
  delete filtered.email
  delete filtered.plan
  delete filtered.banned
  delete filtered.stripe_customer_id
  return filtered
}
