'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClickOutside } from './hooks/use-click-outside';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

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
  const ref = useClickOutside(() => setIsOpen(false));

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
              }}
              className="px-3 py-2 text-sm text-left text-white hover:bg-white/10 rounded-md transition-colors w-full"
            >
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
