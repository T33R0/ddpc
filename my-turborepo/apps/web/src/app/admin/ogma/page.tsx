'use client';

import { useChat } from '@ai-sdk/react';
import { useAuth } from '@/lib/auth';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Terminal, Cpu, Lightbulb, PenTool } from 'lucide-react';
import { ChatSidebar } from '@/features/ogma/components/ChatSidebar';
import { createChatSession } from '@/features/ogma/actions';

// Define the shape of our custom thought annotation from the Trinity
type Thought = {
    type: 'thought';
    agent: 'architect' | 'visionary' | 'engineer';
    color: string;
    content: string;
};

export default function ChatPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    // Fallback input state in case useChat doesn't provide input
    const [localInput, setLocalInput] = useState('');

    // 1. CRITICAL: Point to '/api/ogma' and bind the Session ID
    // Use a stable body object - but we'll update it dynamically via body function
    const { messages, input, handleInputChange, handleSubmit, append, setMessages, setInput, status } = useChat({
        api: '/api/ogma',
        body: () => ({ sessionId: currentSessionId }), // Use function to get current sessionId dynamically
        id: 'ogma-chat', // Use a stable ID to prevent re-initialization
    }) as any;

    // Sync local input with hook input when available
    useEffect(() => {
        if (input !== undefined && input !== null) {
            setLocalInput(input);
        }
    }, [input]);
    
    // Use local input if hook doesn't provide it
    const effectiveInput = input !== undefined && input !== null ? input : localInput;
    
    // Simple input handler that always works
    const handleInputChangeSafe = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Update local state immediately for responsive UI
        setLocalInput(value);
        
        // Also try to update hook state if available
        if (setInput && typeof setInput === 'function') {
            try {
                setInput(value);
            } catch (err) {
                // Ignore errors, local state will handle it
            }
        }
        
        // Try handleInputChange if it exists and is a function
        if (handleInputChange && typeof handleInputChange === 'function') {
            try {
                handleInputChange(e);
            } catch (err) {
                // Ignore errors, we have local state as fallback
            }
        }
    };

    const isLoading = status === 'submitted' || status === 'streaming';
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSelectSession = async (id: string | null) => {
        setCurrentSessionId(id);
        if (id) {
            setMessages([]);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = effectiveInput?.trim();
        if (!messageText) return;

        let activeSessionId = currentSessionId;

        // If no session exists, create one first
        if (!activeSessionId) {
            try {
                activeSessionId = await createChatSession();
                setCurrentSessionId(activeSessionId);
                setRefreshTrigger(prev => prev + 1);
                // Wait a bit for the hook to re-initialize with the new session ID
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err) {
                console.error("Failed to create session", err);
                return;
            }
        }

        // Store the input value before clearing
        const messageContent = messageText;
        
        // Clear input immediately for better UX
        setLocalInput('');
        if (setInput && typeof setInput === 'function') {
            setInput('');
        }

        // 2. CRITICAL: Use 'append' to send the message with the new Session ID valid
        // We manually append because 'handleSubmit' relies on state that might lag one render cycle
        try {
            // Check if append is available and is a function
            if (!append) {
                console.error('append is not available from useChat hook');
                // Fallback: manually add message to state and call API
                const userMessage = {
                    id: `temp-${Date.now()}`,
                    role: 'user' as const,
                    content: messageContent,
                };
                setMessages([...messages, userMessage]);
                
                // Manually call the API
                const response = await fetch('/api/ogma', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [...messages, userMessage],
                        sessionId: activeSessionId,
                    }),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to send message');
                }
                
                // The response will be streamed, so we need to handle it
                // For now, just return - the hook should handle streaming
                return;
            }
            
            if (typeof append !== 'function') {
                throw new Error('append is not a function');
            }
            
            await append({
                role: 'user',
                content: messageContent,
            });
        } catch (err) {
            console.error('Failed to send message:', err);
            // Restore input on error
            setLocalInput(messageContent);
            if (setInput) {
                setInput(messageContent);
            }
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || loading) return;
        if (!user) {
            router.push('/');
            return;
        }
        if (profile && profile.role !== 'admin') {
            router.push('/');
        }
    }, [user, profile, loading, mounted, router]);

    const isProfileLoading = user && !profile;
    const isUnauthorized = profile && profile.role !== 'admin';

    if (!mounted || loading || !user || isProfileLoading || isUnauthorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <p className="font-mono text-sm text-white/50">Initializing Secure Link...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-[#e0e0e0] font-sans overflow-hidden">
            <ChatSidebar
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                refreshTrigger={refreshTrigger}
            />

            <div className="flex-1 flex flex-col relative min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 w-full z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <Terminal className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-white">Ogma</h1>
                            <p className="text-xs text-white/40 font-mono">Trinity Synergistic Intelligence</p>
                        </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-xs font-medium text-emerald-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ONLINE
                        </span>
                    </div>
                </header>

                {/* Chat Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                    <div className="max-w-4xl mx-auto space-y-8 pb-32">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 opacity-50">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                                    <Terminal className="w-10 h-10 text-white/40" />
                                </div>
                                <p className="text-sm font-mono tracking-wider">SYSTEM READY. AWAITING INPUT.</p>
                            </div>
                        )}

                        {messages.map((m: any) => {
                            // 3. Extract Thoughts for Visualization
                            const thoughts = (m.annotations as Thought[] | undefined)?.filter(
                                (a) => a && a.type === 'thought'
                            );

                            return (
                                <div
                                    key={m.id}
                                    className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    {/* --- TRINITY THOUGHT CARDS --- */}
                                    {thoughts && thoughts.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2 w-full max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {thoughts.map((t, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`p-3 rounded-lg border text-xs leading-relaxed font-mono relative overflow-hidden group
                                                        ${t.agent === 'architect' ? 'bg-blue-950/30 border-blue-500/30 text-blue-200/90' : ''}
                                                        ${t.agent === 'visionary' ? 'bg-purple-950/30 border-purple-500/30 text-purple-200/90' : ''}
                                                        ${t.agent === 'engineer' ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200/90' : ''}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                                                        {t.agent === 'architect' && <PenTool className="w-3 h-3 text-blue-400" />}
                                                        {t.agent === 'visionary' && <Lightbulb className="w-3 h-3 text-purple-400" />}
                                                        {t.agent === 'engineer' && <Cpu className="w-3 h-3 text-emerald-400" />}
                                                        <span className="uppercase tracking-widest opacity-70 font-bold text-[10px]">
                                                            {t.agent}
                                                        </span>
                                                    </div>
                                                    <div className="opacity-80 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                                                        {t.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* --- MAIN MESSAGE --- */}
                                    {(m.content || m.role === 'user') && (
                                        <div
                                            className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-6 py-4 border backdrop-blur-sm ${m.role === 'user'
                                                ? 'bg-white/5 border-white/10 text-white rounded-br-sm'
                                                : 'bg-indigo-500/5 border-indigo-500/10 text-indigo-100 rounded-bl-sm'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2 opacity-50 text-xs font-mono uppercase tracking-widest">
                                                {m.role === 'user' ? 'Operator' : 'Ogma'}
                                            </div>
                                            <div className="prose prose-invert prose-sm max-w-none leading-relaxed whitespace-pre-wrap">
                                                {m.content}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Loading Indicator */}
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex justify-start">
                                <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-6 py-4 bg-indigo-500/5 border border-indigo-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1.5 items-center h-6">
                                            <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce" />
                                        </div>
                                        <span className="text-xs font-mono text-indigo-400/50 tracking-widest animate-pulse">
                                            SYNTHESIZING...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </main>

                <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-10 z-10">
                    <div className="max-w-3xl mx-auto">
                        <form onSubmit={handleFormSubmit} className="relative group">
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full bg-[#111] hover:bg-[#161616] focus:bg-[#111] transition-all border border-white/10 text-white placeholder-white/20 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 shadow-2xl shadow-black/50"
                                value={effectiveInput || ''}
                                onChange={handleInputChangeSafe}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleFormSubmit(e as any);
                                    }
                                }}
                                placeholder="Query the Trinity..."
                                disabled={isLoading}
                                autoComplete="off"
                                autoFocus={false}
                            />
                            <button
                                type="submit"
                                disabled={!effectiveInput?.trim() || isLoading}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                        <div className="text-center mt-3">
                            <p className="text-[10px] text-white/20 font-mono tracking-widest">SECURE CHANNEL // ADMIN EYES ONLY</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}