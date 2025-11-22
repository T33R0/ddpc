'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { IssueReportForm } from './IssueReportForm';

export function ReportProblem() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [pathname, isOpen]);

  // Don't show the button on the /issues page itself to avoid redundancy
  if (pathname === '/issues') {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] rounded-full w-14 h-14 p-0 shadow-2xl hover:shadow-3xl transition-all duration-200 bg-red-600 hover:bg-red-700 text-white border-2 border-white/20"
        aria-label="Report a Problem"
        title="Report a Problem"
      >
        <AlertCircle className="w-8 h-8" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report a Problem</DialogTitle>
            <DialogDescription>
              Help us improve by reporting issues you encounter.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <IssueReportForm 
              defaultUrl={currentUrl} 
              onSuccess={() => setIsOpen(false)}
              onCancel={() => setIsOpen(false)}
              isModal={true}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
