/**
 * Vehicle Health Score — 0-100 composite score based on maintenance cadence,
 * parts condition, and activity recency.
 */

export interface HealthBadge {
  id: string
  label: string
  description: string
  iconName: string // lucide icon name
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface VehicleHealthBreakdown {
  /** Overall score 0-100 */
  overall: number
  /** Sub-scores 0-100 */
  maintenance: number
  parts: number
  recency: number
  /** Earned badges */
  badges: HealthBadge[]
  /** Raw factors for display */
  factors: {
    overdueServices: number
    totalIntervals: number
    averagePartHealth: number | null
    totalTrackedParts: number
    daysSinceLastActivity: number
    totalRecords: number
    completedMods: number
  }
}

/**
 * Calculate the composite vehicle health score.
 *
 * Weights:
 * - Maintenance Adherence: 40% — % of service intervals that are current
 * - Parts Condition: 30% — Average health of installed parts
 * - Recency: 30% — How recently the vehicle was serviced/logged
 */
export function calculateVehicleHealthScore(data: {
  /** Number of service intervals that are past due */
  overdueServiceCount: number
  /** Total number of service intervals tracked */
  totalServiceIntervals: number
  /** Average health percentage of installed parts (0-100), null if no parts tracked */
  averagePartHealth: number | null
  /** Number of parts with health tracking */
  totalTrackedParts: number
  /** Most recent activity date (maintenance, fuel, mod, job) */
  lastActivityDate: string | null
  /** Total number of log entries */
  totalRecords: number
  /** Number of completed modifications */
  completedMods: number
}): VehicleHealthBreakdown {
  // --- 1. Maintenance Adherence (40%) ---
  let maintenanceScore = 100
  if (data.totalServiceIntervals > 0) {
    const currentCount = data.totalServiceIntervals - data.overdueServiceCount
    maintenanceScore = Math.round((currentCount / data.totalServiceIntervals) * 100)
  }
  // If no intervals tracked, assume neutral (give benefit of the doubt)

  // --- 2. Parts Condition (30%) ---
  let partsScore = 100
  if (data.averagePartHealth !== null && data.totalTrackedParts > 0) {
    partsScore = Math.round(data.averagePartHealth)
  }
  // If no parts tracked, assume good condition

  // --- 3. Recency (30%) ---
  let recencyScore = 0
  if (data.lastActivityDate) {
    const daysSince = Math.max(
      0,
      Math.floor((Date.now() - new Date(data.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
    )
    // Scale: 0 days = 100, 180 days = 50, 365+ days = 0
    if (daysSince <= 30) {
      recencyScore = 100
    } else if (daysSince <= 90) {
      recencyScore = Math.round(100 - ((daysSince - 30) / 60) * 25) // 100 → 75
    } else if (daysSince <= 180) {
      recencyScore = Math.round(75 - ((daysSince - 90) / 90) * 25) // 75 → 50
    } else if (daysSince <= 365) {
      recencyScore = Math.round(50 - ((daysSince - 180) / 185) * 50) // 50 → 0
    } else {
      recencyScore = 0
    }
  } else if (data.totalRecords === 0) {
    // No activity at all — give a baseline
    recencyScore = 25
  }

  // --- Composite ---
  const overall = Math.round(
    maintenanceScore * 0.4 + partsScore * 0.3 + recencyScore * 0.3
  )

  const daysSinceLastActivity = data.lastActivityDate
    ? Math.floor((Date.now() - new Date(data.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
    : -1

  // --- Badges ---
  const badges = evaluateBadges({
    overall,
    maintenanceScore,
    daysSinceLastActivity,
    totalRecords: data.totalRecords,
    completedMods: data.completedMods,
    overdueServiceCount: data.overdueServiceCount,
    totalServiceIntervals: data.totalServiceIntervals,
  })

  return {
    overall: Math.max(0, Math.min(100, overall)),
    maintenance: Math.max(0, Math.min(100, maintenanceScore)),
    parts: Math.max(0, Math.min(100, partsScore)),
    recency: Math.max(0, Math.min(100, recencyScore)),
    badges,
    factors: {
      overdueServices: data.overdueServiceCount,
      totalIntervals: data.totalServiceIntervals,
      averagePartHealth: data.averagePartHealth,
      totalTrackedParts: data.totalTrackedParts,
      daysSinceLastActivity,
      totalRecords: data.totalRecords,
      completedMods: data.completedMods,
    },
  }
}

// --- Badge Evaluation ---

const ALL_BADGES: Array<
  HealthBadge & { check: (ctx: BadgeContext) => boolean }
> = [
  {
    id: 'meticulous',
    label: 'Meticulous',
    description: 'Overall health score 90+',
    iconName: 'Trophy',
    rarity: 'legendary',
    check: (ctx) => ctx.overall >= 90,
  },
  {
    id: 'well_maintained',
    label: 'Well Maintained',
    description: 'Overall health score 75+',
    iconName: 'Star',
    rarity: 'epic',
    check: (ctx) => ctx.overall >= 75 && ctx.overall < 90,
  },
  {
    id: 'recently_serviced',
    label: 'Recently Serviced',
    description: 'Activity within the last 30 days',
    iconName: 'Sparkles',
    rarity: 'common',
    check: (ctx) => ctx.daysSinceLastActivity >= 0 && ctx.daysSinceLastActivity <= 30,
  },
  {
    id: 'full_build_log',
    label: 'Full Build Log',
    description: '10+ total records',
    iconName: 'BookOpen',
    rarity: 'rare',
    check: (ctx) => ctx.totalRecords >= 10,
  },
  {
    id: 'mod_master',
    label: 'Mod Master',
    description: '5+ completed modifications',
    iconName: 'Wrench',
    rarity: 'epic',
    check: (ctx) => ctx.completedMods >= 5,
  },
  {
    id: 'no_overdue',
    label: 'On Schedule',
    description: 'All service intervals current',
    iconName: 'CheckCircle',
    rarity: 'rare',
    check: (ctx) => ctx.totalServiceIntervals > 0 && ctx.overdueServiceCount === 0,
  },
]

interface BadgeContext {
  overall: number
  maintenanceScore: number
  daysSinceLastActivity: number
  totalRecords: number
  completedMods: number
  overdueServiceCount: number
  totalServiceIntervals: number
}

function evaluateBadges(ctx: BadgeContext): HealthBadge[] {
  return ALL_BADGES
    .filter((badge) => badge.check(ctx))
    .map(({ check: _, ...badge }) => badge)
}

/**
 * Get a color class for a health score.
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 75) return 'text-green-500'
  if (score >= 50) return 'text-yellow-500'
  return 'text-red-500'
}

/**
 * Get a background color class for a health score ring.
 */
export function getHealthScoreRingColor(score: number): string {
  if (score >= 75) return 'stroke-green-500'
  if (score >= 50) return 'stroke-yellow-500'
  return 'stroke-red-500'
}

/**
 * Get badge rarity color.
 */
export function getBadgeRarityColor(rarity: HealthBadge['rarity']): string {
  switch (rarity) {
    case 'legendary': return 'bg-amber-500/10 text-amber-500 border-amber-500/30'
    case 'epic': return 'bg-purple-500/10 text-purple-500 border-purple-500/30'
    case 'rare': return 'bg-blue-500/10 text-blue-500 border-blue-500/30'
    case 'common': return 'bg-muted text-muted-foreground border-border'
  }
}
