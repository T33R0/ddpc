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

  const iconSize = variant === 'inline' ? "w-5 h-5" : "w-6 h-6";
  
  // Base classes for the button appearance
  const baseButtonClasses = "rounded-full p-0 bg-red-600 hover:bg-red-700 text-white border-white/20 flex items-center justify-center transition-all duration-200 cursor-pointer pointer-events-auto";
  
  // Variant specific classes
  const variantClasses = variant === 'inline'
    ? "w-8 h-8 border shadow-sm"
    : "w-10 h-10 border-2 shadow-xl hover:shadow-2xl";

  const TriggerButton = (
    <Button
      onClick={() => setIsOpen(true)}
      className={`${baseButtonClasses} ${variantClasses}`}
      aria-label="Report a Problem"
      title="Report a Problem"
    >
      <AlertCircle className={iconSize} strokeWidth={2.5} />
    </Button>
  );

  return (
    <>
      {variant === 'fixed-top-left' ? (
        <div className="fixed top-4 left-4 z-[9999]">
          {TriggerButton}
        </div>
      ) : (
        TriggerButton
      )}

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
