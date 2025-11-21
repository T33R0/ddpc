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
  ModalClose,
} from '@repo/ui/modal';
import { useAuth } from '../lib/auth';

export function LogoutModal() {
  const { showLogoutModal, setShowLogoutModal } = useAuth();

  return (
    <Modal open={showLogoutModal} onOpenChange={setShowLogoutModal}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Logout Successful</ModalTitle>
        </ModalHeader>
        <ModalDescription>
          You have successfully logged out of your account.
        </ModalDescription>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">
              Thanks!
            </Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
