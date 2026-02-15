'use client';

import React from 'react';
import { AuthProvider } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';
import { FinancialsDashboard } from '../../features/financials/financials-dashboard';

function FinancialsPageContent() {
  return (
    <section className="relative py-12 bg-background min-h-screen">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-brand" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-accent to-info" />
      </div>
      <div className="relative container px-4 md:px-6 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Financials</h1>
          <p className="text-lg text-muted-foreground mt-2">Track your vehicle ownership costs and expenses</p>
        </div>
        <FinancialsDashboard />
      </div>
    </section>
  );
}

export default function FinancialsPage() {
  return (
    <AuthProvider supabase={supabase}>
      <FinancialsPageContent />
    </AuthProvider>
  );
}
