'use client';

import React from 'react';
import { Button } from '@repo/ui/button';
import { DDSRPopup } from '@repo/ui/ddsr-popup';
import { MonitorPlay } from 'lucide-react';

export function DDSRButton() {
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
          <MonitorPlay className="w-6 h-6" />
        </Button>
      </div>
      <DDSRPopup isOpen={isPopupOpen} onClose={() => setPopupOpen(false)} />
    </>
  );
}
