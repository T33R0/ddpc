'use client';

import React from 'react';
import { Button } from '@repo/ui/button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@repo/ui/modal';
import { useAuth } from '@/lib/auth';

export function LogoutModal() {
  const { showLogoutModal, setShowLogoutModal } = useAuth();

  return (
    <Modal open={showLogoutModal} onOpenChange={setShowLogoutModal}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Logout Successful</ModalTitle>
          <ModalDescription>
            You have successfully logged out of your account.
          </ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
            Thanks!
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
