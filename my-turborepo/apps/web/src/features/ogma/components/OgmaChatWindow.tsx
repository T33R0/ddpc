'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Send, Terminal, Loader2, PenTool, Lightbulb, Cpu } from 'lucide-react'; // Using Lucide icons to match repo style
import { cn } from '@repo/ui/lib/utils';
// import { Button } from '@/components/ui/button'; // Commented out to reduce dependency friction, using raw tailwind or existing imports
// import { Input } from '@/components/ui/input';

interface OgmaChatWindowProps {
    sessionId?: string | null;
}

export function OgmaChatWindow({ sessionId }: OgmaChatWindowProps) {
    // 1. Connection
    const chatBody = useMemo(() => ({ sessionId }), [sessionId]);
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/ogma',
        body: chatBody,
        id: 'ogma-chat',
        onError: (e: Error) => console.error('Chat Error:', e),
    }) as any; // Cast to any to silence strict type checks for now

    const scrollRef = useRef<HTMLDivElement>(null);

    // 2. Auto-Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    return (
        <div className="flex flex-col h-full w-full bg-background relative">
            {/* Top: Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-muted-foreground/10">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[50vh] opacity-40 select-none">
                        <Terminal className="w-12 h-12 text-primary" />
                        <h2 className="text-xl font-medium mt-4">Ogma Online</h2>
                    </div>
                )}

                {messages.map((m: any) => (
                    <div key={m.id} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[85%] sm:max-w-[80%] rounded-lg p-3 text-sm md:text-base",
                            m.role === 'user'
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted/50 text-foreground"
                        )}>
                            {/* Trinity UI Annotations */}
                            {m.annotations?.map((a: any, i: number) => {
                                if (a.type !== 'thought' || !a.agent) return null;
                                const isArchitect = a.agent === 'architect';
                                const isVisionary = a.agent === 'visionary';
                                const isEngineer = a.agent === 'engineer';

                                return (
                                    <div key={i} className={cn(
                                        "mb-2 text-xs border-l-2 pl-2 py-1 bg-background/50 rounded-r-md font-mono",
                                        isArchitect && "border-blue-500 text-blue-600 dark:text-blue-400",
                                        isVisionary && "border-purple-500 text-purple-600 dark:text-purple-400",
                                        isEngineer && "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                    )}>
                                        <div className="flex items-center gap-1 opacity-80 mb-0.5">
                                            {isArchitect && <PenTool className="w-3 h-3" />}
                                            {isVisionary && <Lightbulb className="w-3 h-3" />}
                                            {isEngineer && <Cpu className="w-3 h-3" />}
                                            <span className="font-bold uppercase tracking-wider opacity-70">{a.agent}</span>
                                        </div>
                                        <div className="opacity-90 leading-relaxed">{a.content}</div>
                                    </div>
                                );
                            })}

                            {/* Main Message */}
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {m.content}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse p-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Thinking...</span>
                    </div>
                )}

                <div ref={scrollRef} className="h-1" />
            </div>

            {/* Bottom: Input Area - FIXED */}
            <div className="p-4 border-t bg-background/95 backdrop-blur-sm z-10">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                        <input
                            className="flex-1 bg-muted/50 border border-input rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Command Ogma..."
                            autoFocus
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input?.trim()}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                        >
                            <span>Send</span>
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
