'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClickOutside } from './hooks/use-click-outside';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Button } from './button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from './modal';

interface UserAccountDropdownProps {
  user?: {
    email?: string | null;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
    };
  };
  onSignOut?: () => void;
}

export function UserAccountDropdown({ user, onSignOut }: UserAccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const ref = useClickOutside(() => setIsOpen(false));
  const router = useRouter();

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n) => n[0])
        .join('');
    }
    if (user?.email) {
      const email = user.email;
      if (email && email.length > 0) {
        return email.charAt(0).toUpperCase();
      }
    }
    return 'U';
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
        <Avatar>
          {user?.user_metadata?.avatar_url && <AvatarImage src={user.user_metadata.avatar_url} alt="User avatar" />}
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 right-0 w-48 mt-2 p-1 bg-black/80 backdrop-blur-md rounded-md shadow-lg flex flex-col gap-1"
          >
            <Link
              href="/account"
              className="px-3 py-2 text-sm text-left text-white hover:bg-white/10 rounded-md transition-colors w-full block"
              onClick={() => setIsOpen(false)}
            >
              Account
            </Link>
            <button
              onClick={() => {
                onSignOut?.();
                setIsOpen(false);
                router.push('/');
                setShowLogoutModal(true);
              }}
              className="px-3 py-2 text-sm text-left text-white hover:bg-white/10 rounded-md transition-colors w-full"
            >
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}
