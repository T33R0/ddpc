'use client';

import React from 'react';
import { Button } from '@repo/ui/button';
import { ScrutineerPopup } from '@repo/ui/scrutineer-popup';

export function ScrutineerButton() {
  const [isPopupOpen, setPopupOpen] = React.useState(false);

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setPopupOpen(true)}
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12"
        >
          S
        </Button>
      </div>
      <ScrutineerPopup isOpen={isPopupOpen} onClose={() => setPopupOpen(false)} />
    </>
  );
}
