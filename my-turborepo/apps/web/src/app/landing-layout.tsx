'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow relative z-10">{children}</main>
    </div>
  );
}
