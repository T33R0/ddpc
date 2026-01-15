'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useMemo, useState } from 'react';
import { Send, Terminal, Loader2, PenTool, Lightbulb, Cpu, User } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
// import { Button } from '@repo/ui/button'; // Using raw buttons for now to match specific style, or can switch to repo UI

// types/trinity.ts could be a better place, but defining here for co-location as per refactor plan
type Thought = {
    type: 'thought';
    agent: 'architect' | 'visionary' | 'engineer';
    content: string;
};

interface OgmaChatWindowProps {
    sessionId: string | null;
}

export function OgmaChatWindow({ sessionId }: OgmaChatWindowProps) {
    // 1. Chat Hook
    const chatBody = useMemo(() => ({ sessionId }), [sessionId]);
    const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
        api: '/api/ogma',
        body: chatBody,
        id: 'ogma-chat',
        onError: (e: Error) => console.error('[Ogma] Error:', e),
    }) as any;

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const shouldAutoScrollRef = useRef(true);

    // 2. Clear messages when switching sessions
    useEffect(() => {
        setMessages([]);
    }, [sessionId, setMessages]);

    // 3. Auto-scroll
    useEffect(() => {
        if (shouldAutoScrollRef.current && scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    // 4. Trinity Parsing Helper
    const getThoughts = (m: any): Thought[] => {
        if (m.role !== 'assistant' || !m.annotations) return [];
        return (m.annotations as any[])
            .filter((a: any) => a && a.type === 'thought' && a.agent)
            .map((a: any) => ({
                type: 'thought',
                agent: a.agent,
                content: a.content
            }));
    };

    // 5. Loading Logic
    const lastMessage = messages[messages.length - 1];
    const isWaitingStart = isLoading && lastMessage?.role === 'user';
    const isGeneratingEmpty = isLoading && lastMessage?.role === 'assistant' && !lastMessage.content;
    const showSpinner = isWaitingStart || isGeneratingEmpty;

    return (
        <div className="flex flex-col h-full w-full overflow-hidden relative bg-background">
            {/* Scrollable Message Area */}
            <div className="flex-1 overflow-y-auto w-full p-4 md:p-0 scroll-smooth scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20">
                <div className="max-w-3xl mx-auto flex flex-col gap-6 py-4 min-h-[50vh]">

                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[50vh] opacity-40 select-none">
                            <div className="p-4 rounded-3xl bg-primary/5 mb-6">
                                <Terminal className="w-12 h-12 text-primary" />
                            </div>
                            <h2 className="text-2xl font-semibold mb-2 tracking-tight">How can I help you today?</h2>
                        </div>
                    )}

                    {messages.map((m: any) => {
                        const thoughts = getThoughts(m);
                        const isUser = m.role === 'user';

                        return (
                            <div key={m.id} className={cn("flex w-full flex-col gap-2", isUser ? "items-end" : "items-start")}>
                                {/* Trinity Thoughts (Only for Assistant) */}
                                {thoughts.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-[90%] mb-1 animate-in fade-in slide-in-from-bottom-2">
                                        {thoughts.map((t: Thought, i: number) => (
                                            <div key={i} className={cn(
                                                "p-3 rounded-xl border text-[11px] leading-relaxed font-mono relative overflow-hidden",
                                                t.agent === 'architect' && "bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400",
                                                t.agent === 'visionary' && "bg-purple-500/5 border-purple-500/20 text-purple-600 dark:text-purple-400",
                                                t.agent === 'engineer' && "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                            )}>
                                                <div className="flex items-center gap-2 mb-1.5 opacity-80 border-b border-black/5 dark:border-white/5 pb-1.5">
                                                    {t.agent === 'architect' && <PenTool className="w-3 h-3" />}
                                                    {t.agent === 'visionary' && <Lightbulb className="w-3 h-3" />}
                                                    {t.agent === 'engineer' && <Cpu className="w-3 h-3" />}
                                                    <span className="uppercase tracking-widest font-bold opacity-70">{t.agent}</span>
                                                </div>
                                                <div className="opacity-90">{t.content}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Message Bubble */}
                                {(m.content || isUser) && (
                                    <div className={cn(
                                        "relative max-w-[85%] sm:max-w-[80%] rounded-2xl px-5 py-3 text-sm md:text-base leading-7",
                                        isUser
                                            ? "bg-muted text-foreground rounded-br-sm"
                                            : "pl-0 bg-transparent text-foreground"
                                    )}>
                                        {!isUser && (
                                            <div className="flex items-center gap-2 mb-1.5 opacity-50 pl-1 select-none">
                                                <Terminal className="w-3.5 h-3.5" />
                                                <span className="text-xs font-medium">Ogma</span>
                                            </div>
                                        )}
                                        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                                            {m.content}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Loading Spinner */}
                    {showSpinner && (
                        <div className="flex w-full justify-start animate-fade-in pl-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-primary/5">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground animate-pulse">Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={scrollRef} className="h-4 w-full" />
                </div>
            </div>

            {/* Fixed Input Area */}
            <div className="w-full bg-background p-4 md:p-6 pt-2">
                <div className="max-w-3xl mx-auto">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(e);
                            shouldAutoScrollRef.current = true;
                        }}
                        className="relative flex items-center bg-muted/40 hover:bg-muted/60 focus-within:bg-muted/60 rounded-full border border-border/50 focus-within:border-primary/30 transition-all shadow-sm"
                    >
                        <input
                            ref={inputRef}
                            className="flex-1 bg-transparent px-6 py-4 outline-none placeholder:text-muted-foreground/50 text-base"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Message Ogma..."
                            disabled={isLoading}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!input?.trim() || isLoading}
                            className="p-2.5 mr-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-0 disabled:scale-75 transition-all duration-200"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <div className="text-center mt-3 select-none">
                        <p className="text-[10px] text-muted-foreground/60 font-medium">
                            Ogma can make mistakes. Consider checking important information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
