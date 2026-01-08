
import { generateVehicleEmbedding } from '../src/lib/embeddings';
import { Vehicle } from '../src/lib/types';

// Mock Vehicle
const mockVehicle: Vehicle = {
    id: 'test-id',
    year: '2024',
    make: 'Toyota',
    model: 'Camry',
    trim: 'LE',
    trim_description: 'Standard sedan description',
    // minimal required fields for the interface
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    role: 'user',
    plan: 'free',
    banned: false,
    // Add other required fields from Vehicle if necessary to satisfy TS, 
    // but for the embedding function, we only need the above.
    // Casting to any to avoid filling all 100+ fields for this test script if TS is strict.
} as any as Vehicle;

async function test() {
    console.log('Testing generateVehicleEmbedding...');
    try {
        // This will likely fail if openai-edge is not installed or API key is missing
        const embedding = await generateVehicleEmbedding(mockVehicle);
        console.log('Embedding generated successfully!');
        console.log('Dimensions:', embedding.length);
        console.log('Sample:', embedding.slice(0, 5));
    } catch (error) {
        console.error('Failed to generate embedding:', error);
    }
}

test();
