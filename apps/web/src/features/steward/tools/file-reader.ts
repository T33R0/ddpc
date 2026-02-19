import { tool, jsonSchema } from 'ai';
import { readFileSync, existsSync } from 'fs';
import { join, relative } from 'path';

// Helper to create tools with type erasure for TypeScript
const createUntypedTool = (config: any): any => tool(config);

/**
 * Tool: read_file_content
 * Takes a file path and returns the raw text
 * Tries GitHub API first, falls back to local filesystem
 * Allows Steward to 'read' code
 */
export const read_file_content = createUntypedTool({
  description: 'Takes a file path and returns the raw text content.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Relative path to the file from repository root, or absolute path.' },
      use_github: { type: 'string', description: 'Set to "true" for GitHub API or "false" for local filesystem (faster).' },
      branch: { type: 'string', description: 'GitHub branch to read from. Defaults to main.' },
    },
    required: ['path'],
  }),
  execute: async ({ path, use_github: useGithubStr, branch: branchArg }: { path: string; use_github?: string; branch?: string }) => {
    const use_github = useGithubStr === 'true';
    const branch = branchArg || 'main';

    // Server-side debug logging
    if (typeof window === 'undefined') {
      console.log(`[read_file_content] Tool called with path: ${path}, use_github: ${use_github}, branch: ${branch}`);
    }

    // Try GitHub API first if token is available and not explicitly disabled
    if (process.env.GITHUB_TOKEN && use_github) {
      try {
        const { Octokit } = await import('@octokit/rest');
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

        const owner = process.env.GITHUB_OWNER || '';
        const repo = process.env.GITHUB_REPO || '';

        if (owner && repo) {
          const { data: fileData } = await octokit.repos.getContent({
            owner,
            repo,
            path: path,
            ref: branch || 'main',
          });

          // GitHub API can return an array (for directories) or a single object (for files)
          if (Array.isArray(fileData)) {
            throw new Error(`Path is a directory, not a file: ${path}`);
          }

          // GitHub API returns base64 encoded content for files
          if (fileData.type === 'file' && 'content' in fileData && fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

            if (typeof window === 'undefined') {
              console.log(`[read_file_content] Successfully read file from GitHub: ${owner}/${repo}/${path} (${content.length} bytes)`);
            }

            return {
              success: true,
              path: path,
              content,
              size: content.length,
              source: 'github',
              repo: `${owner}/${repo}`,
              branch: branch || 'main',
            };
          } else {
            throw new Error(`Path is not a file: ${path}`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (typeof window === 'undefined') {
          console.warn(`[read_file_content] GitHub API failed, falling back to filesystem: ${errorMessage}`);
        }
        // Fall through to filesystem fallback
      }
    }

    // Fallback to local filesystem
    try {
      const currentDir = process.cwd();
      // Determine the true repository root (handle Windows paths)
      const repoRoot = (currentDir.includes('apps/web') || currentDir.includes('apps\\web'))
        ? join(currentDir, '../..')
        : currentDir;

      // START ROBUST PATH RESOLUTION
      let filePath = '';
      let resolvedSuccessfully = false;

      // normalize inputs
      const rawPath = path.replace(/\\/g, '/');
      const candidates = [
        rawPath, // 1. Try exact path
      ];

      // 2. If it doesn't start with apps/web, maybe it's inside it?
      if (!rawPath.startsWith('apps/web')) {
        candidates.push(join('apps/web/src', rawPath)); // Try src first
        candidates.push(join('apps/web', rawPath));     // Try project root
      }

      // 3. Try each candidate
      for (const candidate of candidates) {
        const fullPath = join(repoRoot, candidate);
        if (existsSync(fullPath)) {
           filePath = fullPath;
           resolvedSuccessfully = true;
           if (candidate !== rawPath && typeof window === 'undefined') {
             console.log(`[read_file_content] Path '${rawPath}' auto-corrected to '${candidate}'`);
           }
           break;
        }
      }

      if (!resolvedSuccessfully) {
         throw new Error(`File not found: ${path} (Checked: ${candidates.join(', ')})`);
      }
      // END ROBUST PATH RESOLUTION

      // Security: ensure the path is within the repo root
      const resolvedPath = relative(repoRoot, filePath);
      if (resolvedPath.startsWith('..') || resolvedPath.includes('node_modules')) {
        throw new Error('Access denied: path is outside repository root or in node_modules');
      }

      if (typeof window === 'undefined') {
        console.log(`[read_file_content] Resolved path: ${filePath}`);
      }

      const content = readFileSync(filePath, 'utf-8');

      if (typeof window === 'undefined') {
        console.log(`[read_file_content] Successfully read file from filesystem: ${filePath} (${content.length} bytes)`);
      }

      return {
        success: true,
        path: filePath,
        content,
        size: content.length,
        source: 'filesystem',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (typeof window === 'undefined') {
        console.error(`[read_file_content] Error reading file: ${errorMessage}`);
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
