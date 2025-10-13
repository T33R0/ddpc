'use client';

import React from 'react';
import { Button } from './button';
import { X } from 'lucide-react';

interface ScrutineerPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScrutineerPopup({ isOpen, onClose }: ScrutineerPopupProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg w-80">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Scrutineer</h3>
        <Button onClick={onClose} variant="ghost" size="sm">
          <X size={16} />
        </Button>
      </div>
      <p>Scrutineer features coming soon.</p>
    </div>
  );
}
