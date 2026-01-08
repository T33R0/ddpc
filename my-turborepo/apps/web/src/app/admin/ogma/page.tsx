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

type TrinityProgress = {
    stage: string;
    agent?: string;
    round?: number;
    message: string;
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
    // Trinity progress tracking
    const [trinityProgress, setTrinityProgress] = useState<TrinityProgress | null>(null);
    // Store thought annotations separately for async rendering
    const [pendingThoughts, setPendingThoughts] = useState<Map<string, Thought[]>>(new Map());

    // 1. CRITICAL: Point to '/api/ogma' and bind the Session ID
    // Use a stable body object to prevent hook re-initialization
    const chatBody = useMemo(() => ({ sessionId: currentSessionId }), [currentSessionId]);
    
    const chatHook = useChat({
        api: '/api/ogma',
        body: chatBody,
        id: 'ogma-chat', // Use a stable ID to prevent re-initialization
    });
    
    // Extract all possible properties from the hook with proper typing
    const messages = chatHook.messages || [];
    const handleSubmit = (chatHook as any).handleSubmit;
    const append = (chatHook as any).append;
    const setMessages = (chatHook as any).setMessages || chatHook.setMessages;
    const status = (chatHook as any).status || chatHook.status || 'ready';
    
    // Extract annotations from messages as they update
    useEffect(() => {
        messages.forEach((m: any) => {
            if (m.role === 'assistant' && m.annotations) {
                const annotationThoughts = (m.annotations as any[]).filter(
                    (a: any) => a && a.type === 'thought' && a.agent
                ).map((a: any): Thought => ({
                    type: 'thought',
                    agent: a.agent,
                    color: a.agent === 'architect' ? 'blue' : 
                           a.agent === 'visionary' ? 'purple' : 'emerald',
                    content: a.content || ''
                }));
                
                if (annotationThoughts.length > 0) {
                    setPendingThoughts(prev => {
                        const newMap = new Map(prev);
                        newMap.set(m.id, annotationThoughts);
                        return newMap;
                    });
                }
            }
        });
    }, [messages]);

    // Use ONLY local state for input - completely independent from hook
    // This prevents any conflicts with the useChat hook's internal state
    const effectiveInput = localInput;
    
    // Simple input handler that ONLY updates local state
    const handleInputChangeSafe = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalInput(value);
    };

    const isLoading = status === 'submitted' || status === 'streaming';
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const messagesRef = useRef(messages);
    messagesRef.current = messages; // Keep ref in sync

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Poll for new messages when loading or when session changes
    useEffect(() => {
        if (!currentSessionId || !mounted) return;

        const pollMessages = async () => {
            try {
                const { getChatMessages } = await import('@/features/ogma/actions');
                const dbMessages = await getChatMessages(currentSessionId);
                
                // Convert DB messages to useChat format
                const chatMessages = dbMessages.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                }));

                // Only update if we have new messages or different content
                const currentMessageIds = new Set(messages.map((m: any) => m.id));
                const currentMessageMap = new Map(messages.map((m: any) => [m.id, m.content]));
                const hasNewMessages = chatMessages.some((msg: any) => 
                    !currentMessageIds.has(msg.id) || currentMessageMap.get(msg.id) !== msg.content
                );
                
                if (hasNewMessages) {
                    setMessages(chatMessages);
                }
            } catch (err) {
                console.error('Failed to poll messages:', err);
            }
        };

        // Poll every 1.5 seconds when loading (to catch responses quickly), or every 5 seconds otherwise
        const interval = setInterval(pollMessages, isLoading ? 1500 : 5000);
        pollingIntervalRef.current = interval;

        // Also poll immediately when loading starts
        if (isLoading) {
            pollMessages();
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [currentSessionId, mounted, isLoading, messages, setMessages]);

    const handleSelectSession = async (id: string | null) => {
        setCurrentSessionId(id);
        if (id) {
            // Load messages for this session from database
            try {
                const { getChatMessages } = await import('@/features/ogma/actions');
                const dbMessages = await getChatMessages(id);
                
                // Convert DB messages to useChat format
                const chatMessages = dbMessages.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                }));
                
                setMessages(chatMessages);
            } catch (err) {
                console.error('Failed to load messages:', err);
                setMessages([]);
            }
        } else {
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
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
                console.error("Failed to create session", err);
                return;
            }
        }

        // Store the input value
        const messageContent = messageText;
        
        // Clear input immediately (only local state, hook will handle its own)
        setLocalInput('');

        // Reset progress when starting - show Trinity models are working
        setTrinityProgress({ stage: 'initial', message: 'Trinity models deliberating...' });
        // Clear pending thoughts for new conversation
        setPendingThoughts(new Map());

        // Try to use append first (most reliable)
        if (append && typeof append === 'function') {
            try {
                // Intercept fetch to capture annotations
                const originalFetch = window.fetch;
                const messageCountBefore = messages.length;
                
                window.fetch = async (...args) => {
                    const response = await originalFetch(...args);
                    
                    // Only intercept our ogma API calls
                    if (typeof args[0] === 'string' && args[0].includes('/api/ogma')) {
                        const clonedResponse = response.clone();
                        
                        // Read annotations in the background
                        (async () => {
                            try {
                                const reader = clonedResponse.body?.getReader();
                                if (!reader) return;
                                
                                const decoder = new TextDecoder();
                                let buffer = '';
                                const thoughts: Thought[] = [];
                                
                                // Find the assistant message ID (poll until found)
                                let assistantMsgId: string | null = null;
                                const findAssistantMessageId = () => {
                                    const currentMessages = messagesRef.current || [];
                                    if (currentMessages.length > messageCountBefore) {
                                        const assistantMsg = currentMessages[currentMessages.length - 1];
                                        if (assistantMsg && assistantMsg.role === 'assistant') {
                                            return assistantMsg.id;
                                        }
                                    }
                                    return null;
                                };
                                
                                // Poll for assistant message ID (up to 2 seconds)
                                for (let i = 0; i < 20; i++) {
                                    assistantMsgId = findAssistantMessageId();
                                    if (assistantMsgId) break;
                                    await new Promise(resolve => setTimeout(resolve, 100));
                                }
                                
                                // Fallback if not found
                                if (!assistantMsgId) {
                                    assistantMsgId = `assistant-${Date.now()}`;
                                }
                                
                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) break;
                                    
                                    buffer += decoder.decode(value, { stream: true });
                                    const lines = buffer.split('\n');
                                    buffer = lines.pop() || '';
                                    
                                    for (const line of lines) {
                                        if (line.startsWith('a:')) {
                                            try {
                                                const annotation = JSON.parse(line.substring(2));
                                                if (annotation.type === 'thought' && annotation.agent) {
                                                    const thought: Thought = {
                                                        type: 'thought',
                                                        agent: annotation.agent,
                                                        color: annotation.agent === 'architect' ? 'blue' : 
                                                               annotation.agent === 'visionary' ? 'purple' : 'emerald',
                                                        content: annotation.content || ''
                                                    };
                                                    
                                                    // Check if we already have this agent's thought
                                                    const existingIndex = thoughts.findIndex(t => t.agent === thought.agent);
                                                    if (existingIndex >= 0) {
                                                        thoughts[existingIndex] = thought;
                                                    } else {
                                                        thoughts.push(thought);
                                                    }
                                                    
                                                    // Update immediately as each thought arrives
                                                    if (assistantMsgId) {
                                                        setPendingThoughts(prev => {
                                                            const newMap = new Map(prev);
                                                            newMap.set(assistantMsgId!, [...thoughts]);
                                                            return newMap;
                                                        });
                                                    }
                                                }
                                            } catch (e) {
                                                // Ignore parse errors
                                            }
                                        }
                                    }
                                }
                            } catch (err) {
                                console.error('Error reading annotations:', err);
                            }
                        })();
                    }
                    
                    return response;
                };
                
                await append({
                    role: 'user',
                    content: messageContent,
                });
                
                // Restore fetch after a delay
                setTimeout(() => {
                    window.fetch = originalFetch;
                }, 10000);
                
                // Update progress based on time elapsed (simulated progress)
                let elapsed = 0;
                progressIntervalRef.current = setInterval(() => {
                    elapsed += 1;
                    if (elapsed < 10) {
                        setTrinityProgress({ 
                            stage: 'initial', 
                            message: 'Trinity models generating initial solutions...' 
                        });
                    } else if (elapsed < 20) {
                        setTrinityProgress({ 
                            stage: 'critiques', 
                            round: 1,
                            message: 'Round 1: Generating critiques...' 
                        });
                    } else if (elapsed < 30) {
                        setTrinityProgress({ 
                            stage: 'votes', 
                            round: 1,
                            message: 'Round 1: Voting...' 
                        });
                    } else {
                        setTrinityProgress({ 
                            stage: 'synthesis', 
                            message: 'Synthesizing final response...' 
                        });
                    }
                }, 1000);
                
                // Clear progress when loading stops
                const checkInterval = setInterval(() => {
                    if (!isLoading) {
                        if (progressIntervalRef.current) {
                            clearInterval(progressIntervalRef.current);
                            progressIntervalRef.current = null;
                        }
                        clearInterval(checkInterval);
                        setTrinityProgress(null);
                    }
                }, 500);
                
                return; // Success, exit early
            } catch (err) {
                console.error('append failed, trying handleSubmit:', err);
                setTrinityProgress(null);
            }
        }

        // Fallback to handleSubmit - but we need to manually add the message first
        // since handleSubmit expects the input to be in the hook's state
        if (handleSubmit && typeof handleSubmit === 'function') {
            // Manually add user message to hook's messages
            const userMessage = {
                id: `user-${Date.now()}`,
                role: 'user' as const,
                content: messageContent,
            };
            setMessages([...messages, userMessage]);
            
            // Then trigger the API call manually
            try {
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
                
                // Stream the response
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let assistantMessage = { 
                    id: `assistant-${Date.now()}`, 
                    role: 'assistant' as const, 
                    content: '' 
                };
                setMessages([...messages, userMessage, assistantMessage]);
                
                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('0:"')) {
                                try {
                                    const text = JSON.parse(line.substring(2));
                                    assistantMessage.content += text;
                                    setMessages([...messages, userMessage, { ...assistantMessage }]);
                                } catch (parseErr) {
                                    // Ignore parse errors
                                }
                            }
                        }
                    }
                }
                return;
            } catch (err) {
                console.error('handleSubmit fallback failed:', err);
            }
        }

        // Last resort: manually add message and call API
        console.warn('Using manual API call fallback');
        const userMessage = {
            id: `temp-${Date.now()}`,
            role: 'user' as const,
            content: messageContent,
        };
        setMessages([...messages, userMessage]);
        
        try {
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
            
            // Read the stream and update messages manually
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = { id: `assistant-${Date.now()}`, role: 'assistant' as const, content: '' };
            setMessages([...messages, userMessage, assistantMessage]);
            
            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('0:"')) {
                            const text = JSON.parse(line.substring(2));
                            assistantMessage.content += text;
                            setMessages([...messages, userMessage, { ...assistantMessage }]);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Manual API call failed:', err);
            // Restore input on error
            setLocalInput(messageContent);
        }
    };

    useEffect(() => {
        setMounted(true);
        
        // Cleanup on unmount
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
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
                            // Extract Thoughts from both annotations and pending thoughts
                            const annotationThoughts = (m.annotations as Thought[] | undefined)?.filter(
                                (a) => a && a.type === 'thought'
                            ) || [];
                            const pendingThoughtsForMessage = pendingThoughts.get(m.id) || [];
                            // Combine and deduplicate by agent
                            const allThoughtsMap = new Map<string, Thought>();
                            [...annotationThoughts, ...pendingThoughtsForMessage].forEach(t => {
                                if (t && t.agent) {
                                    allThoughtsMap.set(t.agent, t);
                                }
                            });
                            const thoughts = Array.from(allThoughtsMap.values());

                            // Check if this is the last assistant message and if it's still loading
                            const isLastAssistant = m.role === 'assistant' && 
                                messages.length > 0 && 
                                messages[messages.length - 1].id === m.id;
                            const hasNoContent = !m.content || m.content.trim() === '';
                            const showSynthesizing = isLastAssistant && hasNoContent && isLoading;

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
                                                    key={`${t.agent}-${i}`} 
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
                                    {(m.content || m.role === 'user' || showSynthesizing) && (
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
                                                {showSynthesizing ? (
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
                                                ) : (
                                                    m.content
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Loading Indicator with Trinity Progress */}
                        {(isLoading || trinityProgress) && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex flex-col gap-3 justify-start">
                                {/* Trinity Models Status */}
                                {trinityProgress && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-[90%]">
                                        {/* Architect */}
                                        <div className={`p-3 rounded-lg border text-xs transition-all ${
                                            trinityProgress.stage === 'initial' || trinityProgress.stage === 'critiques' || trinityProgress.stage === 'refine'
                                                ? 'bg-blue-950/50 border-blue-500/50 shadow-lg shadow-blue-500/20'
                                                : 'bg-blue-950/20 border-blue-500/20'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <PenTool className={`w-4 h-4 ${
                                                    trinityProgress.stage === 'initial' || trinityProgress.stage === 'critiques' || trinityProgress.stage === 'refine'
                                                        ? 'text-blue-400 animate-pulse'
                                                        : 'text-blue-400/50'
                                                }`} />
                                                <span className="uppercase tracking-widest font-bold text-[10px] text-blue-300/80">
                                                    ARCHITECT
                                                </span>
                                            </div>
                                            <div className="text-blue-200/60 font-mono text-[10px]">
                                                {trinityProgress.stage === 'initial' || trinityProgress.stage === 'critiques' || trinityProgress.stage === 'refine'
                                                    ? 'Processing...'
                                                    : 'Standby'}
                                            </div>
                                        </div>

                                        {/* Visionary */}
                                        <div className={`p-3 rounded-lg border text-xs transition-all ${
                                            trinityProgress.stage === 'initial' || trinityProgress.stage === 'critiques' || trinityProgress.stage === 'refine'
                                                ? 'bg-purple-950/50 border-purple-500/50 shadow-lg shadow-purple-500/20'
                                                : 'bg-purple-950/20 border-purple-500/20'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Lightbulb className={`w-4 h-4 ${
                                                    trinityProgress.stage === 'initial' || trinityProgress.stage === 'critiques' || trinityProgress.stage === 'refine'
                                                        ? 'text-purple-400 animate-pulse'
                                                        : 'text-purple-400/50'
                                                }`} />
                                                <span className="uppercase tracking-widest font-bold text-[10px] text-purple-300/80">
                                                    VISIONARY
                                                </span>
                                            </div>
                                            <div className="text-purple-200/60 font-mono text-[10px]">
                                                {trinityProgress.stage === 'initial' || trinityProgress.stage === 'critiques' || trinityProgress.stage === 'refine'
                                                    ? 'Processing...'
                                                    : 'Standby'}
                                            </div>
                                        </div>

                                        {/* Engineer */}
                                        <div className={`p-3 rounded-lg border text-xs transition-all ${
                                            trinityProgress.stage === 'initial' || trinityProgress.stage === 'critiques' || trinityProgress.stage === 'refine'
                                                ? 'bg-emerald-950/50 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                                                : 'bg-emerald-950/20 border-emerald-500/20'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Cpu className={`w-4 h-4 ${
                                                    trinityProgress.stage === 'initial' || trinityProgress.stage === 'critiques' || trinityProgress.stage === 'refine'
                                                        ? 'text-emerald-400 animate-pulse'
                                                        : 'text-emerald-400/50'
                                                }`} />
                                                <span className="uppercase tracking-widest font-bold text-[10px] text-emerald-300/80">
                                                    ENGINEER
                                                </span>
                                            </div>
                                            <div className="text-emerald-200/60 font-mono text-[10px]">
                                                {trinityProgress.stage === 'initial' || trinityProgress.stage === 'critiques' || trinityProgress.stage === 'refine'
                                                    ? 'Processing...'
                                                    : 'Standby'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Main Loading Indicator */}
                                <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-6 py-4 bg-indigo-500/5 border border-indigo-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1.5 items-center h-6">
                                            <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-mono text-indigo-400/50 tracking-widest animate-pulse">
                                                {trinityProgress?.message || 'SYNTHESIZING...'}
                                            </span>
                                            {trinityProgress?.round && (
                                                <span className="text-[10px] font-mono text-indigo-400/30">
                                                    Round {trinityProgress.round} of 4
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </main>

                <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-10 z-10">
                    <div className="max-w-3xl mx-auto">
                        <form 
                            onSubmit={handleFormSubmit}
                            className="relative group"
                        >
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