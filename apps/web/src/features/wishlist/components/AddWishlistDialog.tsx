'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalDescription } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ListTodo, Loader2, Trash2, PackageOpen } from 'lucide-react'
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
  const [quantity, setQuantity] = useState('1')
  const [purchasedAt, setPurchasedAt] = useState('')
  const [priority, setPriority] = useState<string>('3')
  const [status, setStatus] = useState<string>('wishlist')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || '')
      setCategory(initialData.category || '')
      setUrl(initialData.purchase_url || '')
      setPrice(initialData.purchase_price ? String(initialData.purchase_price) : '')
      setQuantity(initialData.quantity ? String(initialData.quantity) : '1')
      const dateVal = initialData.purchased_at ? new Date(initialData.purchased_at) : null;
      const dateStr: string = (dateVal && !isNaN(dateVal.getTime())) ? dateVal.toISOString().substring(0, 10) : '';
      setPurchasedAt(dateStr)
      setPriority(initialData.priority ? String(initialData.priority) : '3')
      setPriority(initialData.priority ? String(initialData.priority) : '3')
      setStatus(initialData.status)
      setTrackingNumber(initialData.tracking_number || '')
      setCarrier(initialData.carrier || '')
    } else if (isOpen && !initialData) {
      // Reset for creating new
      setName('')
      setCategory('')
      setUrl('')
      setPrice('')
      setQuantity('1')
      setPurchasedAt('')
      setPriority('3')
      setPriority('3')
      setStatus('wishlist')
      setTrackingNumber('')
      setCarrier('')
    }
    setError(null)
    setIsDeleting(false) // Reset deleting state
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
        quantity: parseInt(quantity) || 1,
        purchased_at: (status === 'ordered' || status === 'in_stock') && purchasedAt ? new Date(purchasedAt).toISOString() : null,
        priority: parseInt(priority),
        status: status,
        tracking_number: status === 'ordered' ? trackingNumber : null,
        carrier: status === 'ordered' ? carrier : null
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
        setQuantity('1')
        setPurchasedAt('')
        setPriority('3')
        setPriority('3')
        setStatus('wishlist')
        setTrackingNumber('')
        setCarrier('')
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
      const result = await deleteWishlistItem(initialData.id, vehicleId)

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete item')
      }

      toast({
        title: "Item Deleted",
        description: "Item removed from wishlist.",
      })
      onSuccess?.()
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item")
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
              {initialData?.order_id && (
                <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-info/10 text-info rounded text-xs font-medium w-fit">
                    <PackageOpen className="w-3.5 h-3.5" />
                    <span>Linked to Order</span>
                </div>
              )}
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
              <Label htmlFor="price">Price (Each)</Label>
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
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                inputMode="numeric"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          {price && quantity && (
            <div className="flex justify-between items-center bg-muted/50 p-2 rounded text-sm px-3">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-mono font-medium">${(parseFloat(price) * (parseInt(quantity) || 1)).toFixed(2)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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



          {status === 'ordered' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="1Z99..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier (Optional)</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger id="carrier">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usps">USPS</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="fedex">FedEx</SelectItem>
                    <SelectItem value="dhl">DHL</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {(status === 'ordered' || status === 'in_stock') && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <Label htmlFor="purchasedAt">Purchased Date</Label>
              <Input
                id="purchasedAt"
                type="date"
                value={purchasedAt}
                onChange={(e) => setPurchasedAt(e.target.value)}
              />
            </div>
          )}

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
