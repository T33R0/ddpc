'use client';

import { OgmaChatWindow } from '@/features/ogma/components/OgmaChatWindow'; // Using features path as discussed but ensuring export exists
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function OgmaAdminPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Auth Protection
    useEffect(() => {
        setMounted(true);
        if (!loading && (!user || (profile && profile.role !== 'admin'))) {
            router.push('/');
        }
    }, [user, profile, loading, router]);

    if (!mounted || loading || !user || (profile && profile.role !== 'admin')) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* 
                User requested "Task 1: The Parent Container".
                "It must be a rigid flex container that fills the remaining screen height exactly".
                I am omitting the Sidebar/Header from this specific file if the user implies 
                "OgmaAdminPage" IS the whole page content.
                However, existing structure suggests Layout wraps this.
                I will stick to the SIMPLEST implementation requested.
             */}
            <OgmaChatWindow />
        </div>
    );
}