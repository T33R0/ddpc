'use client';

import React from 'react';
import { Card, CardContent } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { Droplets, Clock, Gauge } from 'lucide-react';
import { FluidWithHealth } from '../types';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';

const fluidTypeIcons: Record<string, string> = {
    engine_oil: '🛢️',
    coolant: '❄️',
    brake_fluid: '🔴',
    transmission: '⚙️',
    differential: '🔧',
    power_steering: '🎯',
    transfer_case: '🔗',
    custom: '💧',
};

interface FluidCardProps {
    fluid: FluidWithHealth;
    onClick?: () => void;
}

export function FluidCard({ fluid, onClick }: FluidCardProps) {
    const icon = fluidTypeIcons[fluid.fluid_type] || '💧';
    const healthColor = fluid.health_status === 'critical'
        ? 'bg-destructive'
        : fluid.health_status === 'warning'
            ? 'bg-warning'
            : 'bg-success';

    return (
        <Card
            className={cn(
                "bg-card border-border shadow-sm hover:shadow-md transition-all cursor-pointer group",
                fluid.health_status === 'critical' && "border-destructive/30",
                fluid.health_status === 'warning' && "border-warning/30",
            )}
            onClick={onClick}
        >
            <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg" role="img" aria-label={fluid.fluid_type}>{icon}</span>
                        <div className="min-w-0">
                            <h4 className="font-semibold text-sm leading-tight truncate">{fluid.name}</h4>
                            {fluid.specification && (
                                <p className="text-xs text-muted-foreground truncate">{fluid.specification}</p>
                            )}
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-[10px] px-1.5 h-5 whitespace-nowrap",
                            fluid.health_status === 'critical' && "text-destructive border-destructive/30",
                            fluid.health_status === 'warning' && "text-warning border-warning/30",
                            fluid.health_status === 'good' && "text-success border-success/30",
                        )}
                    >
                        {fluid.health_percent}%
                    </Badge>
                </div>

                {/* Health bar */}
                <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                        className={cn("h-1.5 rounded-full transition-all", healthColor)}
                        style={{ width: `${fluid.health_percent}%` }}
                    />
                </div>

                {/* Details */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {fluid.last_changed_at && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(fluid.last_changed_at), 'MMM d, yyyy')}
                        </span>
                    )}
                    {fluid.miles_remaining !== null && (
                        <span className="flex items-center gap-1">
                            <Gauge className="w-3 h-3" />
                            {fluid.miles_remaining > 0
                                ? `${fluid.miles_remaining.toLocaleString()} mi left`
                                : 'Overdue'
                            }
                        </span>
                    )}
                    {fluid.capacity && (
                        <span className="flex items-center gap-1">
                            <Droplets className="w-3 h-3" />
                            {fluid.capacity}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
