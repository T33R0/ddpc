'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@repo/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group';
import { Label } from '@repo/ui/label';
import { Bot, Cpu, Lightbulb, PenTool, Sparkles } from 'lucide-react';

export function ModelSelectorButton() {
    const [model, setModel] = useState('synthesizer');
    const [isOpen, setIsOpen] = useState(false);

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
                    <RadioGroup defaultValue={model} onValueChange={setModel} className="grid grid-cols-1 gap-4">

                        <Label
                            htmlFor="synthesizer"
                            className="flex flex-col items-start space-y-1 rounded-md border p-4 hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-primary"
                        >
                            <div className="flex items-center gap-2 w-full">
                                <RadioGroupItem value="synthesizer" id="synthesizer" />
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="font-semibold">Synthesizer (Default)</span>
                            </div>
                            <span className="text-xs text-muted-foreground pl-6">
                                The integrated voice of Ogma. Uses the Trinity (Architect, Visionary, Engineer) to synthesize the best response.
                            </span>
                        </Label>

                        <Label
                            htmlFor="architect"
                            className="flex flex-col items-start space-y-1 rounded-md border p-4 hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-blue-500"
                        >
                            <div className="flex items-center gap-2 w-full">
                                <RadioGroupItem value="architect" id="architect" />
                                <PenTool className="w-4 h-4 text-blue-500" />
                                <span className="font-semibold">The Architect</span>
                            </div>
                            <span className="text-xs text-muted-foreground pl-6">
                                Focuses on structure, patterns, and long-term system integrity.
                            </span>
                        </Label>

                        <Label
                            htmlFor="visionary"
                            className="flex flex-col items-start space-y-1 rounded-md border p-4 hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-purple-500"
                        >
                            <div className="flex items-center gap-2 w-full">
                                <RadioGroupItem value="visionary" id="visionary" />
                                <Lightbulb className="w-4 h-4 text-purple-500" />
                                <span className="font-semibold">The Visionary</span>
                            </div>
                            <span className="text-xs text-muted-foreground pl-6">
                                Focuses on innovation, user experience, and strategic positioning.
                            </span>
                        </Label>

                        <Label
                            htmlFor="engineer"
                            className="flex flex-col items-start space-y-1 rounded-md border p-4 hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-emerald-500"
                        >
                            <div className="flex items-center gap-2 w-full">
                                <RadioGroupItem value="engineer" id="engineer" />
                                <Cpu className="w-4 h-4 text-emerald-500" />
                                <span className="font-semibold">The Engineer</span>
                            </div>
                            <span className="text-xs text-muted-foreground pl-6">
                                Focuses on implementation, code correctness, and execution.
                            </span>
                        </Label>

                    </RadioGroup>
                </div>
            </DialogContent>
        </Dialog>
    );
}
