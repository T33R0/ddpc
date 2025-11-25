'use client';

import React, { createContext, useContext, useState } from 'react';
import { ReportProblemModal } from '../components/ReportProblem';

type ReportModalContextType = {
    open: () => void;
    close: () => void;
    isOpen: boolean;
};

const ReportModalContext = createContext<ReportModalContextType | undefined>(undefined);

export function ReportModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    return (
        <ReportModalContext.Provider value={{ open, close, isOpen }}>
            {children}
            <ReportProblemModal isOpen={isOpen} onOpenChange={setIsOpen} />
        </ReportModalContext.Provider>
    );
}

export function useReportModal() {
    const context = useContext(ReportModalContext);
    if (context === undefined) {
        throw new Error('useReportModal must be used within a ReportModalProvider');
    }
    return context;
}
