
import { createClient } from '@/lib/supabase/server';
import { embed, generateText } from 'ai';
import { vercelGateway } from '@/lib/ai-gateway';
import { NextResponse } from 'next/server';
import type { VehicleSummary } from '@repo/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const mode = searchParams.get('mode'); // 'ids' or undefined
    const idsParam = searchParams.get('ids'); // comma separated ids
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '24', 10);
    const fetchLimit = pageSize * 2;

    try {
        const supabase = await createClient();

        // 1. MODE: Fetch All IDs (Legacy Shuffle) - Keeping for compatibility if needed
        if (mode === 'ids') {
            // ... existing logic can remain or be deprecated. 
            // Ideally we use RPC for random now, so client doesn't need to shuffle 70k IDs.
            // But let's leave valid logic for now to not break pending client requests.
            let pool = supabase.from('v_vehicle_data_typed').select('id').limit(100000);
            const { data } = await pool;
            return NextResponse.json({ ids: data?.map(r => r.id) || [] });
        }

        let data: any[] | null = [];
        let error: any = null;

        // 2. MODE: ID Lookup (Legacy Shuffle Pagination)
        if (idsParam) {
            const targetIds = idsParam.split(',').filter(Boolean);
            if (targetIds.length > 0) {
                // ... same logic
                const res = await supabase.from('vehicle_data').select('*').in('id', targetIds);
                data = res.data;
                if (data) {
                    data.sort((a, b) => targetIds.indexOf(a.id) - targetIds.indexOf(b.id));
                }
            }
        }
        // 3. MODE: Random Browse (Empty Query)
        else if (!query || query.trim() === '') {
            // NEW: Use the RPC for true random selection!
            // This fixes the "2001 bias"
            const { data: randomVehicles, error: randError } = await supabase.rpc('get_random_vehicles', {
                limit_val: fetchLimit
            });

            if (randError) throw randError;
            data = randomVehicles;
        }
        // 4. MODE: Magic Search (Query Present)
        else {
            // 4a. MAGIC STEP: Extract Filters using AI
            // We use generateText + Manual Parsing instead of generateObject to avoid
            // "response_format" errors with certain Vercel AI Gateway paths.
            let filters: any = {};
            try {
                const { text } = await generateText({
                    model: vercelGateway.languageModel('gpt-4o-mini'),
                    system: 'You are a search query optimizer. Output ONLY valid JSON. No markdown code blocks.',
                    prompt: `Extract vehicle search filters from this query: "${query}".
                    Schema:
                    {
                      "year_min": number | null,
                      "year_max": number | null,
                      "make": string | null,
                      "model": string | null,
                      "price_max": number | null,
                      "search_query": string (refined keyword query)
                    }

                    Rules:
                    - If user says "Toyota", set make="Toyota".
                    - If "Cheap track car", set search_query="Cheap track car" (don't set price unless explicit).
                    - If "under 20k", set price_max=20000.
                    
                    Respond with the JSON object only.`
                });

                // Robust parsing: extract JSON from potential markdown wrappers
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    filters = JSON.parse(jsonMatch[0]);
                    console.log('[Magic Search] Extracted:', filters);
                }
            } catch (e) {
                console.warn('[Magic Search] Extraction failed, falling back to raw query:', e);
                // Fallback: Use original query, no filters
                filters = {};
            }

            console.log('[Magic Search] Extracted:', filters);

            // 4b. Embed the REFINED query (or original if extraction was partial)
            // Use specific search_query if AI suggests it, otherwise fallback to user input
            const textToEmbed = filters.search_query || query;

            const { embedding } = await embed({
                model: vercelGateway.textEmbeddingModel('text-embedding-3-small', {
                    dimensions: 512
                }),
                value: textToEmbed,
            });

            // 4c. Call RPC (Step 1: Get Lightweight IDs)
            // We use the optimized search_vehicle_ids function which only returns ID + similarity.
            const { data: matches, error: rpcError } = await supabase.rpc('search_vehicle_ids', {
                query_embedding: embedding,
                match_threshold: 0.1,
                match_count: 50
            });

            if (rpcError) throw rpcError;

            if (matches && matches.length > 0) {
                // Step 2: Fetch only needed data for IDs returned
                const ids = matches.map((m: any) => m.id);

                let queryBuilder = supabase
                    .from('vehicle_data')
                    .select('id, year, make, model, images_url') // Light select
                    .in('id', ids);

                // Apply Filters to the Data Fetch (Client-side filtering of the vector results)
                if (filters.make) {
                    queryBuilder = queryBuilder.ilike('make', filters.make);
                }
                if (filters.model) {
                    queryBuilder = queryBuilder.ilike('model', `%${filters.model}%`);
                }
                if (filters.year_min) {
                    queryBuilder = queryBuilder.gte('year', String(filters.year_min));
                }
                if (filters.year_max) {
                    queryBuilder = queryBuilder.lte('year', String(filters.year_max));
                }
                // Note: Price filter is omitted as robust "text-price" parsing is hard in simple JS helpers 
                // without the previous RPC's regex logic.

                const res = await queryBuilder;

                if (res.data) {
                    data = res.data.map((vehicle) => {
                        const match = matches.find((m: any) => m.id === vehicle.id);
                        return { ...vehicle, _similarity: match ? match.similarity : 0 };
                    }).sort((a, b) => b._similarity - a._similarity);
                }
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
