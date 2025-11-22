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
    <div className={`flex flex-col min-h-screen ${isLanding ? 'bg-background' : 'bg-background'}`}>
      {isLanding && (
         <div
           aria-hidden="true"
           className="fixed inset-0 grid grid-cols-2 -space-x-52 opacity-20 pointer-events-none z-0"
         >
           <div className="blur-[100px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
           <div className="blur-[100px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
         </div>
      )}
      <main className="flex-grow relative z-10">{children}</main>
    </div>
  );
}
