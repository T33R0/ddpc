
import { createClient } from '@/lib/supabase/server';
import { embed } from 'ai';
import { vercelGateway } from '@/lib/ai-gateway';
import { NextResponse } from 'next/server';
import type { VehicleSummary } from '@repo/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const mode = searchParams.get('mode'); // 'ids' or undefined
    const idsParam = searchParams.get('ids'); // comma separated ids
    const sort = searchParams.get('sort'); // 'newest', 'year_desc', 'year_asc'
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '24', 10);
    const fetchLimit = pageSize * 2; // Fetch slightly more to ensure grouping filling

    try {
        const supabase = await createClient();

        // --- MODE: Fetch All IDs (For Random Shuffle) ---
        if (mode === 'ids') {
            // Return ALL valid vehicle IDs for client-side shuffling (limit to 10000 for now)
            const { data: allIds, error: idError } = await supabase
                .from('v_vehicle_data_typed') // Use view if possible for speed, or table
                .select('id')
                .limit(10000); // Ensure we get a large sample, default is often 1000

            if (idError) throw idError;

            return NextResponse.json({
                ids: allIds?.map(r => r.id) || []
            });
        }

        let data: any[] | null = [];
        let error: any = null;

        // --- MODE: ID Lookup (For Random Pages) ---
        if (idsParam) {
            const targetIds = idsParam.split(',').filter(Boolean);
            if (targetIds.length > 0) {
                const res = await supabase
                    .from('vehicle_data')
                    .select('*')
                    .in('id', targetIds);
                data = res.data;
                error = res.error;

                // Re-sort data to match the order of targetIds (which might be shuffled)
                if (data && data.length > 0) {
                    data.sort((a, b) => {
                        return targetIds.indexOf(a.id) - targetIds.indexOf(b.id);
                    });
                }
            }
        }
        // --- MODE: Search or Standard Browse ---
        else if (!query || query.trim() === '') {
            // Standard Browse with Sort/Pagination
            let dbQuery = supabase
                .from('vehicle_data')
                .select('*');

            // Sorting
            switch (sort) {
                case 'year_asc':
                    dbQuery = dbQuery.order('year', { ascending: true });
                    break;
                case 'year_desc':
                    dbQuery = dbQuery.order('year', { ascending: false });
                    break;
                case 'newest':
                default:
                    dbQuery = dbQuery.order('date_added', { ascending: false });
                    break;
            }

            // Secondary sort for stability
            if (sort !== 'newest') {
                dbQuery = dbQuery.order('make', { ascending: true }).order('model', { ascending: true });
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + fetchLimit - 1; // Fetch limit is higher for grouping
            dbQuery = dbQuery.range(from, to);

            const res = await dbQuery;
            data = res.data;
            error = res.error;
        } else {
            // Semantic Search (Overrides Sort for now, or applies after? Applying after matches is hard with RPC)
            // For now, search matches are sorted by similarity.

            // Generate Embedding
            const { embedding } = await embed({
                model: vercelGateway.textEmbeddingModel('text-embedding-3-small'),
                value: query,
            });

            // Semantic Search via RPC
            const { data: matches, error: rpcError } = await supabase.rpc('match_vehicles', {
                query_embedding: embedding,
                match_threshold: 0.1,
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
