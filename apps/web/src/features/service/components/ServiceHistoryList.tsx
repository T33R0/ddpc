'use client'

import React, { useState, useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { MaintenanceLog } from '@repo/types'

interface HistoryLog {
  id: string
  event_date: string
  odometer: number | null
  notes: string | null
  service_item_id: string | null
  service_item?: {
    id: string
    name: string
    category_id: string
  }
  service_category?: {
    id: string
    name: string
  }
}

interface GroupedLogs {
  categoryId: string
  categoryName: string
  logs: HistoryLog[]
  latestDate: Date
}

interface ServiceHistoryListProps {
  vehicleId: string
}

export function ServiceHistoryList({ initialHistory = [] }: ServiceHistoryListProps & { initialHistory?: MaintenanceLog[] }) {
  const [groupedLogs, setGroupedLogs] = useState<GroupedLogs[]>([])

  const groupAndSetLogs = React.useCallback((logs: HistoryLog[], itemMap: Record<string, { category_id?: string; category_name?: string; name: string }>) => {
    const grouped: Record<string, GroupedLogs> = {}

    logs.forEach((log) => {
      let categoryId = 'uncategorized'
      let categoryName = 'Uncategorized'
      let serviceItemName = 'Service Entry'

      if (log.service_item_id && itemMap[log.service_item_id]) {
        const info = itemMap[log.service_item_id]
        categoryId = info?.category_id || 'uncategorized'
        categoryName = info?.category_name || 'Uncategorized'
        serviceItemName = info?.name || 'Service Entry'
      } else if (log.service_item) {
        serviceItemName = log.service_item.name
      }

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          categoryId,
          categoryName,
          logs: [],
          latestDate: new Date(0),
        }
      }

      const logDate = new Date(log.event_date)
      grouped[categoryId]!.logs.push({
        ...log,
        service_item: {
          id: log.service_item_id || '',
          name: serviceItemName,
          category_id: categoryId
        },
        service_category: {
          id: categoryId,
          name: categoryName
        }
      })

      if (logDate > grouped[categoryId]!.latestDate) {
        grouped[categoryId]!.latestDate = logDate
      }
    })

    const sortedGroups = Object.values(grouped)
      .map((group) => ({
        ...group,
        logs: group.logs.sort(
          (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        ),
      }))
      .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime())

    setGroupedLogs(sortedGroups)
  }, [])

  const fetchMetadataAndGroup = React.useCallback(async (logs: HistoryLog[]) => {
    // Extract service item IDs
    const serviceItemIds = [
      ...new Set(
        logs
          .map((log) => log.service_item_id)
          .filter((id): id is string => id !== null)
      ),
    ]

    if (serviceItemIds.length === 0) {
      // No items with IDs, just group as Uncategorized
      groupAndSetLogs(logs, {})
      return
    }

    try {
      // Fetch service items with categories
      const supabase = createClient()
      const { data: itemsData, error } = await supabase
        .from('service_items')
        .select('id, name, category_id, service_categories(id, name)')
        .in('id', serviceItemIds)

      if (error) throw error

      const itemMap: Record<string, { category_id?: string; category_name?: string; name: string }> = {}
      if (itemsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        itemsData.forEach((item: any) => {
          const categoryName = Array.isArray(item.service_categories)
            ? item.service_categories[0]?.name
            : item.service_categories?.name || 'Uncategorized'

          itemMap[item.id] = {
            ...item,
            category_name: categoryName
          }
        })
      }

      groupAndSetLogs(logs, itemMap)
    } catch (err) {
      console.error('Error fetching metadata:', err)
      // Fallback to uncategorized
      groupAndSetLogs(logs, {})
    }
  }, [groupAndSetLogs])

  const processLogs = React.useCallback((logsData: MaintenanceLog[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logsWithMetadata = logsData.map((log: any) => ({
      ...log,
      // Ensure structure matches HistoryLog interface
      service_item: log.service_item || undefined,
      service_category: undefined, // We don't have this yet
      service_item_id: log.service_item_id || null
    }))

    // We need to fetch metadata for these items to group them correctly
    fetchMetadataAndGroup(logsWithMetadata)
  }, [fetchMetadataAndGroup])

  useEffect(() => {
    // If we have initial history, process it immediately
    if (initialHistory.length > 0) {
      processLogs(initialHistory)
    } else {
      setGroupedLogs([])
    }
  }, [initialHistory, processLogs])

  const formatLogEntry = (log: HistoryLog) => {
    const serviceName = log.service_item?.name || 'Service Entry'
    const date = format(new Date(log.event_date), 'MMM d, yyyy')
    const odometer = log.odometer ? ` @ ${log.odometer.toLocaleString()} miles` : ''
    return `${serviceName}: ${date}${odometer}`
  }

  if (groupedLogs.length === 0 && initialHistory.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            No service history logged. Click &apos;Add Service Entry&apos; to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {groupedLogs.map((group) => (
        <Card
          key={group.categoryId}
          className="bg-card border-border"
        >
          <CardHeader>
            <CardTitle className="text-lg text-foreground">{group.categoryName}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {group.logs.map((log) => (
                <li key={log.id}>
                  <Link
                    href={`#`}
                    className="block text-muted-foreground hover:text-foreground transition-colors py-2 border-b border-border last:border-0"
                  >
                    <div className="font-medium">{formatLogEntry(log)}</div>
                    {log.notes && (
                      <div className="text-sm text-muted-foreground mt-1">{log.notes}</div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
