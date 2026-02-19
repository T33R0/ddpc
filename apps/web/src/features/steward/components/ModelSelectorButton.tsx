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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/ui/select';
import { Settings, Bot, Cpu, Lightbulb, PenTool, Sparkles } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Label } from '@repo/ui/label';

export interface ModelConfig {
    synthesizer: string;
    architect: string;
    visionary: string;
    engineer: string;
}

export interface ModelSelectorProps {
    config: ModelConfig;
    onChange: (config: ModelConfig) => void;
}

const MODEL_OPTIONS = [
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'google/gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'openai/o1-preview', label: 'o1 Preview' },
    { value: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2' },
    { value: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];

export function ModelSelectorButton({ config, onChange }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const updateConfig = (key: keyof ModelConfig, value: string) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group border border-transparent hover:border-border cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                            <Settings className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-medium">System Config</span>
                            <span className="text-[10px] text-muted-foreground">Trinity & Synthesizer</span>
                        </div>
                    </div>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Steward System Configuration</DialogTitle>
                    <DialogDescription>
                        Configure the underlying models for the Synthesizer and the Trinity agents.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">

                    {/* Synthesizer */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-primary">
                            <Sparkles className="w-4 h-4" /> Synthesizer (The Voice)
                        </Label>
                        <p className="text-[11px] text-muted-foreground mb-2">The final voice that synthesizes all inputs.</p>
                        <Select value={config.synthesizer} onValueChange={(v) => updateConfig('synthesizer', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                                {MODEL_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-px bg-border my-2" />

                    {/* Architect */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-blue-500">
                            <PenTool className="w-4 h-4" /> The Architect
                        </Label>
                        <Select value={config.architect} onValueChange={(v) => updateConfig('architect', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                                {MODEL_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Visionary */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-purple-500">
                            <Lightbulb className="w-4 h-4" /> The Visionary
                        </Label>
                        <Select value={config.visionary} onValueChange={(v) => updateConfig('visionary', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                                {MODEL_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Engineer */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-emerald-500">
                            <Cpu className="w-4 h-4" /> The Engineer
                        </Label>
                        <Select value={config.engineer} onValueChange={(v) => updateConfig('engineer', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                                {MODEL_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
