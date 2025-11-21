'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'

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

export function ServiceHistoryList({ vehicleId }: ServiceHistoryListProps) {
  const [groupedLogs, setGroupedLogs] = useState<GroupedLogs[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchHistoryLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId])

  const fetchHistoryLogs = async () => {
    setIsLoading(true)
    try {
      // First fetch the logs
      const { data: logsData, error: logsError } = await supabase
        .from('maintenance_log')
        .select('id, event_date, odometer, notes, service_item_id')
        .eq('user_vehicle_id', vehicleId)
        .eq('status', 'History')
        .order('event_date', { ascending: false })

      if (logsError) throw logsError

      if (!logsData || logsData.length === 0) {
        setGroupedLogs([])
        return
      }

      // Get unique service_item_ids
      const serviceItemIds = [
        ...new Set(
          logsData
            .map((log) => log.service_item_id)
            .filter((id): id is string => id !== null)
        ),
      ]

      // Fetch service items with their categories
      const serviceItemsMap: Record<string, { id: string; name: string; category_id: string; category_name: string }> = {}

      if (serviceItemIds.length > 0) {
        // Fetch service items
        const { data: itemsData, error: itemsError } = await supabase
          .from('service_items')
          .select('id, name, category_id')
          .in('id', serviceItemIds)

        if (!itemsError && itemsData) {
          // Get unique category IDs
          const categoryIds = [...new Set(itemsData.map((item) => item.category_id))]

          // Fetch categories
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('service_categories')
            .select('id, name')
            .in('id', categoryIds)

          const categoriesMap: Record<string, string> = {}
          if (!categoriesError && categoriesData) {
            categoriesData.forEach((cat) => {
              categoriesMap[cat.id] = cat.name
            })
          }

          // Build map of service items with category info
          itemsData.forEach((item) => {
            serviceItemsMap[item.id] = {
              id: item.id,
              name: item.name,
              category_id: item.category_id,
              category_name: categoriesMap[item.category_id] || 'Uncategorized',
            }
          })
        }
      }

      // Group logs by category
      const grouped: Record<string, GroupedLogs> = {}

      logsData.forEach((log: any) => {
        const serviceItem = log.service_item_id ? serviceItemsMap[log.service_item_id] : null
        const categoryId = serviceItem?.category_id || 'uncategorized'
        const categoryName = serviceItem?.category_name || 'Uncategorized'
        const serviceItemName = serviceItem?.name || 'Service Entry'

        if (!grouped[categoryId]) {
          grouped[categoryId] = {
            categoryId,
            categoryName,
            logs: [],
            latestDate: new Date(0), // Will be updated
          }
        }

        const logDate = new Date(log.event_date)
        grouped[categoryId]!.logs.push({
          ...log,
          service_item: serviceItem
            ? {
              id: serviceItem.id,
              name: serviceItemName,
              category_id: categoryId,
            }
            : undefined,
          service_category: {
            id: categoryId,
            name: categoryName,
          },
        })

        // Update latest date for this category
        if (logDate > grouped[categoryId]!.latestDate) {
          grouped[categoryId]!.latestDate = logDate
        }
      })

      // Convert to array and sort groups by latest date (most recent first)
      const sortedGroups = Object.values(grouped)
        .map((group) => ({
          ...group,
          // Sort logs within group by date (descending)
          logs: group.logs.sort(
            (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
          ),
        }))
        .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime())

      setGroupedLogs(sortedGroups)
    } catch (err) {
      console.error('Error fetching history logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatLogEntry = (log: HistoryLog) => {
    const serviceName = log.service_item?.name || 'Service Entry'
    const date = format(new Date(log.event_date), 'MMM d, yyyy')
    const odometer = log.odometer ? ` @ ${log.odometer.toLocaleString()} miles` : ''
    return `${serviceName}: ${date}${odometer}`
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading service history...</div>
    )
  }

  if (groupedLogs.length === 0) {
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
                    href={`#`} // TODO: Link to future "Job Detail Page" - e.g., `/vehicle/${vehicleId}/service/${log.id}`
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

