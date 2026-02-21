'use client'

import { Trophy, Star, Sparkles, BookOpen, Wrench, CheckCircle } from 'lucide-react'
import type { VehicleHealthBreakdown, HealthBadge } from '../lib/vehicle-health-score'
import { getHealthScoreColor, getHealthScoreRingColor, getBadgeRarityColor } from '../lib/vehicle-health-score'

interface VehicleHealthScoreProps {
  health: VehicleHealthBreakdown
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
  Trophy: <Trophy className="w-3 h-3" />,
  Star: <Star className="w-3 h-3" />,
  Sparkles: <Sparkles className="w-3 h-3" />,
  BookOpen: <BookOpen className="w-3 h-3" />,
  Wrench: <Wrench className="w-3 h-3" />,
  CheckCircle: <CheckCircle className="w-3 h-3" />,
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const ringColor = getHealthScoreRingColor(score)
  const textColor = getHealthScoreColor(score)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={ringColor}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <span className={`absolute text-lg font-bold ${textColor}`}>
        {score}
      </span>
    </div>
  )
}

function BadgePill({ badge }: { badge: HealthBadge }) {
  const colorClass = getBadgeRarityColor(badge.rarity)
  const icon = BADGE_ICONS[badge.iconName] || null

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${colorClass}`}
      title={badge.description}
    >
      {icon}
      <span>{badge.label}</span>
    </div>
  )
}

function SubScore({ label, score }: { label: string; score: number }) {
  const colorClass = getHealthScoreColor(score)
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-medium ${colorClass}`}>{score}</span>
    </div>
  )
}

export function VehicleHealthScore({ health }: VehicleHealthScoreProps) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="flex items-start gap-4">
        <ScoreRing score={health.overall} />
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Vehicle Health</h4>
            <p className="text-xs text-muted-foreground">
              Based on maintenance, parts, and activity
            </p>
          </div>

          <div className="space-y-1">
            <SubScore label="Maintenance" score={health.maintenance} />
            <SubScore label="Parts" score={health.parts} />
            <SubScore label="Recency" score={health.recency} />
          </div>
        </div>
      </div>

      {health.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
          {health.badges.map((badge) => (
            <BadgePill key={badge.id} badge={badge} />
          ))}
        </div>
      )}
    </div>
  )
}
