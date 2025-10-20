"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    SmilePlus,
    Send,
    MoreHorizontal,
    CheckCheck,
    Check,
    Users,
    X,
    ChevronUp,
    Loader2,
} from "lucide-react";
import Image from "next/image";
import { Logo } from "./logo";
import { DrawerClose } from "./drawer";
import { cn } from "./lib/utils";

interface Message {
    id: string;
    content: string;
    sender: {
        name: string;
        avatar: string;
        isOnline: boolean;
    };
    timestamp: string;
    status: "sent" | "delivered" | "read";
    reactions?: Array<{
        emoji: string;
        count: number;
        reacted: boolean;
    }>;
    isUser?: boolean;
}

interface ChatWindowProps {
    chatName?: string;
    messages?: Message[];
    onClose?: () => void;
    skill?: "discover" | "maintenance" | "performance";
}

export function ChatWindow({
    chatName = "Scrutineer",
    messages: initialMessages = [
        {
            id: "1",
            content: "What can I help you with?",
            sender: {
                name: "Scrutineer",
                avatar: "",
                isOnline: true,
            },
            timestamp: "now",
            status: "read",
        },
    ],
    onClose,
    skill = "discover",
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputValue,
            sender: {
                name: "You",
                avatar: "",
                isOnline: true,
            },
            timestamp: new Date().toLocaleTimeString(),
            status: "sent",
            isUser: true,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/scrutineer/message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: inputValue,
                    skill: skill
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: data.reply || "Sorry, I couldn't process your request.",
                sender: {
                    name: "Scrutineer",
                    avatar: "",
                    isOnline: true,
                },
                timestamp: new Date().toLocaleTimeString(),
                status: "delivered",
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "Sorry, I'm having trouble connecting right now. Please try again.",
                sender: {
                    name: "Scrutineer",
                    avatar: "",
                    isOnline: false,
                },
                timestamp: new Date().toLocaleTimeString(),
                status: "delivered",
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const renderMessage = (message: Message) => {
        const isUser = message.isUser;
        const isStructuredResult = message.content.startsWith("Here are some candidates:");

        if (isStructuredResult && !isUser) {
            // Parse structured results
            const lines = message.content.split('\n');
            const candidates = lines.slice(1).filter(line => line.trim().startsWith('•'));

            return (
                <div className={`flex gap-4 ${isUser ? 'items-start flex-row-reverse' : 'items-start'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                        {isUser ? (
                            <span className="text-white text-sm font-medium">
                                {message.sender.name.charAt(0).toUpperCase()}
                            </span>
                        ) : (
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">AI</span>
                            </div>
                        )}
                    </div>
                    <div className={`flex-1 ${isUser ? 'flex flex-col items-end' : ''}`}>
                        <div className={`flex items-baseline gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                            <p className="font-bold text-white">
                                {message.sender.name}
                            </p>
                            <span className="text-xs text-white/60">
                                {message.timestamp}
                            </span>
                        </div>
                        <div className={`p-3 rounded-lg max-w-md ${isUser ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}>
                            <div className="font-medium mb-3 text-white">{lines[0]}</div>
                            <div className="space-y-2">
                                {candidates.map((candidate, index) => (
                                    <div key={index} className="text-sm text-white/90 p-2 bg-black/20 rounded border border-white/10">
                                        {candidate.replace('•', '').trim()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Regular message
        return (
            <div className={`flex gap-4 ${isUser ? 'items-start flex-row-reverse' : 'items-start'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                    {isUser ? (
                        <span className="text-white text-sm font-medium">
                            {message.sender.name.charAt(0).toUpperCase()}
                        </span>
                    ) : (
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">AI</span>
                        </div>
                    )}
                </div>
                <div className={`flex-1 ${isUser ? 'flex flex-col items-end' : ''}`}>
                    <div className={`flex items-baseline gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                        <p className="font-bold text-white">
                            {message.sender.name}
                        </p>
                        <span className="text-xs text-white/60">
                            {message.timestamp}
                        </span>
                    </div>
                    <div className={`p-3 rounded-lg max-w-md ${isUser ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6 bg-black/50 backdrop-blur-lg rounded-2xl shadow-lg flex flex-col h-[550px] border border-white/30">
            <header className="flex justify-between items-center border-b border-white/30 pb-4 mb-4">
                <div className="flex items-center gap-4">
                    <Logo />
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Scrutineer
                        </h2>
                        <p className="text-sm text-white/80">
                            Your AI assistant for vehicle insights and recommendations.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        aria-label="More options"
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <MoreHorizontal className="w-5 h-5 text-white/80" />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            aria-label="Close chat"
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-white/80" />
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 flex flex-col bg-transparent">
                <div className="flex-1 p-4 overflow-y-auto space-y-6">
                    {messages.length === 1 && messages[0]?.content === "What can I help you with?" ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">AI</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-white">
                                    Welcome to Scrutineer
                                </h3>
                                <p className="text-white/60 max-w-md">
                                    I'm your AI assistant here to help you discover, research, and make informed decisions about vehicles. How can I assist you today?
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-w-lg">
                                <button
                                    onClick={() => setInputValue("Show me around the site")}
                                    className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-left transition-colors border border-white/20"
                                >
                                    <div className="font-medium text-white text-sm">
                                        🏠 Show me around the site
                                    </div>
                                    <div className="text-xs text-white/60 mt-1">
                                        Get a guided tour of all features
                                    </div>
                                </button>
                                <button
                                    onClick={() => setInputValue("Help me setup my garage")}
                                    className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-left transition-colors border border-white/20"
                                >
                                    <div className="font-medium text-white text-sm">
                                        🏗️ Help me setup my garage
                                    </div>
                                    <div className="text-xs text-white/60 mt-1">
                                        Create and manage your vehicle collection
                                    </div>
                                </button>
                                <button
                                    onClick={() => setInputValue("Find me red BMW M3s from 2018")}
                                    className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-left transition-colors border border-white/20"
                                >
                                    <div className="font-medium text-white text-sm">
                                        🚗 Let's discover my next vehicle
                                    </div>
                                    <div className="text-xs text-white/60 mt-1">
                                        Find the perfect car for your needs
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => renderMessage(message))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <footer className="mt-auto flex items-center gap-2 p-4 border-t border-white/30">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask Scrutineer anything about vehicles..."
                        disabled={isLoading}
                        className={cn(
                            "flex-1 w-full px-4 py-2 rounded-full border border-white/30",
                            "bg-black/50 backdrop-blur-sm text-white placeholder-white/60",
                            "focus:outline-none focus:ring-2 focus:ring-lime-500 transition-shadow",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        aria-label="Send message"
                        className="p-2 rounded-full bg-lime-500 hover:bg-lime-600 disabled:bg-gray-600 disabled:hover:bg-gray-600 text-black transition-all duration-200 shadow-lg disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </footer>
                {/* Close button anchored to bottom of chat window */}
                <div className="flex justify-center pb-2 -mb-2">
                    <DrawerClose asChild>
                        <button className="bg-black/50 backdrop-blur-lg border border-white/20 rounded-b-lg h-8 w-16 flex items-center justify-center hover:bg-slate-800/50 transition-colors shadow-lg">
                            <ChevronUp className="h-3 w-3 text-white" />
                        </button>
                    </DrawerClose>
                </div>
            </main>
        </div>
    );
}
