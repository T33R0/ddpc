
import { embed } from 'ai';
import { vercelGateway } from './ai-gateway';
import { Vehicle } from './types';

export async function generateVehicleEmbedding(vehicle: Vehicle): Promise<number[]> {
    // Concatenate key fields: Year, Make, Model, Trim, Description (trim_description)
    // Mods are currently omitted as they are not in the Vehicle interface
    const content = [
        vehicle.year,
        vehicle.make,
        vehicle.model,
        vehicle.trim,
        vehicle.trim_description
    ]
        .filter((field) => field && field.trim().length > 0)
        .join(' ');

    try {
        const { embedding } = await embed({
            model: vercelGateway.textEmbeddingModel('text-embedding-3-small'),
            value: content,
        });

        return embedding;
    } catch (error) {
        console.error('Error generating vehicle embedding:', error);
        throw error;
    }
}
