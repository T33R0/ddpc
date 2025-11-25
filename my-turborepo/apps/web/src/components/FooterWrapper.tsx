'use client';

import { Footer } from '@repo/ui/footer';
import { usePathname } from 'next/navigation';
import { useReportModal } from '../lib/report-modal-context';

export function FooterWrapper() {
  const pathname = usePathname();
  const { open: openReportModal } = useReportModal();

  if (pathname === '/') {
    return null;
  }

  return <Footer onReportProblem={openReportModal} />;
}

