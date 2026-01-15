'use client';

import { OgmaChatWindow } from '@/features/ogma/components/OgmaChatWindow';
import { ChatSidebar } from '@/features/ogma/components/ChatSidebar';
import { ModelSelectorButton } from '@/features/ogma/components/ModelSelectorButton';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function OgmaAdminPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Lifted State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Auth Protection
    useEffect(() => {
        setMounted(true);
        if (!loading && (!user || (profile && profile.role !== 'admin'))) {
            router.push('/');
        }
    }, [user, profile, loading, router]);

    // Create a new session if none exists on mount (optional - maybe default to New Chat)
    // For now, we'll let sessionId be null which implies "New Chat" in the window

    if (!mounted || loading || !user || (profile && profile.role !== 'admin')) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
            {/* Rigid Container */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Fixed Width with Sidebar */}
                <div
                    className={`flex flex-col border-r border-border bg-muted/10 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'
                        }`}
                >
                    {/* Model Selector - Only visible when open or collapsed icon? 
                        The mock-up says "Top of Left Panel".
                        Let's hide it when collapsed for cleanliness or show icon only.
                        For simplicity in Phase 1, we just render it. The sidebar collapse logic 
                        is internal to ChatSidebar usually, but we lifted the state for the page layout.
                        
                        Wait, ChatSidebar handles its own width in the original code: 
                        `isOpen ? "w-56 md:w-64" : "w-12 md:w-16"`
                        
                        We should probably wrap ModelSelector and ChatSidebar in a div that matches that width
                        OR put ModelSelector INSIDE the sidebar flux.
                        
                        The plan says: "Left Panel (Fixed Width): Contains a new 'Model Selector' button at the top, the ChatSidebar in the middle..."
                        
                        Let's try to pass `isOpen` down to ModelSelector or just hide it.
                    */}

                    {isSidebarOpen && <ModelSelectorButton />}

                    <ChatSidebar
                        currentSessionId={sessionId}
                        onSelectSession={setSessionId}
                        isOpen={isSidebarOpen}
                        setIsOpen={setIsSidebarOpen}
                        refreshTrigger={0} // We can stick a counter here if we need to force refresh list
                    />
                </div>

                {/* Right Panel - Chat Window */}
                <div className="flex-1 relative min-w-0 flex flex-col">
                    {/* 
                        Key prop is crucial here. 
                        When sessionId changes, we want a fresh chat window 
                        so existing messages clear and useChat re-inits 
                    */}
                    <OgmaChatWindow key={sessionId || 'new'} sessionId={sessionId} />
                </div>
            </div>
        </div>
    );
}