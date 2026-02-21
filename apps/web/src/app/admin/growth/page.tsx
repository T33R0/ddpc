'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Car,
  Wrench,
  Fuel,
  CheckCircle,
  RotateCcw,
  TrendingUp,
  Target,
  Loader2,
  Database,
} from 'lucide-react'

interface GrowthMetrics {
  signups: number
  vehicles_added: number
  maintenance_logged: number
  fuel_logged: number
  onboarding_completed: number
  return_visits: number
  daily_signups: { day: string; count: number }[] | null
  daily_active_users: { day: string; count: number }[] | null
  seven_day_retention: number | null
  activation_rate: number | null
  totals: {
    users: number
    vehicles: number
    fuel_logs: number
    maintenance_logs: number
  }
}

const PERIODS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

export default function GrowthPage() {
  const [metrics, setMetrics] = useState<GrowthMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePeriod, setActivePeriod] = useState(30)

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/analytics/growth?days=${activePeriod}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setMetrics(data)
      } catch {
        setError('Failed to load growth metrics')
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [activePeriod])

  return (
    <div className="px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Growth Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conversion funnel and retention KPIs
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setActivePeriod(p.days)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activePeriod === p.days
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-24 text-destructive">{error}</div>
      ) : metrics ? (
        <>
          {/* Primary KPI Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              label="Signups"
              value={metrics.signups}
              icon={<Users className="w-4 h-4" />}
            />
            <StatCard
              label="Vehicles Added"
              value={metrics.vehicles_added}
              icon={<Car className="w-4 h-4" />}
            />
            <StatCard
              label="Activation Rate"
              value={metrics.activation_rate !== null ? `${metrics.activation_rate}%` : '—'}
              icon={<Target className="w-4 h-4" />}
              subtitle="% who add a vehicle"
            />
            <StatCard
              label="7-Day Retention"
              value={metrics.seven_day_retention !== null ? `${metrics.seven_day_retention}%` : '—'}
              icon={<TrendingUp className="w-4 h-4" />}
              subtitle="% who return after 7d"
            />
          </div>

          {/* Activity Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              label="Maintenance Logged"
              value={metrics.maintenance_logged}
              icon={<Wrench className="w-4 h-4" />}
            />
            <StatCard
              label="Fuel Logged"
              value={metrics.fuel_logged}
              icon={<Fuel className="w-4 h-4" />}
            />
            <StatCard
              label="Onboarding Completed"
              value={metrics.onboarding_completed}
              icon={<CheckCircle className="w-4 h-4" />}
            />
            <StatCard
              label="Return Visits"
              value={metrics.return_visits}
              icon={<RotateCcw className="w-4 h-4" />}
            />
          </div>

          {/* All-Time Totals */}
          {metrics.totals && (
            <div className="bg-card border border-border rounded-lg p-4 sm:p-5 mb-8">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Database className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">all-time totals</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-lg sm:text-xl font-bold text-foreground">{metrics.totals.users}</p>
                  <p className="text-xs text-muted-foreground">users</p>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-foreground">{metrics.totals.vehicles}</p>
                  <p className="text-xs text-muted-foreground">vehicles</p>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-foreground">{metrics.totals.fuel_logs}</p>
                  <p className="text-xs text-muted-foreground">fuel logs</p>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-foreground">{metrics.totals.maintenance_logs}</p>
                  <p className="text-xs text-muted-foreground">maintenance logs</p>
                </div>
              </div>
            </div>
          )}

          {/* Daily Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <MiniBarChart
              title="Daily Signups"
              data={metrics.daily_signups}
            />
            <MiniBarChart
              title="Daily Active Users"
              data={metrics.daily_active_users}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  subtitle,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}

function MiniBarChart({
  title,
  data,
}: {
  title: string
  data: { day: string; count: number }[] | null
}) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          No data yet
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const BAR_AREA_HEIGHT = 112 // px available for bars

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      <div className="flex items-end gap-1" style={{ height: BAR_AREA_HEIGHT }}>
        {data.map((d, i) => {
          const barHeight = Math.max((d.count / maxCount) * BAR_AREA_HEIGHT, 2)
          const dateLabel = new Date(d.day + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end group"
              style={{ height: BAR_AREA_HEIGHT }}
            >
              <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                {d.count}
              </span>
              <div
                className="w-full bg-primary/80 rounded-t-sm transition-all group-hover:bg-primary"
                style={{ height: barHeight }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {data.map((d, i) => {
          const dateLabel = new Date(d.day + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
          // For large datasets, show every Nth label to avoid overlap
          const step = data.length > 20 ? Math.ceil(data.length / 10) : data.length > 10 ? 2 : 1
          const showLabel = i % step === 0 || i === data.length - 1
          return (
            <span key={i} className="flex-1 text-[9px] text-muted-foreground truncate text-center">
              {showLabel ? dateLabel : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}
