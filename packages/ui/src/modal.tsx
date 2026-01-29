'use client';

import React from 'react';
import { cn } from './lib/utils';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
// Drawer imports removed

const ModalContext = React.createContext<{ isMobile: boolean } | null>(null);

function useContext() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('Trigger or Content must be used within <Modal>');
  }
  return context;
}

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
  dialogProps?: React.ComponentProps<typeof Dialog>;
  drawerProps?: any; // Kept for type compatibility but ignored
};

const Modal = ({ dialogProps, open, onOpenChange, children }: ModalProps) => {
  // Always use Dialog
  const Component = Dialog;
  const props = dialogProps;

  return (
    <ModalContext.Provider value={{ isMobile: false }}>
      <Component open={open} onOpenChange={onOpenChange} {...props}>
        {children}
      </Component>
    </ModalContext.Provider>
  );
};

type ModalTriggerProps = {
  className?: string;
  children: React.ReactNode;
  asChild?: boolean;
  drawerProps?: any;
  popoverProps?: React.ComponentProps<typeof DialogTrigger>;
};

const ModalTrigger = ({ className, children, asChild, popoverProps }: ModalTriggerProps) => {
  const Component = DialogTrigger;
  const props = popoverProps;

  return (
    <Component className={className} asChild={asChild} {...props}>
      {children}
    </Component>
  );
};

type ModalCloseProps = {
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
  drawerProps?: any;
  popoverProps?: React.ComponentProps<typeof DialogClose>;
};

const ModalClose = ({ className, children, asChild, popoverProps }: ModalCloseProps) => {
  const Component = DialogClose;
  const props = popoverProps;

  return (
    <Component className={className} asChild={asChild} {...props}>
      {children}
    </Component>
  );
};

type ModalContentProps = {
  children: React.ReactNode;
  className?: string;
  drawerProps?: any;
  popoverProps?: React.ComponentProps<typeof DialogContent>;
} & React.ComponentProps<'div'>;

const ModalContent = ({ className, children, popoverProps, ...rest }: ModalContentProps) => {
  const Component = DialogContent;
  const props = popoverProps;

  return (
    <Component className={className} {...props} {...rest}>
      {children}
    </Component>
  );
};

const ModalHeader = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const Component = DialogHeader;
  return <Component className={className} {...props} />;
};

type ModalTitleProps = {
  className?: string;
  children: React.ReactNode;
  drawerProps?: any;
  popoverProps?: React.ComponentProps<typeof DialogTitle>;
};

const ModalTitle = ({ className, children, popoverProps }: ModalTitleProps) => {
  const Component = DialogTitle;
  const props = popoverProps;

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

type ModalDescriptionProps = {
  className?: string;
  children: React.ReactNode;
  drawerProps?: any;
  popoverProps?: React.ComponentProps<typeof DialogDescription>;
};

const ModalDescription = ({ className, children, popoverProps }: ModalDescriptionProps) => {
  const Component = DialogDescription;
  const props = popoverProps;

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

const ModalBody = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return <div className={cn('px-4 py-6', className)} {...props} />;
};

const ModalFooter = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const Component = DialogFooter;
  return <Component className={className} {...props} />;
};

export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
};
