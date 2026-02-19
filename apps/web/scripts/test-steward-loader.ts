
import { loadConstitution, formatConstitutionForPrompt, EMERGENCY_IDENTITY } from '../src/lib/steward/context-loader';

async function verify() {
    console.log('--- Starting Steward Context Loader Verification ---');

    try {
        const config = {};

        console.log('Loading constitution...');
        const identity = await loadConstitution(config);

        console.log('Loaded Identity Name:', identity.name);

        if (identity === EMERGENCY_IDENTITY) {
            console.warn('WARNING: Loaded Emergency Identity!');
        } else {
            console.log('SUCCESS: Loaded Constitution from source.');
        }

        console.log('\n--- Formatted Prompt ---');
        const prompt = formatConstitutionForPrompt(identity);
        console.log(prompt.slice(0, 500) + '...[truncated]');

        console.log('\n--- Verification Complete ---');
    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verify();
