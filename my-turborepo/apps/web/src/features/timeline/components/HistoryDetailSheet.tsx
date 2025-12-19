'use client'

import React from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerOverlay,
  DrawerPortal,
} from '@repo/ui/drawer'
import { VehicleEvent } from '../lib/getVehicleEvents'
import { HistoryDetailContent } from './HistoryDetailContent'

interface HistoryDetailSheetProps {
  event: VehicleEvent | null
  isOpen: boolean
  onClose: () => void
}

export function HistoryDetailSheet({ event, isOpen, onClose }: HistoryDetailSheetProps) {
  return (
    <Drawer direction="right" open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 bg-black/40" />
        <DrawerContent className="bg-background flex flex-col fixed bottom-0 right-0 h-full w-full sm:max-w-lg mt-0 border-l rounded-none shadow-xl outline-none z-50 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {event && (
              <>
                <DrawerHeader className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <DrawerTitle className="text-xl font-bold">
                      {event.type === 'maintenance' ? 'Maintenance Detail' :
                        event.type === 'modification' ? 'Modification Detail' :
                          'Mileage Detail'}
                    </DrawerTitle>
                    <DrawerClose asChild>
                      <button className="rounded-full p-2 hover:bg-muted transition-colors">
                        <span className="sr-only">Close</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </DrawerClose>
                  </div>
                  <DrawerDescription className="sr-only">
                    Details for {event.title}
                  </DrawerDescription>
                </DrawerHeader>

                <HistoryDetailContent event={event} onClose={onClose} />
              </>
            )}
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}
