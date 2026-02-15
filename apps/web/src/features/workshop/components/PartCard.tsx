'use client';

import React from 'react';
import { Card, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { ShoppingCart, Plus, Package, ExternalLink } from 'lucide-react';
import { VehicleInstalledComponent } from '@/features/parts/types';
import { cn } from '@repo/ui/lib/utils';

interface PartCardProps {
    part: VehicleInstalledComponent;
    onPurchase?: (id: string) => void;
    onAddToJob?: (id: string) => void;
    className?: string;
}

export function PartCard({ part, onPurchase, onAddToJob, className }: PartCardProps) {
    const isWishlist = part.status === 'wishlist';

    return (
        <Card className={cn("bg-card border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98]", className)}>
            <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <h4 className="font-semibold text-sm leading-tight truncate">{part.name}</h4>
                        {part.part_number && <p className="text-xs text-muted-foreground font-mono mt-0.5">{part.part_number}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                        {part.status === 'ordered' && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] px-1 h-5">
                                Ordered
                            </Badge>
                        )}
                        {part.purchase_price && (
                            <Badge variant="secondary" className="font-mono text-[10px] px-1 h-5">
                                ${part.purchase_price}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                    {part.purchase_url && (
                        <a href={part.purchase_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
                            Vendor <ExternalLink className="w-3 h-3" />
                        </a>
                    )}

                    <div className="flex gap-2 ml-auto">
                        {isWishlist && onPurchase && (
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2 gap-1 bg-success/10 text-success hover:bg-success/20 border-success/20" onClick={(e) => { e.stopPropagation(); onPurchase(part.id); }}>
                                <ShoppingCart className="w-3 h-3" /> Buy
                            </Button>
                        )}

                        {!isWishlist && onAddToJob && (
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2 gap-1" onClick={(e) => { e.stopPropagation(); onAddToJob(part.id); }}>
                                <Plus className="w-3 h-3" /> Job
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
