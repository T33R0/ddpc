'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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

interface ReportProblemProps {
  variant?: 'fixed-top-left' | 'inline';
}

export function ReportProblem({ variant = 'fixed-top-left' }: ReportProblemProps) {
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

  const buttonClasses = variant === 'inline'
    ? "w-8 h-8 rounded-full p-0 bg-red-600 hover:bg-red-700 text-white border border-white/20 flex items-center justify-center shadow-sm"
    : "fixed top-4 left-4 z-[9999] w-10 h-10 rounded-full p-0 bg-red-600 hover:bg-red-700 text-white border-2 border-white/20 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-200";

  const iconSize = variant === 'inline' ? "w-5 h-5" : "w-6 h-6";

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={buttonClasses}
        aria-label="Report a Problem"
        title="Report a Problem"
      >
        <AlertCircle className={iconSize} strokeWidth={2.5} />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md text-left">
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
