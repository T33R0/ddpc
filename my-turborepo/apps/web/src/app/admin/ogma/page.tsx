'use client';

import { useChat } from '@ai-sdk/react';
import { useAuth } from '@/lib/auth';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Terminal, Loader2, Archive, Trash2 } from 'lucide-react';
import { ChatSidebar } from '@/features/ogma/components/ChatSidebar';
import { createChatSession, archiveChatSession, deleteChatSession } from '@/features/ogma/actions';

export default function ChatPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // 1. CRITICAL: Point to '/api/ogma' and bind the Session ID
    const chatBody = useMemo(() => ({ sessionId: currentSessionId }), [currentSessionId]);

    const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
        api: '/api/ogma',
        body: chatBody,
        id: 'ogma-chat',
        onError: (error: Error) => {
            console.error('[Ogma] useChat error:', error);
        },
    }) as any;

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const shouldAutoScrollRef = useRef(true);

    // Auto-scroll logic
    useEffect(() => {
        if (shouldAutoScrollRef.current && scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    // Handle session selection
    const handleSelectSession = (id: string | null) => {
        setCurrentSessionId(id);
        setMessages([]); // Clear current view
    };

    // User/Auth check
    useEffect(() => {
        setMounted(true);
        if (!loading && (!user || (profile && profile.role !== 'admin'))) {
            router.push('/');
        }
    }, [user, profile, loading, router]);

    if (!mounted || loading || !user || (profile && profile.role !== 'admin')) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Determine if we need to show the loading indicator
    // Show if isLoading AND the last message is NOT a complete assistant response
    // Or if we are waiting for the first chunk of the assistant response
    const lastMessage = messages[messages.length - 1];
    const isWaitingForResponse = isLoading && lastMessage?.role === 'user';
    const isGenerating = isLoading && lastMessage?.role === 'assistant';
    const showLoadingMetadata = isWaitingForResponse || (isGenerating && !lastMessage.content);

    return (
        <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden">
            <ChatSidebar
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                refreshTrigger={refreshTrigger}
            />

            <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden h-full">
                {/* Header - Transparent/Minimal */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/50 backdrop-blur-sm shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-primary" />
                        <div>
                            <h1 className="text-base font-semibold tracking-tight">Ogma</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentSessionId && (
                            <button
                                onClick={async () => {
                                    try {
                                        await archiveChatSession(currentSessionId);
                                        setCurrentSessionId(null);
                                        setRefreshTrigger(p => p + 1);
                                    } catch (e) { console.error(e) }
                                }}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                                title="Archive Session"
                            >
                                <Archive className="w-4 h-4 text-muted-foreground" />
                            </button>
                        )}
                        <button
                            onClick={() => setMessages([])}
                            className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                            title="Clear Chat"
                        >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                    </div>
                </header>

                {/* Main Scrollable Area */}
                <main className="flex-1 overflow-y-auto scrollbar-none p-4 md:p-6 scroll-smooth">
                    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50 select-none">
                                <div className="p-4 rounded-2xl bg-primary/5 mb-4">
                                    <Terminal className="w-12 h-12 text-primary" />
                                </div>
                                <h2 className="text-xl font-medium mb-2">How can I help you today?</h2>
                                <p className="text-sm text-muted-foreground">Ogma System Ready</p>
                            </div>
                        )}

                        {messages.map((m: any) => (
                            <div
                                key={m.id}
                                className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 ${m.role === 'user'
                                        ? 'bg-muted text-foreground rounded-br-sm'
                                        : 'bg-transparent text-foreground pl-0' // Ogma messages are cleaner, no background
                                        }`}
                                >
                                    {m.role === 'assistant' && (
                                        <div className="flex items-center gap-2 mb-1.5 opacity-50">
                                            <Terminal className="w-4 h-4" />
                                            <span className="text-xs font-medium">Ogma</span>
                                        </div>
                                    )}

                                    <div className={`prose prose-invert prose-sm max-w-none leading-relaxed ${m.role === 'assistant' ? '' : ''}`}>
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading / Processing Indicator */}
                        {showLoadingMetadata && (
                            <div className="flex w-full justify-start animate-fade-in">
                                <div className="max-w-[75%] rounded-2xl px-5 py-3.5 pl-0">
                                    <div className="flex items-center gap-2 mb-1.5 opacity-50">
                                        <Terminal className="w-4 h-4" />
                                        <span className="text-xs font-medium">Ogma</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={scrollRef} className="h-4" />
                    </div>
                </main>

                {/* Input Area - Fixed Bottom */}
                <div className="p-4 md:p-6 bg-background">
                    <div className="max-w-3xl mx-auto">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmit(e);
                                shouldAutoScrollRef.current = true;
                            }}
                            className="relative flex items-center bg-muted/50 rounded-full border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden shadow-sm"
                        >
                            <input
                                ref={inputRef}
                                className="flex-1 bg-transparent px-6 py-4 outline-none placeholder:text-muted-foreground/70"
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Message Ogma..."
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input?.trim() || isLoading}
                                className="p-3 mr-1.5 rounded-full hover:bg-background/50 hover:text-primary transition-colors disabled:opacity-30"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                        <div className="text-center mt-3">
                            <p className="text-[10px] text-muted-foreground font-medium">
                                Ogma may display inaccurate info, including about people, so double-check its responses.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}