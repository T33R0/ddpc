'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import { TimeoutError, withTimeout } from '@/lib/with-timeout'
import { Button } from '@repo/ui/button'
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

export function ServiceHistoryList({ vehicleId, initialHistory = [] }: ServiceHistoryListProps & { initialHistory?: MaintenanceLog[] }) {
  const [groupedLogs, setGroupedLogs] = useState<GroupedLogs[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // If we have initial history, process it immediately
    if (initialHistory.length > 0) {
      processLogs(initialHistory)
    } else {
      // Only fetch if no initial history (or if we want to refresh, but for now let's rely on server data)
      // Actually, if initialHistory is empty, it might mean there are no logs, OR we need to fetch.
      // But since the server fetches *all* history, empty means empty.
      // So we can skip fetching on mount if we trust the server data.
      setGroupedLogs([])
    }
  }, [initialHistory])

  const processLogs = (logsData: any[]) => {
    // Group logs by category (logic moved from fetchHistoryLogs)
    // We need to map the raw logs to the structure we need
    // The server returns logs with service_item and service_category expanded?
    // Let's check the server query in page.tsx.
    // It fetches:
    /*
      id, event_date, odometer, service_item_id, notes, service_provider, cost, status,
      service_item:service_items ( id, name )
    */
    // It does NOT fetch category info directly. We might need to infer it or fetch it?
    // Or we can just group by "Uncategorized" if we don't have it, to save time.
    // Or we can fetch categories client side if needed.
    // But wait, the previous code fetched categories.

    // Let's try to group by service_item.category_id if available, or fetch metadata if missing.
    // Since we want to be fast, let's just group by service_item name for now or "Service History".
    // Actually, the previous code fetched categories to group them.
    // Let's keep it simple: Just list them chronologically for now, or group by Month/Year?
    // The previous UI grouped by Category.

    // If we want to maintain Category grouping, we need category info.
    // The server query in page.tsx DOES NOT return category_id or category name.
    // We should update the server query to return that too.

    // For now, let's just render them in a single list to verify data loading.
    // Or we can do a quick client-side fetch for metadata only (much lighter than fetching all logs).

    // Let's stick to the previous grouping logic but use the passed logs.
    // We still need to fetch metadata (categories) if not present.

    const logsWithMetadata = logsData.map(log => ({
      ...log,
      // Ensure structure matches HistoryLog interface
      service_item: log.service_item || undefined,
      service_category: undefined // We don't have this yet
    }))

    // We need to fetch metadata for these items to group them correctly
    fetchMetadataAndGroup(logsWithMetadata)
  }

  const fetchMetadataAndGroup = async (logs: HistoryLog[]) => {
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
      const { data: itemsData, error } = await supabase
        .from('service_items')
        .select('id, name, category_id, service_categories(id, name)')
        .in('id', serviceItemIds)

      if (error) throw error

      const itemMap: Record<string, any> = {}
      if (itemsData) {
        itemsData.forEach((item: any) => {
          itemMap[item.id] = {
            ...item,
            category_name: item.service_categories?.name || 'Uncategorized'
          }
        })
      }

      groupAndSetLogs(logs, itemMap)
    } catch (err) {
      console.error('Error fetching metadata:', err)
      // Fallback to uncategorized
      groupAndSetLogs(logs, {})
    }
  }

  const groupAndSetLogs = (logs: HistoryLog[], itemMap: Record<string, any>) => {
    const grouped: Record<string, GroupedLogs> = {}

    logs.forEach((log) => {
      let categoryId = 'uncategorized'
      let categoryName = 'Uncategorized'
      let serviceItemName = 'Service Entry'

      if (log.service_item_id && itemMap[log.service_item_id]) {
        const info = itemMap[log.service_item_id]
        categoryId = info.category_id || 'uncategorized'
        categoryName = info.category_name || 'Uncategorized'
        serviceItemName = info.name
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
  }

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
            No service history logged. Click 'Add Service Entry' to get started.
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

