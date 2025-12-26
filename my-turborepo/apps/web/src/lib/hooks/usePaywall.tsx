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
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    console.log('[PAYWALL] Profile changed:', { 
      hasProfile: !!profile, 
      plan: profile?.plan, 
      role: profile?.role,
      loading 
    });
    const newIsPro = profile?.plan === 'pro';
    console.log('[PAYWALL] Setting isPro to:', newIsPro, '(profile?.plan === "pro":', profile?.plan === 'pro', ')');
    setIsPro(newIsPro);
  }, [profile, loading]);

  const triggerPaywall = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <PaywallContext.Provider value={{ isPro, triggerPaywall, isOpen, setIsOpen, isLoading: loading }}>
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
