'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Archive, Trash2 } from 'lucide-react';
import { ChatSidebar } from '@/features/ogma/components/ChatSidebar';
import { archiveChatSession } from '@/features/ogma/actions';
import { OgmaChatWindow } from '@/features/ogma/components/OgmaChatWindow'; // Import new component

export default function ChatPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Auth Protection
    useEffect(() => {
        setMounted(true);
        if (!loading && (!user || (profile && profile.role !== 'admin'))) {
            router.push('/');
        }
    }, [user, profile, loading, router]);

    if (!mounted || loading || !user || (profile && profile.role !== 'admin')) {
        return <div className="h-screen w-full bg-background" />;
    }

    // Handle Session Selection
    const handleSelectSession = (id: string | null) => {
        setCurrentSessionId(id);
        // Note: The ChatWindow will handle clearing its own messages via useEffect on sessionId change
    };

    return (
        <div className="flex h-[calc(100vh-64px)] w-full bg-background text-foreground font-sans overflow-hidden">
            {/* Sidebar */}
            <ChatSidebar
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                refreshTrigger={refreshTrigger}
            />

            {/* Main Content Area - THE SHELL */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-background relative">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-background/80 backdrop-blur-md shrink-0 z-20 h-16">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Terminal className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold tracking-tight">Ogma</h1>
                            <p className="text-[10px] text-muted-foreground font-mono">Trinity Synergistic Intelligence</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {currentSessionId && (
                            <button
                                onClick={async () => {
                                    try {
                                        await archiveChatSession(currentSessionId);
                                        setCurrentSessionId(null);
                                        setRefreshTrigger(p => p + 1);
                                    } catch (e) { console.error(e) }
                                }}
                                className="p-2 hover:bg-muted rounded-full transition-colors group"
                                title="Archive Session"
                            >
                                <Archive className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>
                        )}
                    </div>
                </header>

                {/* Chat Window Component - Consumes rest of height */}
                <div className="flex-1 overflow-hidden relative">
                    <OgmaChatWindow sessionId={currentSessionId} />
                </div>
            </div>
        </div>
    );
}