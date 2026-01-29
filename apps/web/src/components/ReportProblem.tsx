'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
} from '@repo/ui/modal';
import { Button } from '@repo/ui/button';
import { IssueReportForm } from './IssueReportForm';

export interface ReportProblemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportProblemModal({ isOpen, onOpenChange }: ReportProblemModalProps) {
  const [currentUrl, setCurrentUrl] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [pathname, isOpen]);

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-lg text-left">
        <ModalHeader>
          <ModalTitle>Report a Problem</ModalTitle>
          <ModalDescription>
            Help us improve by reporting issues you encounter.
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          <IssueReportForm
            defaultUrl={currentUrl}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
            isModal={true}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export function ReportProblem() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Don't show the button on the /issues page itself to avoid redundancy
  if (pathname === '/issues') {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="destructive"
        size="icon"
        className="rounded-full shadow-sm border border-white/20 pointer-events-auto"
        aria-label="Report a Problem"
        title="Report a Problem"
      >
        <AlertCircle className="size-5" strokeWidth={2.5} />
      </Button>

      <ReportProblemModal isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
