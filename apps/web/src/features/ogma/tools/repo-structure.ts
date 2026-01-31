import { tool, jsonSchema } from 'ai';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

// Helper to create tools with type erasure for TypeScript
const createUntypedTool = (config: any): any => tool(config);

/**
 * Recursively builds a tree structure of the file system
 * Ignores node_modules, .git, and other common ignore patterns
 */
function buildFileTree(dirPath: string, repoRoot: string, prefix: string = ''): string[] {
  const lines: string[] = [];
  const items = readdirSync(dirPath, { withFileTypes: true })
    .filter(item => {
      const name = item.name;
      // Ignore common directories and files
      return !name.startsWith('.') &&
        name !== 'node_modules' &&
        name !== 'dist' &&
        name !== 'build' &&
        name !== '.next' &&
        name !== '.turbo';
    })
    .sort((a, b) => {
      // Directories first, then files
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const currentPrefix = isLast ? '└── ' : '├── ';

    lines.push(`${prefix}${currentPrefix}${item.name}`);

    if (item.isDirectory()) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      const subTree = buildFileTree(join(dirPath, item.name), repoRoot, nextPrefix);
      lines.push(...subTree);
    }
  });

  return lines;
}

/**
 * Tool: get_repo_structure
 * Returns a tree view of the repository structure
 * Tries GitHub API first, falls back to local filesystem
 * Allows Ogma to 'orient' himself
 */
export const get_repo_structure = createUntypedTool({
  description: 'Returns a tree view of the repository structure.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Subdirectory path to scan. Use "." or "/" to scan from the repository root.' },
      use_github: { type: 'string', description: 'Set to "true" to use GitHub API or "false" for local filesystem (faster).' },
    },
  }),
  execute: async ({ path = '.', use_github: useGithubStr }: { path?: string; use_github?: string }) => {
    const use_github = useGithubStr === 'true';

    // Server-side debug logging
    if (typeof window === 'undefined') {
      console.log(`[get_repo_structure] Tool called with path: ${path}, use_github: ${use_github}`);
    }

    // Try GitHub API first if token is available and not explicitly disabled
    if (process.env.GITHUB_TOKEN && use_github) {
      try {
        const { Octokit } = await import('@octokit/rest');
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

        const owner = process.env.GITHUB_OWNER || '';
        const repo = process.env.GITHUB_REPO || '';

        if (owner && repo) {
          const githubPath = path === '.' || path === '/' ? '' : path;

          // Get repository contents
          const { data: contents } = await octokit.repos.getContent({
            owner,
            repo,
            path: githubPath,
          });

          // Build tree structure from GitHub response
          const buildGitHubTree = (items: any[], prefix: string = ''): string[] => {
            const lines: string[] = [];
            const filtered = items
              .filter((item: any) => {
                const name = item.name;
                return !name.startsWith('.') &&
                  name !== 'node_modules' &&
                  name !== 'dist' &&
                  name !== 'build' &&
                  name !== '.next' &&
                  name !== '.turbo';
              })
              .sort((a: any, b: any) => {
                if (a.type === 'dir' && b.type !== 'dir') return -1;
                if (a.type !== 'dir' && b.type === 'dir') return 1;
                return a.name.localeCompare(b.name);
              });

            filtered.forEach((item: any, index: number) => {
              const isLast = index === filtered.length - 1;
              const currentPrefix = isLast ? '└── ' : '├── ';
              lines.push(`${prefix}${currentPrefix}${item.name}${item.type === 'dir' ? '/' : ''}`);
            });

            return lines;
          };

          const items = Array.isArray(contents) ? contents : [contents];
          const treeLines = buildGitHubTree(items);
          const treeString = treeLines.join('\n');

          if (typeof window === 'undefined') {
            console.log(`[get_repo_structure] Successfully built tree from GitHub: ${owner}/${repo}${githubPath ? '/' + githubPath : ''} (${treeLines.length} items)`);
          }

          return {
            success: true,
            tree: treeString,
            source: 'github',
            root: githubPath || 'repository root',
            repo: `${owner}/${repo}`,
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (typeof window === 'undefined') {
          console.warn(`[get_repo_structure] GitHub API failed, falling back to filesystem: ${errorMessage}`);
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
      let targetDir = '';
      let resolvedSuccessfully = false;

      // normalize inputs
      const rawPath = path === '.' || path === '/' ? '' : path.replace(/\\/g, '/');
      const candidates = [
        rawPath, // 1. Try exact path
      ];

      // 2. If it doesn't start with apps/web, maybe it's inside it?
      if (!rawPath.startsWith('apps/web')) {
        candidates.push(join('apps/web/src', rawPath)); // Try src first (most likely for code)
        candidates.push(join('apps/web', rawPath));     // Try project root
      }

      // 3. Try each candidate
      for (const candidate of candidates) {
        const fullPath = candidate ? join(repoRoot, candidate) : repoRoot;
        if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
           targetDir = fullPath;
           resolvedSuccessfully = true;
           if (candidate !== rawPath && typeof window === 'undefined') {
             console.log(`[get_repo_structure] Path '${rawPath}' auto-corrected to '${candidate}'`);
           }
           break;
        }
      }

      if (!resolvedSuccessfully) {
        throw new Error(`Path does not exist or is not a directory: ${path} (Checked: ${candidates.join(', ')})`);
      }
      // END ROBUST PATH RESOLUTION

      const treeLines = buildFileTree(targetDir, repoRoot);
      const treeString = treeLines.join('\n');

      if (typeof window === 'undefined') {
        console.log(`[get_repo_structure] Successfully built tree from: ${targetDir} (${treeLines.length} items)`);
      }

      return {
        success: true,
        tree: treeString,
        source: 'filesystem',
        root: targetDir,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (typeof window === 'undefined') {
        console.error(`[get_repo_structure] Error: ${errorMessage}`);
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
