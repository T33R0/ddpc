
import { get_repo_structure } from '../src/lib/ogma/tools';

async function testGetRepoStructure() {
    console.log('Testing get_repo_structure with path "." (expecting repo root)...');
    try {
        const result = await get_repo_structure.execute({ path: '.' });
        if (result.success) {
            console.log('SUCCESS: Retrieved repo structure.');
            console.log('Root:', result.root);
            console.log('Tree (first 500 chars):', result.tree.substring(0, 500));
        } else {
            console.error('FAILURE: Tool execution returned success=false');
            console.error('Error:', result.error);
        }
    } catch (error) {
        console.error('CRITICAL FAILURE: Tool execution threw an error');
        console.error(error);
    }
}

testGetRepoStructure();
