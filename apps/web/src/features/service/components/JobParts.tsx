'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, Loader2, Package } from 'lucide-react'
import { Button } from '@repo/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table'
import { getJobParts, addPartToJob, removePartFromJob, MaintenancePart, PartInventory } from '../actions/parts'
import { AddPartDialog } from './AddPartDialog'

interface JobPartsProps {
  maintenanceLogId: string
}

export function JobParts({ maintenanceLogId }: JobPartsProps) {
  const [parts, setParts] = useState<MaintenancePart[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchParts = useCallback(async () => {
    try {
      const result = await getJobParts(maintenanceLogId)
      if (result.success && result.data) {
        setParts(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch parts', error)
    } finally {
      setIsLoading(false)
    }
  }, [maintenanceLogId])

  useEffect(() => {
    fetchParts()
  }, [fetchParts])

  const handleAddPart = async (part: PartInventory, quantity: number) => {
    setIsUpdating(true)
    try {
      const result = await addPartToJob(maintenanceLogId, part.id, quantity)
      if (result.success) {
        await fetchParts()
      } else {
        alert(result.error || 'Failed to add part')
      }
    } catch (error) {
      console.error(error)
      alert('Error adding part')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemovePart = async (partId: string, quantity: number) => {
    if (!confirm('Are you sure you want to remove this part?')) return

    setIsUpdating(true)
    try {
      const result = await removePartFromJob(maintenanceLogId, partId, quantity)
      if (result.success) {
        await fetchParts()
      } else {
        alert(result.error || 'Failed to remove part')
      }
    } catch (error) {
      console.error(error)
      alert('Error removing part')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalPartsCost = parts.reduce((sum, item) => {
    return sum + ((item.part.cost || 0) * item.quantity_used)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Parts List</h3>
          <p className="text-sm text-muted-foreground">
            Parts used in this service job. Costs are automatically added to the job total.
          </p>
        </div>
        <AddPartDialog onAddPart={handleAddPart} />
      </div>

      {parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/10 border-dashed">
          <Package className="h-10 w-10 text-muted-foreground mb-4" />
          <h4 className="text-lg font-medium text-muted-foreground">No parts added</h4>
          <p className="text-sm text-muted-foreground text-center max-w-sm mt-2">
            Click &quot;Add Part&quot; to record parts used from your inventory or create new ones.
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Name</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-center">Qty Used</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((item) => (
                <TableRow key={item.part_id}>
                  <TableCell className="font-medium">{item.part.name}</TableCell>
                  <TableCell>{item.part.part_number || '-'}</TableCell>
                  <TableCell className="text-right">
                    {item.part.cost ? `$${item.part.cost.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity_used}</TableCell>
                  <TableCell className="text-right font-medium">
                    {item.part.cost
                      ? `$${(item.part.cost * item.quantity_used).toFixed(2)}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemovePart(item.part_id, item.quantity_used)}
                      disabled={isUpdating}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-bold">Total Parts Cost:</TableCell>
                <TableCell className="text-right font-bold">${totalPartsCost.toFixed(2)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
