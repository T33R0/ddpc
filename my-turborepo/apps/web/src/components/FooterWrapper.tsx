'use client';

import { Footer } from '@repo/ui/footer';
import { usePathname } from 'next/navigation';

export function FooterWrapper() {
  const pathname = usePathname();

  if (pathname === '/') {
    return null;
  }

  return <Footer />;
}

