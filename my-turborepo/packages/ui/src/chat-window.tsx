"use client";

import React, { useState } from "react";
import {
    SmilePlus,
    Send,
    MoreHorizontal,
    CheckCheck,
    Check,
    Users,
    X,
    ChevronUp,
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
}

interface ChatWindowProps {
    chatName?: string;
    messages?: Message[];
    onClose?: () => void;
}

export function ChatWindow({
    chatName = "Scrutineer",
    messages = [
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
}: ChatWindowProps) {

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
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">AI</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-black dark:text-white">
                                    Welcome to Scrutineer
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                                    I'm your AI assistant here to help you discover, research, and make informed decisions about vehicles. How can I assist you today?
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-w-lg">
                                <button className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-left transition-colors border border-gray-200 dark:border-gray-700">
                                    <div className="font-medium text-black dark:text-white text-sm">
                                        🏠 Show me around the site
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Get a guided tour of all features
                                    </div>
                                </button>
                                <button className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-left transition-colors border border-gray-200 dark:border-gray-700">
                                    <div className="font-medium text-black dark:text-white text-sm">
                                        🏗️ Help me setup my garage
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Create and manage your vehicle collection
                                    </div>
                                </button>
                                <button className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-left transition-colors border border-gray-200 dark:border-gray-700">
                                    <div className="font-medium text-black dark:text-white text-sm">
                                        🚗 Let's discover my next vehicle
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Find the perfect car for your needs
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => {
                            const isAI = message.sender.name === "Scrutineer";
                            return (
                                <div
                                    key={message.id}
                                    className={`flex gap-4 ${isAI ? 'items-start' : 'items-start flex-row-reverse'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isAI ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-600'}`}>
                                        {isAI ? (
                                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                <span className="text-xs font-bold text-blue-600">AI</span>
                                            </div>
                                        ) : (
                                            <span className="text-white text-sm font-medium">
                                                {message.sender.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`flex-1 ${!isAI ? 'flex flex-col items-end' : ''}`}>
                                        <div className={`flex items-baseline gap-2 mb-1 ${!isAI ? 'flex-row-reverse' : ''}`}>
                                            <p className="font-bold text-black dark:text-white">
                                                {message.sender.name}
                                            </p>
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                {message.timestamp}
                                            </span>
                                        </div>
                                        <div className={`p-3 rounded-lg max-w-md ${isAI ? 'bg-gray-100 dark:bg-gray-800' : 'bg-blue-600 text-white'}`}>
                                            <p className={`${isAI ? 'text-gray-800 dark:text-gray-200' : 'text-white'}`}>
                                                {message.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <footer className="mt-auto flex items-center gap-2 p-4 border-t border-white/30">
                    <input
                        type="text"
                        placeholder="Ask Scrutineer anything about vehicles..."
                        className={cn(
                            "flex-1 w-full px-4 py-2 rounded-full border border-white/30",
                            "bg-black/50 backdrop-blur-sm text-white placeholder-white/60",
                            "focus:outline-none focus:ring-2 focus:ring-lime-500 transition-shadow"
                        )}
                    />
                    <button
                        aria-label="Send message"
                        className="p-2 rounded-full bg-lime-500 hover:bg-lime-600 text-black transition-all duration-200 shadow-lg"
                    >
                        <Send className="w-5 h-5" />
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
