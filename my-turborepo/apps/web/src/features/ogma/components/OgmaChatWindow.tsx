'use client';

// Remove useChat entirely to avoid crashes
// import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Terminal, Loader2, PenTool, Lightbulb, Cpu } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';

import { getChatMessages, createChatSession } from '../actions';

interface OgmaChatWindowProps {
    sessionId?: string | null;
    modelConfig?: any;
}

export function OgmaChatWindow({ sessionId, modelConfig }: OgmaChatWindowProps) {
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [localInput, setLocalInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Load History
    useEffect(() => {
        if (!sessionId) {
            setMessages([]);
            return;
        }

        const loadHistory = async () => {
            try {
                const history = await getChatMessages(sessionId);
                if (history && history.length > 0) {
                    setMessages(history as any);
                } else {
                    setMessages([]);
                }
            } catch (error) {
                console.error('Failed to load chat history:', error);
            }
        };

        loadHistory();
    }, [sessionId]);

    // 2. Auto-Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!localInput.trim()) return;
        if (isLoading) return;

        const content = localInput;
        setLocalInput(''); // Clear immediately

        let currentSessionId = sessionId;

        // Optimistic UI Update
        const userMsg = { id: Date.now().toString(), role: 'user', content };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // 3. Create Session if needed
            if (!currentSessionId) {
                try {
                    currentSessionId = await createChatSession(content.substring(0, 30));

                    // Update URL silently without full reload if possible, or expect navigation
                    router.push(`/admin/ogma?id=${currentSessionId}`);
                    // Note: router.push might trigger re-mount.
                    // Ideally we continue using currentSessionId even if re-mount happens later.
                } catch (err) {
                    console.error('Failed to create session:', err);
                    setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Error: Could not create chat session.' }]);
                    setIsLoading(false);
                    return;
                }
            }

            // 4. Raw Fetch Stream
            const response = await fetch('/api/ogma', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content }], // Send full history + new msg
                    sessionId: currentSessionId,
                    modelConfig
                })
            });

            if (!response.ok) throw new Error(response.statusText);

            // 5. Stream Reader
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            const decoder = new TextDecoder();
            let assistantMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };

            setMessages(prev => [...prev, assistantMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantMessage.content += chunk;

                // Real-time update
                setMessages(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1] = { ...assistantMessage };
                    return newHistory;
                });
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Error: Failed to process request.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
            {/* Top: Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-muted-foreground/10">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-40 select-none">
                        <Terminal className="w-12 h-12 text-primary" />
                        <h2 className="text-xl font-medium mt-4">Ogma Online</h2>
                        <p className="text-sm text-muted-foreground mt-2">Select a model or start typing...</p>
                    </div>
                )}

                {messages.map((m: any, idx: number) => (
                    <div key={m.id || idx} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[85%] sm:max-w-[70%] rounded-lg p-3 text-sm md:text-base shadow-sm",
                            m.role === 'user'
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted/50 text-foreground border border-border"
                        )}>
                            {/* Trinity UI Annotations (Note: Streamed text doesn't explicitly separate annotations yet, purely text) */}
                            {/* Future: We can parse annotations from the stream if we adapt the backend to send structured events */}

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

            {/* Bottom: Input Area */}
            <div className="p-4 border-t bg-background/95 backdrop-blur-sm z-10 shrink-0">
                <div className="max-w-4xl mx-auto w-full">
                    <form onSubmit={handleSend} className="flex gap-2 items-center relative">
                        <input
                            className="flex-1 bg-muted/50 border border-input rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all shadow-sm"
                            value={localInput}
                            onChange={(e) => setLocalInput(e.target.value)}
                            placeholder={sessionId ? "Message Ogma..." : "Select a chat or start typing..."}
                            autoFocus
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !localInput?.trim()}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 shadow-sm"
                        >
                            <span className="hidden sm:inline">Send</span>
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
