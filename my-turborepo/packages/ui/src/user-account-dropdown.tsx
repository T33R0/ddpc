'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClickOutside } from './hooks/use-click-outside';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import {
  User,
  LayoutDashboard,
  Settings,
  LogOut,
  Moon,
  Sun,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Switch } from './switch';

interface UserAccountDropdownProps {
  user?: {
    email?: string | null;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
      username?: string;
      preferred_username?: string;
      user_name?: string;
    };
  };
  onSignOut?: () => Promise<void> | void;
  userBasePath?: string;
  theme?: string;
  onThemeChange?: (theme: string) => void;
  onReportProblem?: () => void;
  onGiveTestimonial?: () => void;
}

export function UserAccountDropdown({
  user,
  onSignOut,
  userBasePath,
  theme,
  onThemeChange,
  onReportProblem,
  onGiveTestimonial
}: UserAccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const ref = useClickOutside(() => setIsOpen(false));

  const handleSignOut = async () => {
    if (!onSignOut || isSigningOut) {
      setIsOpen(false);
      return;
    }

    setIsSigningOut(true);
    try {
      await Promise.resolve(onSignOut());
    } catch (error) {
      console.error('Error while signing out:', error);
    } finally {
      setIsSigningOut(false);
      setIsOpen(false);
    }
  };

  const getScopedHref = (path: string) => {
    const normalized = path.startsWith('/') ? path : `/${path}`;

    if (!userBasePath) {
      return normalized;
    }

    if (normalized === '/') {
      return userBasePath;
    }

    return `${userBasePath}${normalized}`;
  };

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

  const getDisplayName = () => {
    return user?.user_metadata?.full_name ||
      user?.user_metadata?.username ||
      user?.user_metadata?.preferred_username ||
      user?.user_metadata?.user_name ||
      user?.email?.split('@')[0] ||
      'User';
  };

  const toggleTheme = () => {
    if (onThemeChange) {
      onThemeChange(theme === 'dark' ? 'light' : 'dark');
    }
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
            className="absolute z-10 right-0 w-64 mt-2 bg-black/90 backdrop-blur-md rounded-xl shadow-xl border border-neutral-800 overflow-hidden"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-neutral-800">
              <p className="text-sm font-medium text-white truncate">{getDisplayName()}</p>
              <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
            </div>

            <div className="p-1">
              {/* Dashboard */}
              <Link
                href={getScopedHref('/hub')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard size={16} />
                <span>My Hub</span>
              </Link>

              {/* Account Settings */}
              <Link
                href={getScopedHref('/account')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings size={16} />
                <span>Account</span>
              </Link>

              {/* Theme Switcher */}
              <div className="flex items-center justify-between px-3 py-2 text-sm text-neutral-300 hover:bg-white/10 rounded-md transition-colors cursor-pointer" onClick={toggleTheme}>
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  <span>Theme</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 capitalize">{theme}</span>
                </div>
              </div>

              {/* Give Testimonial */}
              {onGiveTestimonial && (
                <button
                  onClick={() => {
                    onGiveTestimonial();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-md transition-colors w-full text-left"
                >
                  <Sparkles size={16} />
                  <span>Give Testimonial</span>
                </button>
              )}

              {/* Report / Feedback */}
              {onReportProblem && (
                <button
                  onClick={() => {
                    onReportProblem();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-md transition-all w-full text-left border border-[hsl(var(--accent))] shadow-[0_0_30px_hsl(var(--accent)/0.6)]"
                >
                  <AlertCircle size={16} />
                  <span>Report / Feedback</span>
                </button>
              )}
            </div>

            <div className="h-px bg-neutral-800 mx-1 my-1" />

            <div className="p-1">
              {/* Upgrade to Pro */}
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Sparkles size={16} />
                <span>Upgrade to Pro</span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition-colors w-full text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LogOut size={16} />
                <span>{isSigningOut ? 'Logging out...' : 'Log out'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
