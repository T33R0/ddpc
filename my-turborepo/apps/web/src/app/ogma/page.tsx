'use strict';
'use client';

import { useChat } from '@ai-sdk/react';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Terminal } from 'lucide-react';

export default function ChatPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/ogma',
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!loading && mounted) {
            if (!user || profile?.role !== 'admin') {
                router.push('/'); // Redirect unauthorized users
            }
        }
    }, [user, profile, loading, mounted, router]);

    // Show loading state while checking auth
    if (!mounted || loading || !profile || profile.role !== 'admin') {
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
        <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-[#e0e0e0] font-sans">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0a0a]/50 backdrop-blur-md fixed top-0 w-full z-10">
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
            <main className="flex-1 overflow-y-auto pt-24 pb-32 px-4 md:px-0">
                <div className="max-w-3xl mx-auto space-y-8">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4 opacity-50">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                                <Terminal className="w-10 h-10 text-white/40" />
                            </div>
                            <p className="text-sm font-mono tracking-wider">SYSTEM READY. AWAITING INPUT.</p>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
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
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-6 py-4 bg-indigo-500/5 border border-indigo-500/10">
                                <div className="flex gap-1.5 items-center h-6">
                                    <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Input Area */}
            <div className="fixed bottom-0 w-full p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-10">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative group">
                        <input
                            className="w-full bg-[#111] hover:bg-[#161616] focus:bg-[#111] transition-all border border-white/10 text-white placeholder-white/20 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 shadow-2xl shadow-black/50"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Query the Trinity..."
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
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
    );
}
