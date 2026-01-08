
import { getRelevantImprovements, recordImprovement } from '../src/lib/ogma/memory';

// Mock the Supabase client for local testing if needed, 
// OR this script is intended to run where env vars allow connection.
// For robust verification in this environment (without db access), we focus on code correctness.

async function verifyMemory() {
    console.log('--- Verifying Ogma Memory System ---');

    try {
        // 1. Test Fetching (Expecting empty string first if DB empty, or mocked return)
        console.log('Fetching relevant improvements...');
        const context = await getRelevantImprovements(3);
        console.log('Context Output:', context ? context : '(None found, as expected for empty/mock db)');

        // 2. Test Recording (Mocked)
        console.log('Recording new improvement...');
        await recordImprovement('Strategy', 'Always verify user intent before deleting data.', 95);
        console.log('Recorded successfully.');

        console.log('--- Verification Complete ---');
    } catch (err) {
        console.error('Verification failed:', err);
    }
}

verifyMemory();
