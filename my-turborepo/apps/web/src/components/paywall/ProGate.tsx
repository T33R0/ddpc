'use client';

import React from 'react';
import { usePaywall } from '@/lib/hooks/usePaywall';
import { Button } from '@repo/ui/button';
import { Lock } from 'lucide-react';

interface ProGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  blur?: boolean;
}

export function ProGate({ children, fallback, blur = true }: ProGateProps) {
  const { isPro, isLoading, triggerPaywall } = usePaywall();

  // Show loading state or nothing while checking permissions
  // This prevents the "Locked" screen from flashing during initial load
  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Blurred Content */}
      <div className={`absolute inset-0 ${blur ? 'filter blur-md pointer-events-none select-none opacity-50' : ''}`}>
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] p-6 text-center">
         <div className="bg-card border border-border rounded-xl p-8 shadow-2xl max-w-md w-full flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
               <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Pro Feature Locked</h2>
            <p className="text-muted-foreground mb-8">
              This feature requires a Pro subscription. Upgrade now to unlock full access.
            </p>
            <Button
              onClick={triggerPaywall}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
            >
              Unlock Access
            </Button>
         </div>
      </div>
    </div>
  );
}
