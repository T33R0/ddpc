import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSpecSchema() {
    console.log('Seeding Engine Oil spec_schema...');

    try {
        // Update Engine Oil to have a viscosity field
        const { data, error } = await supabase
            .from('component_types')
            .update({
                spec_schema: {
                    fields: [
                        {
                            key: 'viscosity',
                            label: 'Viscosity',
                            type: 'select',
                            options: ['0W-20', '0W-30', '5W-30', '5W-40', '10W-30', '10W-40', '10W-60'],
                            required: true
                        },
                        {
                            key: 'capacity',
                            label: 'Capacity',
                            type: 'number',
                            unit: 'Quarts',
                            required: false
                        }
                    ]
                }
            })
            .eq('name', 'Engine Oil')
            .select();

        if (error) throw error;

        console.log('✅ Updated Engine Oil schema:', data);

        // Also update "Brake Pads" for a text input example
        await supabase
            .from('component_types')
            .update({
                spec_schema: {
                    fields: [
                        {
                            key: 'material',
                            label: 'Material',
                            type: 'select',
                            options: ['Ceramic', 'Semi-Metallic', 'Organic'],
                            required: true
                        },
                        {
                            key: 'thickness',
                            label: 'Thickness',
                            type: 'number',
                            unit: 'mm'
                        }
                    ]
                }
            })
            .eq('name', 'Brake Pads');

        console.log('✅ Updated Brake Pads schema');

    } catch (err) {
        console.error('❌ Seeding Failed:', err);
    }
}

seedSpecSchema();
