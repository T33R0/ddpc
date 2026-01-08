
import { createClient } from '@/lib/supabase/server';
import { embed } from 'ai';
import { vercelGateway } from '@/lib/ai-gateway';
import { NextResponse } from 'next/server';
import type { VehicleSummary } from '@repo/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    try {
        const supabase = await createClient();
        let data: any[] | null = [];
        let error: any = null;

        if (!query || query.trim() === '') {
            // Fallback: Return most recent vehicles
            const res = await supabase
                .from('vehicle_data')
                .select('*')
                .order('date_added', { ascending: false })
                .limit(50); // Fetch more to allow for grouping

            data = res.data;
            error = res.error;
        } else {
            // Generate Embedding
            const { embedding } = await embed({
                model: vercelGateway.textEmbeddingModel('text-embedding-3-small'),
                value: query,
            });

            // Semantic Search via RPC
            const { data: matches, error: rpcError } = await supabase.rpc('match_vehicles', {
                query_embedding: embedding,
                match_threshold: 0.5,
                match_count: 50, // Fetch more to allow for grouping
            });

            if (rpcError) throw rpcError;

            if (matches && matches.length > 0) {
                const ids = matches.map((m: any) => m.id);
                const res = await supabase
                    .from('vehicle_data')
                    .select('*')
                    .in('id', ids);

                if (res.error) throw res.error;

                // Sort by similarity
                data = res.data?.map((vehicle) => {
                    const match = matches.find((m: any) => m.id === vehicle.id);
                    return {
                        ...vehicle,
                        _similarity: match ? match.similarity : 0
                    };
                }).sort((a, b) => b._similarity - a._similarity) || [];
            }
        }

        if (error) {
            console.error('Data fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // --- Image Resolution & Grouping (Copied/Adapted from explore/vehicles) ---
        const vehicleIds = data.map((v: any) => v.id);
        const imageMap = new Map<string, string>();

        // Fetch primary images
        if (vehicleIds.length > 0) {
            try {
                const { data: images } = await supabase
                    .from('vehicle_primary_image')
                    .select('vehicle_id, url')
                    .in('vehicle_id', vehicleIds);

                if (images) {
                    images.forEach((img: any) => {
                        if (img.url) imageMap.set(img.vehicle_id, img.url);
                    });
                }
            } catch (imgError) {
                console.warn('Failed to fetch primary images:', imgError);
            }
        }

        // Grouping Logic
        const vehicleMap = new Map<string, VehicleSummary>();
        const groupedOrder: string[] = []; // To preserve sort order

        data.forEach((row: any) => {
            const key = `${row.year}-${row.make}-${row.model}`;
            const primaryUrl = imageMap.get(row.id);

            let imageUrl = row.images_url;
            if (typeof imageUrl === 'string' && imageUrl.includes(';')) {
                imageUrl = imageUrl.split(';')[0];
            }

            const resolvedImage = primaryUrl || imageUrl || null;

            if (!vehicleMap.has(key)) {
                groupedOrder.push(key);
                vehicleMap.set(key, {
                    id: row.id || key,
                    year: String(row.year),
                    make: row.make,
                    model: row.model,
                    heroImage: resolvedImage,
                    trims: [],
                });
            }

            const summary = vehicleMap.get(key)!;
            summary.trims.push({
                ...row,
                id: row.id,
                primaryImage: resolvedImage,
                image_url: resolvedImage,
            });
        });

        const summaries = groupedOrder.map(key => vehicleMap.get(key)!);

        return NextResponse.json({
            data: summaries,
        });

    } catch (error: any) {
        console.error('Internal Search Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
