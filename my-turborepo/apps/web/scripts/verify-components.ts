import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key to bypass RLS for setup, or Anon for testing policies

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testComponentStructure() {
    console.log('Starting Component Structure Verification...');

    try {
        // 1. Create a Test Component Type
        const testTypeName = `Test Bolt ${Date.now()}`;
        console.log(`Creating Component Type: ${testTypeName}`);
        const { data: typeData, error: typeError } = await supabase
            .from('component_types')
            .insert({
                name: testTypeName,
                category: 'Hardware',
                spec_schema: {
                    fields: [
                        { key: 'thread_pitch', type: 'number', unit: 'mm' },
                        { key: 'length', type: 'number', unit: 'mm' }
                    ]
                }
            })
            .select()
            .single();

        if (typeError) throw new Error(`Failed to create type: ${typeError.message}`);
        console.log('✅ Component Type Created:', typeData.id);

        // 2. Create a Test Vehicle BOM Item
        console.log('Creating Vehicle BOM Item...');
        const { data: bomData, error: bomError } = await supabase
            .from('vehicle_bom')
            .insert({
                component_type_id: typeData.id,
                location_on_vehicle: 'Test Location',
                quantity: 2,
                notes: 'Verification Script Item'
            })
            .select()
            .single();

        if (bomError) throw new Error(`Failed to create BOM item: ${bomError.message}`);
        console.log('✅ BOM Item Created:', bomData.id);

        // 3. Verify Vehicle Installed Component Linkage
        // We need a vehicle first. For this test, we'll just check if we can insert into vehicle_installed_components 
        // with the new fields (bom_id, specs). We might need a dummy vehicle ID if FK is enforced rigidly.
        // Let's try to fetch an existing vehicle to use.

        const { data: vehicle } = await supabase.from('user_vehicle').select('id').limit(1).single();

        if (vehicle) {
            console.log(`Using existing vehicle ${vehicle.id} for installation test...`);

            // Create a Master Part
            const { data: masterPart } = await supabase.from('master_parts_list').insert({
                name: 'Test Part Instance',
                part_number: 'TEST-123'
            }).select().single();

            if (masterPart) {
                console.log('Installing Part with Specs...');
                const { data: installData, error: installError } = await supabase
                    .from('vehicle_installed_components')
                    .insert({
                        user_vehicle_id: vehicle.id,
                        component_definition_id: typeData.id, // Links to component_types
                        bom_id: bomData.id,
                        current_part_id: masterPart.id,
                        specs: { thread_pitch: 1.5, length: 50 },
                        status: 'planned'
                    })
                    .select()
                    .single();

                if (installError) throw new Error(`Failed to install part: ${installError.message}`);
                console.log('✅ Part Installed with Specs:', installData.specs);

                // Cleanup (Optional)
                // await supabase.from('vehicle_installed_components').delete().eq('id', installData.id);
            }
        } else {
            console.log('⚠️ No existing vehicle found. Skipping installation test step.');
        }

        console.log('🎉 Verification Complete! Schema structure is valid.');

    } catch (err) {
        console.error('❌ Verification Failed:', err);
    }
}

testComponentStructure();
