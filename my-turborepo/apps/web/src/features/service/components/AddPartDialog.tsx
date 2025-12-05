'use client'

import { useState } from 'react'
import { Plus, Search, Loader2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { ScrollArea } from '@repo/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { createInventoryPart, searchInventory, PartInventory } from '../actions/parts'

interface AddPartDialogProps {
  onAddPart: (part: PartInventory, quantity: number) => Promise<void>
}

export function AddPartDialog({ onAddPart }: AddPartDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'create'>('search')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PartInventory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPart, setSelectedPart] = useState<PartInventory | null>(null)
  const [quantity, setQuantity] = useState(1)

  // Create state
  const [newPart, setNewPart] = useState({
    name: '',
    part_number: '',
    cost: '',
    vendor_name: '',
    vendor_link: '',
    quantity: '1', // Inventory starting quantity
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const result = await searchInventory(query)
      if (result.success && result.data) {
        setSearchResults(result.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectPart = (part: PartInventory) => {
    setSelectedPart(part)
    setQuantity(1)
  }

  const handleAddSelected = async () => {
    if (!selectedPart) return
    await onAddPart(selectedPart, quantity)
    setOpen(false)
    resetState()
  }

  const handleCreateAndAdd = async () => {
    if (!newPart.name) return

    setIsCreating(true)
    try {
      // 1. Create part in inventory
      const result = await createInventoryPart({
        name: newPart.name,
        part_number: newPart.part_number || undefined,
        cost: newPart.cost ? parseFloat(newPart.cost) : undefined,
        vendor_name: newPart.vendor_name || undefined,
        vendor_link: newPart.vendor_link || undefined,
        quantity: parseInt(newPart.quantity) || 1,
      })

      if (result.success && result.data) {
        // 2. Add to job (using the entered quantity as well, assuming they want to use 1 of the new part immediately?
        // Or maybe asking for separate usage quantity? For now assume usage is 1 or matching inventory creation if reasonable.
        // Let's default to using 1 of the newly created parts.)
        await onAddPart(result.data, 1)
        setOpen(false)
        resetState()
      } else {
        alert('Failed to create part')
      }
    } catch (error) {
      console.error(error)
      alert('Error creating part')
    } finally {
      setIsCreating(false)
    }
  }

  const resetState = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedPart(null)
    setQuantity(1)
    setNewPart({
      name: '',
      part_number: '',
      cost: '',
      vendor_name: '',
      vendor_link: '',
      quantity: '1',
    })
    setActiveTab('search')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Part
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Part to Job</DialogTitle>
          <DialogDescription>
            Select a part from your inventory or create a new one.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'search' | 'create')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Inventory</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or part number..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <ScrollArea className="h-[200px] border rounded-md p-2">
              {isSearching ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((part) => (
                    <div
                      key={part.id}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer border ${
                        selectedPart?.id === part.id
                          ? 'bg-accent border-primary'
                          : 'hover:bg-muted border-transparent'
                      }`}
                      onClick={() => handleSelectPart(part)}
                    >
                      <div>
                        <div className="font-medium">{part.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {part.part_number} • In Stock: {part.quantity}
                        </div>
                      </div>
                      {part.cost && (
                        <div className="text-sm font-medium">
                          ${part.cost.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchQuery.length > 1 ? (
                <div className="text-center text-muted-foreground py-8">
                  No parts found.
                  <Button variant="link" onClick={() => setActiveTab('create')}>
                    Create new?
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Type to search...
                </div>
              )}
            </ScrollArea>

            {selectedPart && (
              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="flex-1">
                  <div className="font-medium">{selectedPart.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Selected
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="quantity">Use Qty:</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedPart.quantity > 0 ? selectedPart.quantity : undefined}
                    className="w-20"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
               <Button onClick={handleAddSelected} disabled={!selectedPart}>
                 Add Selected
               </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newPart.name}
                  onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                  placeholder="Oil Filter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="part_number">Part Number</Label>
                <Input
                  id="part_number"
                  value={newPart.part_number}
                  onChange={(e) => setNewPart({ ...newPart, part_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPart.cost}
                  onChange={(e) => setNewPart({ ...newPart, cost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_qty">Initial Stock Qty</Label>
                <Input
                  id="stock_qty"
                  type="number"
                  min="0"
                  value={newPart.quantity}
                  onChange={(e) => setNewPart({ ...newPart, quantity: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="vendor">Vendor Name</Label>
                <Input
                  id="vendor"
                  value={newPart.vendor_name}
                  onChange={(e) => setNewPart({ ...newPart, vendor_name: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCreateAndAdd} disabled={isCreating || !newPart.name}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create & Add (1)
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
