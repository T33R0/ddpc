'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { Droplets, Plus } from 'lucide-react';
import { FluidWithHealth } from '../types';
import { getVehicleFluids } from '../actions';
import { FluidCard } from './FluidCard';
import { AddFluidModal } from './AddFluidModal';

interface FluidsListProps {
    vehicleId: string;
}

export function FluidsList({ vehicleId }: FluidsListProps) {
    const [fluids, setFluids] = useState<FluidWithHealth[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchFluids = async () => {
        setLoading(true);
        const result = await getVehicleFluids(vehicleId);
        if ('fluids' in result) {
            setFluids(result.fluids);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFluids();
    }, [vehicleId]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <Droplets className="w-4 h-4" />
                    Fluids
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setShowAddModal(true)}
                >
                    <Plus className="w-3 h-3" /> Add Fluid
                </Button>
            </div>

            {loading ? (
                <div className="text-xs text-muted-foreground py-4 text-center">Loading fluids...</div>
            ) : fluids.length === 0 ? (
                <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                    No fluids tracked yet. Add your first fluid to start monitoring.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {fluids.map(fluid => (
                        <FluidCard key={fluid.id} fluid={fluid} />
                    ))}
                </div>
            )}

            <AddFluidModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                vehicleId={vehicleId}
                onSuccess={fetchFluids}
            />
        </div>
    );
}
