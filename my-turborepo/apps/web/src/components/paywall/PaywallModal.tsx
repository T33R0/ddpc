'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@repo/ui/modal';
import { Button } from '@repo/ui/button';
import { Crown, Sparkles, Check } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/account');
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="sm:max-w-md overflow-hidden p-0 border-0">
        {/* Header Background */}
        <div className="relative h-32 bg-gradient-to-br from-primary via-indigo-500 to-secondary flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-white/40 to-transparent" />
          </div>
          <Crown className="w-16 h-16 text-white drop-shadow-lg" />
        </div>

        <div className="p-6">
          <ModalHeader className="mb-4 text-center">
            <ModalTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              Unlock Pro Features
            </ModalTitle>
            <ModalDescription className="text-center">
              Take your build management to the next level.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-primary/10 text-primary rounded-full p-1">
                <Check className="w-3 h-3" />
              </div>
              <div>
                <p className="font-medium text-foreground">Advanced Planning</p>
                <p className="text-sm text-muted-foreground">Create unlimited service and mod plans.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-primary/10 text-primary rounded-full p-1">
                <Check className="w-3 h-3" />
              </div>
              <div>
                <p className="font-medium text-foreground">Console Access</p>
                <p className="text-sm text-muted-foreground">Full access to the Console dashboard and insights.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-primary/10 text-primary rounded-full p-1">
                <Check className="w-3 h-3" />
              </div>
              <div>
                <p className="font-medium text-foreground">Duplication Tools</p>
                <p className="text-sm text-muted-foreground">Quickly duplicate jobs and plans to save time.</p>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold py-6"
            onClick={handleUpgrade}
          >
            <Sparkles className="w-4 h-4 mr-2 fill-current" />
            Upgrade to Pro
          </Button>

          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
              Maybe Later
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
