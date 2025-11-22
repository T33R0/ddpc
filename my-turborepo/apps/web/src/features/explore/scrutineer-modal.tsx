'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@repo/ui/dialog';
import { ChatWindow } from '@repo/ui/chat-window';

type ScrutineerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ScrutineerModal({ open, onOpenChange }: ScrutineerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0">
        <DialogTitle className="sr-only">Scrutineer AI Assistant</DialogTitle>
        <DialogDescription className="sr-only">
          Chat with Scrutineer AI to explore vehicles and get recommendations
        </DialogDescription>
        <ChatWindow onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

