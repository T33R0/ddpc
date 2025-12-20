'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Wrench, Archive, CheckCircle2, ArchiveRestore, Trash2 } from 'lucide-react'
import { VehicleMod } from '../lib/getVehicleModsData'

interface EditModDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vehicleId: string
  mod: VehicleMod | null
}

export function EditModDialog({ isOpen, onClose, onSuccess, vehicleId, mod }: EditModDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset state when modal opens/closes or mod changes
  useEffect(() => {
    if (isOpen) {
      setError('')
      setDeleteConfirmationName('')
      setShowDeleteConfirm(false)
    }
  }, [isOpen, mod])

  if (!mod) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await updateMod(e)
  }

  const updateMod = async (e?: React.FormEvent<HTMLFormElement>, statusOverride?: string) => {
    if (e) e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const form = e ? e.currentTarget : document.querySelector('form#edit-mod-form') as HTMLFormElement
    if (!form) return

    const formData = new FormData(form)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const notes = description ? `${title}\n\n${description}` : title

    // Use override status if provided, otherwise form value
    const status = statusOverride || formData.get('status') as string

    const data = {
      modId: mod.id,
      vehicleId,
      notes,
      status,
      cost: formData.get('cost') as string,
      odometer: formData.get('odometer') as string,
      event_date: formData.get('event_date') as string,
    }

    try {
      const response = await fetch('/api/garage/update-mod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update modification')
      }

      onClose()
      onSuccess()
    } catch (error) {
      console.error('Error updating modification:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleArchive = () => {
    // Assuming form is filled, just override status
    updateMod(undefined, 'archived')
  }

  const handleComplete = () => {
    updateMod(undefined, 'installed')
  }

  const handleRestore = () => {
    // Restore to 'planned' as a safe default, or 'installed' if it was installed?
    // Usually restoring implies bringing it back to active state.
    // Let's set to 'planned' if it was archived, user can change it.
    // Or we can just set it to 'planned' or keep user choice if we tracked it, but we don't.
    // Let's default to 'planned' for now.
    updateMod(undefined, 'planned')
  }

  const handleDelete = async () => {
    if (deleteConfirmationName !== mod.title) {
        return // Should be disabled anyway
    }

    setIsDeleting(true)
    try {
        const response = await fetch('/api/garage/delete-mod', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modId: mod.id, vehicleId }),
        })

        if (!response.ok) {
            const result = await response.json()
            throw new Error(result.error || 'Failed to delete modification')
        }

        onClose()
        onSuccess()
    } catch (error) {
        console.error('Error deleting modification:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
        setIsDeleting(false)
    }
  }

  const isArchived = mod.status === 'archived'
  const isInstalled = ['installed', 'tuned'].includes(mod.status)

  // Format date for input
  const dateString = mod.event_date ? new Date(mod.event_date).toISOString().split('T')[0] : ''

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="sm:max-w-md p-0">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Edit Modification
          </ModalTitle>
          <ModalDescription>
            {isArchived ? 'View or restore archived modification.' : 'Update details for this modification.'}
          </ModalDescription>
        </ModalHeader>

        {showDeleteConfirm ? (
             <div className="px-6 pb-6 space-y-4 pt-4">
                 <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-destructive text-sm">
                     Warning: This action cannot be undone.
                 </div>
                 <p className="text-sm text-muted-foreground">
                    To confirm deletion, please type the modification title: <span className="font-bold text-foreground">{mod.title}</span>
                 </p>
                 <div className="space-y-2">
                    <Label>Modification Title</Label>
                    <Input
                       value={deleteConfirmationName}
                       onChange={(e) => setDeleteConfirmationName(e.target.value)}
                       placeholder="Type title here..."
                       autoFocus
                    />
                 </div>
                 <ModalFooter className="gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                    <Button
                       variant="destructive"
                       onClick={handleDelete}
                       disabled={deleteConfirmationName !== mod.title || isDeleting}
                    >
                       {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                 </ModalFooter>
             </div>
        ) : (
            <form id="edit-mod-form" onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Modification Title *</Label>
                <Input
                  name="title"
                  id="title"
                  defaultValue={mod.title}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  name="description"
                  id="description"
                  defaultValue={mod.description}
                  className="min-h-[60px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  name="status"
                  id="status"
                  defaultValue={mod.status}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="planned">Planned</option>
                  <option value="ordered">Ordered</option>
                  <option value="installed">Installed</option>
                  <option value="tuned">Tuned</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    name="cost"
                    id="cost"
                    type="number"
                    step="0.01"
                    defaultValue={mod.cost}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odometer">Odometer (miles)</Label>
                  <Input
                    name="odometer"
                    id="odometer"
                    type="number"
                    defaultValue={mod.odometer}
                    placeholder="Current mileage"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">Date *</Label>
                <Input
                  name="event_date"
                  id="event_date"
                  type="date"
                  defaultValue={dateString}
                  required
                />
              </div>

              <ModalFooter className="gap-2 pt-4 flex-wrap sm:flex-nowrap">
                {/* Actions Group - Left Aligned on Desktop if possible, but ModalFooter flexes right usually */}
                {/* We'll use order or custom layout if needed, but ModalFooter usually justifies end */}

                <div className="flex w-full justify-between items-center">
                    <div className="flex gap-2">
                        {isArchived ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleRestore}
                                    disabled={isSubmitting}
                                >
                                    <ArchiveRestore className="h-4 w-4 mr-2" />
                                    Restore
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isSubmitting}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleArchive}
                                disabled={isSubmitting}
                                className="border-warning/50 text-warning hover:bg-warning/10 hover:border-warning"
                            >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                         <Button
                          type="button"
                          variant="ghost"
                          onClick={onClose}
                        >
                          Cancel
                        </Button>

                        {!isArchived && !isInstalled && (
                            <Button
                                type="button"
                                onClick={handleComplete}
                                disabled={isSubmitting}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Complete
                            </Button>
                        )}

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
              </ModalFooter>
            </form>
        )}
      </ModalContent>
    </Modal>
  )
}
