'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalDescription } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ListTodo, Loader2, Trash2 } from 'lucide-react'
import { createWishlistItem, updateWishlistItem, deleteWishlistItem } from '../actions'
import { useRouter } from 'next/navigation'
import { toast } from '@repo/ui/use-toast'

interface AddWishlistDialogProps {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  onSuccess?: () => void
  initialData?: any // Added for edit mode
}

export function AddWishlistDialog({ isOpen, onClose, vehicleId, onSuccess, initialData }: AddWishlistDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const [priority, setPriority] = useState<string>('3')
  const [status, setStatus] = useState<string>('wishlist')

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || '')
      setCategory(initialData.category || '')
      setUrl(initialData.purchase_url || '')
      setPrice(initialData.purchase_price ? String(initialData.purchase_price) : '')
      setPriority(initialData.priority ? String(initialData.priority) : '3')
      setStatus(initialData.status)
    } else if (isOpen && !initialData) {
      // Reset for creating new
      setName('')
      setCategory('')
      setUrl('')
      setPrice('')
      setPriority('3')
      setStatus('wishlist')
    }
    setError(null)
  }, [isOpen, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      let result;

      const payload = {
        vehicle_id: vehicleId,
        name,
        category: category || null,
        url: url || null,
        price: price ? parseFloat(price) : null,
        priority: parseInt(priority),
        status: status
      }

      if (initialData) {
        result = await updateWishlistItem(initialData.id, payload)
      } else {
        result = await createWishlistItem(payload)
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to save item')
      }

      // Reset and close
      if (!initialData) {
        setName('')
        setCategory('')
        setUrl('')
        setPrice('')
        setPriority('3')
        setStatus('wishlist')
      }

      toast({
        title: initialData ? "Item Updated" : "Item Added",
        description: initialData ? "Wishlist item updated successfully." : "Added to your wishlist.",
      })

      onSuccess?.()
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!initialData) return
    if (!confirm('Are you sure you want to delete this item?')) return

    setIsDeleting(true)
    try {
      await deleteWishlistItem(initialData.id, vehicleId)
      toast({
        title: "Item Deleted",
        description: "Item removed from wishlist.",
      })
      onSuccess?.()
      onClose()
      router.refresh()
    } catch (err) {
      setError("Failed to delete item")
      setIsDeleting(false)
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="sm:max-w-lg p-0">
        <ModalHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col gap-1">
            <ModalTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              {initialData ? 'Edit Item' : 'Add to Wishlist'}
            </ModalTitle>
            <ModalDescription>
              {initialData ? 'Update item details.' : 'Save a part or service item for later.'}
            </ModalDescription>
          </div>
          {initialData && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          )}
        </ModalHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brembo Brake Kit"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engine">Engine</SelectItem>
                <SelectItem value="suspension">Suspension</SelectItem>
                <SelectItem value="brakes">Brakes</SelectItem>
                <SelectItem value="interior">Interior</SelectItem>
                <SelectItem value="exterior">Exterior</SelectItem>
                <SelectItem value="wheels & tires">Wheels & Tires</SelectItem>
                <SelectItem value="drivetrain">Drivetrain</SelectItem>
                <SelectItem value="consumable">Consumable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Low</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5 - High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wishlist">Wishlist</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ModalFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Update Item' : 'Add Item'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
