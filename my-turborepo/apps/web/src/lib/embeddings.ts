
import { Configuration, OpenAIApi } from 'openai-edge';
import { Vehicle } from './types';

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

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
        const response = await openai.createEmbedding({
            model: 'text-embedding-3-small',
            input: content,
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.message);
        }

        return result.data[0].embedding;
    } catch (error) {
        console.error('Error generating vehicle embedding:', error);
        throw error;
    }
}
