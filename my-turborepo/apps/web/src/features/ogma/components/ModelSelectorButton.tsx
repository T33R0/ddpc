'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@repo/ui/dialog';
import { Bot, Cpu, Lightbulb, PenTool, Sparkles, Check } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

export interface ModelSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function ModelSelectorButton({ value, onChange }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const model = value;
    const setModel = onChange;


    const models = [
        {
            id: 'synthesizer',
            name: 'Synthesizer (Default)',
            description: 'The integrated voice of Ogma. Uses the Trinity (Architect, Visionary, Engineer) to synthesize the best response.',
            icon: Sparkles,
            color: 'text-primary',
            borderColor: 'border-primary'
        },
        {
            id: 'architect',
            name: 'The Architect',
            description: 'Focuses on structure, patterns, and long-term system integrity.',
            icon: PenTool,
            color: 'text-blue-500',
            borderColor: 'border-blue-500'
        },
        {
            id: 'visionary',
            name: 'The Visionary',
            description: 'Focuses on innovation, user experience, and strategic positioning.',
            icon: Lightbulb,
            color: 'text-purple-500',
            borderColor: 'border-purple-500'
        },
        {
            id: 'engineer',
            name: 'The Engineer',
            description: 'Focuses on implementation, code correctness, and execution.',
            icon: Cpu,
            color: 'text-emerald-500',
            borderColor: 'border-emerald-500'
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="p-4 border-b border-border bg-background/50 backdrop-blur-sm cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Bot className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-semibold tracking-tight">Ogma Admin Console</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Model: {model}</span>
                        </div>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Select Ogma Model</DialogTitle>
                    <DialogDescription>
                        Choose which aspect of Ogma you want to interact with directly.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 gap-4">
                        {models.map((m) => (
                            <div
                                key={m.id}
                                onClick={() => setModel(m.id)}
                                className={cn(
                                    "flex flex-col items-start space-y-1 rounded-md border p-4 cursor-pointer transition-all",
                                    model === m.id ? `bg-muted/50 ${m.borderColor} border-2` : "border-border hover:bg-muted/30"
                                )}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <m.icon className={cn("w-4 h-4", m.color)} />
                                    <span className="font-semibold">{m.name}</span>
                                    {model === m.id && <Check className="w-4 h-4 text-primary ml-auto" />}
                                </div>
                                <span className="text-xs text-muted-foreground pl-6">
                                    {m.description}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
