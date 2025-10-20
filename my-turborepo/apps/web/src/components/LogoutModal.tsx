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
      <ModalContent className="bg-black/90 border-neutral-800">
        <ModalHeader>
          <ModalTitle className="text-white">Logout Successful</ModalTitle>
        </ModalHeader>
        <ModalDescription className="text-gray-300">
          You have successfully logged out of your account.
        </ModalDescription>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
              Thanks!
            </Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
