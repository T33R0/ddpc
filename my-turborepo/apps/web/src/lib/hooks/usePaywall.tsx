'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../auth';
import { PaywallModal } from '@/components/paywall/PaywallModal';

interface PaywallContextType {
  isPro: boolean;
  isLoading: boolean;
  triggerPaywall: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isLoading: boolean;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export function PaywallProvider({ children }: { children: React.ReactNode }) {
<<<<<<< HEAD
  const { profile, loading } = useAuth();
=======
  const { profile, loading: authLoading } = useAuth();
>>>>>>> 2c04332e406aa74c3c65330cf5c093e8c04d5138
  const [isOpen, setIsOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    setIsPro(profile?.plan === 'pro');
  }, [profile]);

  const triggerPaywall = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
<<<<<<< HEAD
    <PaywallContext.Provider value={{ isPro, triggerPaywall, isOpen, setIsOpen, isLoading: loading }}>
=======
    <PaywallContext.Provider value={{ isPro, isLoading: authLoading, triggerPaywall, isOpen, setIsOpen }}>
>>>>>>> 2c04332e406aa74c3c65330cf5c093e8c04d5138
      {children}
      <PaywallModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </PaywallContext.Provider>
  );
}

export function usePaywall() {
  const context = useContext(PaywallContext);
  if (context === undefined) {
    throw new Error('usePaywall must be used within a PaywallProvider');
  }
  return context;
}
