'use client'

import React, { useState, useEffect } from 'react'
import { VehicleEvent } from '../lib/getVehicleEvents'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Label } from '@repo/ui/label'
import { updateMaintenanceLog, updateMod, updateMileage } from '../actions/timeline-actions'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/dialog'
import { cn } from '@repo/ui/lib/utils'

interface HistoryDetailContentProps {
  event: VehicleEvent
  onClose: () => void
}

export function HistoryDetailContent({ event, onClose }: HistoryDetailContentProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Dialog States
  const [showEditWarning, setShowEditWarning] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    title: event.title,
    date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
    odometer: event.odometer?.toString() || '',
    cost: event.cost?.toString() || '',
    description: event.description || '', // Maps to 'notes' in DB usually
    serviceProvider: event.service_provider || '',
    status: event.status || '',
  })

  // Load initial data
  useEffect(() => {
    setFormData({
      title: event.title,
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      odometer: event.odometer?.toString() || '',
      cost: event.cost?.toString() || '',
      description: event.description || '',
      serviceProvider: event.service_provider || '',
      status: event.status || '',
    })
    setIsEditing(false)
  }, [event])

  const handleStartEdit = () => {
    setShowEditWarning(true)
  }

  const confirmEditMode = () => {
    setShowEditWarning(false)
    setIsEditing(true)
  }

  const handleSaveClick = () => {
    setShowSaveConfirmation(true)
  }

  const confirmSave = async () => {
    setShowSaveConfirmation(false)
    setIsSaving(true)

    try {
      let result

      if (event.type === 'maintenance') {
        result = await updateMaintenanceLog(event.id, {
          event_date: new Date(formData.date || new Date().toISOString()),
          odometer: formData.odometer ? parseInt(formData.odometer) : undefined,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          notes: formData.description,
          service_provider: formData.serviceProvider || undefined,
          title: formData.title, // Pass title to update service item
        })
      } else if (event.type === 'modification') {
        result = await updateMod(event.id, {
          event_date: new Date(formData.date || new Date().toISOString()),
          odometer: formData.odometer ? parseInt(formData.odometer) : undefined,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          notes: formData.description,
          status: formData.status,
          title: formData.title,
        })
      } else if (event.type === 'mileage') {
        // Use the original event date if it's supposed to be read-only in terms of time,
        // but here we just pass whatever date is in formData (which comes from date input).
        // If the date input was disabled, formData.date remains unchanged.
        result = await updateMileage(event.id, {
          date: new Date(formData.date || new Date().toISOString()),
          odometer: parseInt(formData.odometer),
        })
      }

      if (result?.success) {
        setIsEditing(false)
        onClose()
        router.refresh()
      } else {
        alert('Failed to save changes: ' + result?.error)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('An error occurred while saving.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    // Reset form data
    setFormData({
      title: event.title,
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      odometer: event.odometer?.toString() || '',
      cost: event.cost?.toString() || '',
      description: event.description || '',
      serviceProvider: event.service_provider || '',
      status: event.status || '',
    })
    setIsEditing(false)
  }

  const isMileage = event.type === 'mileage'

  return (
    <div className="p-6 space-y-6">
      {/* Read Only Header Info */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className={cn(
            "text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider",
            event.type === 'maintenance' ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" :
            event.type === 'modification' ? "bg-lime-500/10 text-lime-600 dark:text-lime-400" :
            "bg-orange-500/10 text-orange-600 dark:text-orange-400"
          )}>
            {event.type}
          </span>
          {event.id && <span className="text-xs text-muted-foreground font-mono">{event.id}</span>}
        </div>
      </div>

      <div className="space-y-4">
        {/* Title / Service Item */}
        <div className="space-y-2">
          <Label>Title / Service Item</Label>
          {isEditing && !isMileage ? (
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          ) : (
            <div className="text-lg font-bold text-foreground">{formData.title}</div>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Date</Label>
          {isEditing ? (
             <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              disabled={isMileage} // Read-only for mileage as per request "except recorded time"
            />
          ) : (
            <div className="text-foreground">{new Date(formData.date || new Date().toISOString()).toLocaleDateString()}</div>
          )}
          {isEditing && isMileage && <p className="text-xs text-muted-foreground">Recorded time cannot be edited.</p>}
        </div>

        {/* Odometer */}
        <div className="space-y-2">
          <Label>Odometer (mi)</Label>
          {isEditing ? (
            <Input
              type="number"
              value={formData.odometer}
              onChange={(e) => setFormData({...formData, odometer: e.target.value})}
            />
          ) : (
            <div className="text-foreground">
              {formData.odometer ? parseInt(formData.odometer).toLocaleString() : '-'}
            </div>
          )}
        </div>

        {/* Cost - Maintenance & Mod only */}
        {event.type !== 'mileage' && (
          <div className="space-y-2">
            <Label>Cost ($)</Label>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
              />
            ) : (
              <div className="text-foreground">
                {formData.cost ? `$${parseFloat(formData.cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
              </div>
            )}
          </div>
        )}

        {/* Service Provider - Maintenance only */}
        {event.type === 'maintenance' && (
          <div className="space-y-2">
            <Label>Service Provider</Label>
            {isEditing ? (
              <Input
                value={formData.serviceProvider}
                onChange={(e) => setFormData({...formData, serviceProvider: e.target.value})}
                placeholder="e.g., Dealer, DIY"
              />
            ) : (
              <div className="text-foreground">{formData.serviceProvider || '-'}</div>
            )}
          </div>
        )}

        {/* Status - Mod only */}
        {event.type === 'modification' && (
          <div className="space-y-2">
            <Label>Status</Label>
            {isEditing ? (
               <Input
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                placeholder="e.g., Installed, Planned"
              />
            ) : (
              <div className="text-foreground">{formData.status || '-'}</div>
            )}
          </div>
        )}

        {/* Description / Notes */}
        <div className="space-y-2">
          <Label>Notes / Description</Label>
          {isEditing ? (
            <Textarea
              className="min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          ) : (
            <div className="text-foreground whitespace-pre-wrap">{formData.description || 'No notes available.'}</div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-6 flex justify-end gap-3 border-t">
        {!isEditing ? (
          <Button onClick={handleStartEdit} variant="outline">
            Edit Record
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveClick} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        )}
      </div>

      {/* Warning Dialog */}
      <Dialog open={showEditWarning} onOpenChange={setShowEditWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit History Record</DialogTitle>
            <DialogDescription>
              You are about to modify a historical record. This will update the source data and reflected everywhere in the application.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditWarning(false)}>Cancel</Button>
            <Button onClick={confirmEditMode}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <Dialog open={showSaveConfirmation} onOpenChange={setShowSaveConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Changes?</DialogTitle>
            <DialogDescription>
              Are you sure you want to save these changes? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveConfirmation(false)}>Cancel</Button>
            <Button onClick={confirmSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
