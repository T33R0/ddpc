'use client';

import React from 'react';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { ExternalLink, ShoppingCart, Plus } from 'lucide-react';
import { VehicleInstalledComponent } from '../types';
import { HealthResult } from '../lib/health';
import { cn } from '@repo/ui/lib/utils';

interface ReorderPromptProps {
    part: VehicleInstalledComponent;
    health: HealthResult;
    onAddToWishlist?: () => void;
    className?: string;
}

/**
 * Inline reorder prompt shown on PartCard when health is Warning or Critical.
 * Links to affiliate URL if available, otherwise offers wishlist add.
 */
export function ReorderPrompt({ part, health, onAddToWishlist, className }: ReorderPromptProps) {
    if (!health.reorderRecommended) return null;

    const affiliateUrl = part.master_part?.affiliate_url;
    const isCritical = health.status === 'Critical';

    return (
        <div className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
            isCritical
                ? "bg-destructive/10 border border-destructive/20"
                : "bg-warning/10 border border-warning/20",
            className
        )}>
            <ShoppingCart className={cn(
                "w-3.5 h-3.5 shrink-0",
                isCritical ? "text-destructive" : "text-warning"
            )} />
            <span className="flex-1 text-muted-foreground">
                {isCritical ? 'Replacement overdue' : 'Consider ordering a replacement'}
            </span>

            {affiliateUrl ? (
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-6 text-[10px] px-2 gap-1",
                        isCritical
                            ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                            : "border-warning/30 text-warning hover:bg-warning/10"
                    )}
                    asChild
                >
                    <a href={affiliateUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" /> Order Replacement
                    </a>
                </Button>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2 gap-1"
                    onClick={onAddToWishlist}
                >
                    <Plus className="w-3 h-3" /> Add to Wishlist
                </Button>
            )}
        </div>
    );
}
