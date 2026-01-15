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
    const [modelConfig, setModelConfig] = useState({
        synthesizer: 'anthropic/claude-3.5-haiku',
        architect: 'deepseek/deepseek-v3.2',
        visionary: 'anthropic/claude-3.5-haiku',
        engineer: 'google/gemini-2.5-flash'
    });

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
        <div className="flex flex-col h-screen w-full overflow-hidden bg-background pt-16">
            {/* Rigid Container */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Fixed Width */}
                <div className="w-72 flex flex-col border-r border-border bg-muted/10 shrink-0">
                    <div className="flex-none p-3 border-b border-border">
                        <ModelSelectorButton
                            config={modelConfig}
                            onChange={setModelConfig}
                        />
                    </div>

                    {/* Sidebar Container - Important: flex-1 min-h-0 for nested scroll */}
                    <div className="flex-1 min-h-0 relative">
                        <ChatSidebar
                            currentSessionId={sessionId}
                            onSelectSession={setSessionId}
                            embedded={true}
                        />
                    </div>
                </div>

                {/* Right Panel - Chat Window */}
                <div className="flex-1 relative min-w-0 flex flex-col">
                    {/* 
                        Key prop is crucial here. 
                        When sessionId changes, we want a fresh chat window 
                        so existing messages clear and useChat re-inits 
                    */}
                    <OgmaChatWindow
                        key={sessionId || 'new'}
                        sessionId={sessionId}
                        modelConfig={modelConfig}
                    />
                </div>
            </div>
        </div>
    );
}