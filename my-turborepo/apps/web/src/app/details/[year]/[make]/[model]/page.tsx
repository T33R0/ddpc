import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';

// Helper to format specs
const formatSpec = (value: string | number | null | undefined, unit: string = ''): string => {
    if (value === null || value === undefined || value === 'null' || value === '') return '—';
    return unit ? `${value}${unit}` : `${value}`;
};

export default async function VehicleDetailsPage(props: {
    params: Promise<{ year: string; make: string; model: string }>;
    searchParams: Promise<{ trim?: string }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { year, make, model } = params;
    const decodedMake = decodeURIComponent(make);
    const decodedModel = decodeURIComponent(model);
    const trimId = searchParams.trim;

    const supabase = await createClient();

    // Fetch all trims for this vehicle
    const { data: vehicles, error } = await supabase
        .from('vehicle_data')

    if (error || !vehicles || vehicles.length === 0) {
        console.error('Error fetching vehicle:', error);
        notFound();
    }

    // Find the selected trim or default to the first one
    const selectedVehicle = trimId
        ? vehicles.find((v) => v.id === trimId) || vehicles[0]
        : vehicles[0];

    if (!selectedVehicle) {
        notFound();
    }

    // Image logic: Use the selected trim's image, or fallback to a generic one
    // The discover page uses a hero image logic, but here we'll stick to the specific trim's image if available.
    const imageUrl = selectedVehicle.image_url || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center";

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Header / Nav */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/discover" className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold">
                        {year} {decodedMake} {decodedModel}
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Hero Section */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted/20 shadow-lg">
                        <Image
                            src={imageUrl}
                            alt={`${year} ${decodedMake} ${decodedModel}`}
                            fill
                            className="object-cover"
                            priority
                            unoptimized // Since we might be using external URLs
                        />
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">{selectedVehicle.trim || selectedVehicle.trim_description || 'Base'}</h2>
                            <p className="text-muted-foreground text-lg">
                                {[selectedVehicle.body_type, selectedVehicle.drive_type, selectedVehicle.transmission].filter(Boolean).join(' • ')}
                            </p>
                        </div>

                        {/* Trim Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Select Trim</label>
                            <div className="flex flex-wrap gap-2">
                                {vehicles.map((v) => (
                                    <Link
                                        key={v.id}
                                        href={`/details/${year}/${make}/${model}?trim=${v.id}`}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${v.id === selectedVehicle.id
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-card text-card-foreground border-border hover:bg-muted'
                                            }`}
                                    >
                                        {v.trim || v.trim_description || 'Base'}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-card border border-border">
                                <div className="text-sm text-muted-foreground">MSRP</div>
                                <div className="text-xl font-bold">{selectedVehicle.base_msrp ? `$${parseInt(selectedVehicle.base_msrp).toLocaleString()}` : '—'}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-card border border-border">
                                <div className="text-sm text-muted-foreground">MPG (Combined)</div>
                                <div className="text-xl font-bold">{formatSpec(selectedVehicle.epa_combined_mpg)}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-card border border-border">
                                <div className="text-sm text-muted-foreground">Horsepower</div>
                                <div className="text-xl font-bold">{formatSpec(selectedVehicle.horsepower_hp, ' hp')}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-card border border-border">
                                <div className="text-sm text-muted-foreground">0-60 mph</div>
                                <div className="text-xl font-bold">{formatSpec(selectedVehicle.zero_to_60_mph, ' s')}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Specs Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Engine & Performance */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b border-border pb-2">Engine & Performance</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Engine Type</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.engine_type)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Configuration</dt><dd className="font-medium text-right">{[selectedVehicle.engine_size_l && `${selectedVehicle.engine_size_l}L`, selectedVehicle.cylinders && `${selectedVehicle.cylinders}-cyl`].filter(Boolean).join(' ')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Horsepower</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.horsepower_hp, ' hp')} @ {formatSpec(selectedVehicle.horsepower_rpm, ' rpm')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Torque</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.torque_ft_lbs, ' lb-ft')} @ {formatSpec(selectedVehicle.torque_rpm, ' rpm')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Top Speed</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.top_speed_mph, ' mph')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Drive Type</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.drive_type)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Transmission</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.transmission)}</dd></div>
                        </dl>
                    </div>

                    {/* Dimensions & Weight */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b border-border pb-2">Dimensions & Weight</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Length</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.length_in, '"')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Width</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.width_in, '"')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Height</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.height_in, '"')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Wheelbase</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.wheelbase_in, '"')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Ground Clearance</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.ground_clearance_in, '"')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Curb Weight</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.curb_weight_lbs, ' lbs')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">GVWR</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.gross_weight_lbs, ' lbs')}</dd></div>
                        </dl>
                    </div>

                    {/* Fuel & Efficiency */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b border-border pb-2">Fuel & Efficiency</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Fuel Type</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.fuel_type)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Tank Capacity</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.fuel_tank_capacity_gal, ' gal')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">City MPG</dt><dd className="font-medium text-right">{selectedVehicle.epa_city_highway_mpg ? selectedVehicle.epa_city_highway_mpg.split('/')[0] : '—'}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Highway MPG</dt><dd className="font-medium text-right">{selectedVehicle.epa_city_highway_mpg ? selectedVehicle.epa_city_highway_mpg.split('/')[1] : '—'}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Combined MPG</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.epa_combined_mpg)}</dd></div>
                        </dl>
                    </div>

                    {/* Interior & Cargo */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b border-border pb-2">Interior & Cargo</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Seating Capacity</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.total_seating)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Doors</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.doors)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Cargo Capacity</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.cargo_capacity_cuft, ' cu ft')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Max Cargo</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.max_cargo_capacity_cuft, ' cu ft')}</dd></div>
                        </dl>
                    </div>

                    {/* Chassis & Suspension */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b border-border pb-2">Chassis & Suspension</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Suspension</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.suspension)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Brakes (Front)</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.front_brakes)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Brakes (Rear)</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.rear_brakes)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Tires</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.tires)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Turning Circle</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.turning_circle_ft, ' ft')}</dd></div>
                        </dl>
                    </div>

                    {/* Towing & Hauling */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b border-border pb-2">Towing & Hauling</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Max Towing</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.max_towing_capacity_lbs, ' lbs')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Max Payload</dt><dd className="font-medium text-right">{formatSpec(selectedVehicle.max_payload_lbs, ' lbs')}</dd></div>
                        </dl>
                    </div>

                </div>
            </div>
        </div>
    );
}
