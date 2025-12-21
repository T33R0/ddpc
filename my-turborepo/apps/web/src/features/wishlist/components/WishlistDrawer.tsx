'use client'

import React, { useEffect, useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerBody } from '@repo/ui/drawer'
import { Button } from '@repo/ui/button'
import { Plus, ListTodo } from 'lucide-react'
import { AddWishlistDialog } from './AddWishlistDialog'
import { WishlistItemCard } from './WishlistItem'
import { getWishlistItems } from '../actions'

interface WishlistDrawerProps {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  isOwner: boolean
}

export function WishlistDrawer({ isOpen, onClose, vehicleId, isOwner }: WishlistDrawerProps) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const data = await getWishlistItems(vehicleId)
      setItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchItems()
    }
  }, [isOpen, vehicleId])

  // Split items
  const activeItems = items.filter(i => i.status !== 'purchased')
  const purchasedItems = items.filter(i => i.status === 'purchased')

  return (
    <>
      <Drawer direction="right" open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="h-full rounded-none w-[85vw] sm:max-w-md bg-background">
             <DrawerHeader className="md:mx-0 md:max-w-full border-b-0 px-6 pt-6">
               <DrawerTitle>Wishlist</DrawerTitle>
               <DrawerDescription>
                  Things you want to buy for your build.
               </DrawerDescription>
             </DrawerHeader>

             <div className="px-6 pb-2 md:mx-0 md:max-w-full">
               {isOwner && (
                 <Button className="w-full" onClick={() => setIsAddOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                 </Button>
               )}
             </div>

             <DrawerBody className="overflow-y-auto px-6 md:mx-0 md:max-w-full">
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading...</div>
                ) : items.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <ListTodo className="w-8 h-8 opacity-50" />
                    <p>Your wishlist is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeItems.length > 0 && (
                      <div className="space-y-2">
                         <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</h4>
                         {activeItems.map(item => (
                           <WishlistItemCard key={item.id} item={item} onUpdate={fetchItems} />
                         ))}
                      </div>
                    )}

                    {purchasedItems.length > 0 && (
                      <div className="space-y-2">
                         <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchased History</h4>
                         {purchasedItems.map(item => (
                           <WishlistItemCard key={item.id} item={item} onUpdate={fetchItems} />
                         ))}
                      </div>
                    )}
                  </div>
                )}
             </DrawerBody>
             <DrawerFooter className="md:mx-0 md:max-w-full px-6 pb-6">
               <Button variant="outline" onClick={onClose}>Close</Button>
             </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AddWishlistDialog
         isOpen={isAddOpen}
         onClose={() => setIsAddOpen(false)}
         vehicleId={vehicleId}
         onSuccess={fetchItems}
      />
    </>
  )
}
