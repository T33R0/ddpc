'use client';

import React from 'react';
import { Dialog, DialogContent } from '@repo/ui/dialog';
import { ChatWindow } from '@repo/ui/chat-window';

type ScrutineerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ScrutineerModal({ open, onOpenChange }: ScrutineerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0">
        <ChatWindow onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

