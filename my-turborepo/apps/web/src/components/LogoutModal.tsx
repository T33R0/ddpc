'use client';

import React from 'react';
import { Button } from '@repo/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@repo/ui/dialog';
import { useAuth } from '@/lib/auth';

export function LogoutModal() {
  const { showLogoutModal, setShowLogoutModal } = useAuth();

  return (
    <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Logout Successful</DialogTitle>
          <DialogDescription>
            You have successfully logged out of your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
            Thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
