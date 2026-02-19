import { tool, jsonSchema } from 'ai';
import { Octokit } from '@octokit/rest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// Helper to create tools with type erasure for TypeScript
// This avoids strict type inference issues between Zod schemas and execute arguments
const createUntypedTool = (config: any): any => tool(config);

// Initialize Octokit with GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Server-side verification log for debugging
if (typeof window === 'undefined') {
  console.log(`GitHub Token Present: ${!!process.env.GITHUB_TOKEN}`);
}

// Get repository owner and name from environment or defaults
const getRepoInfo = () => {
  const owner = process.env.GITHUB_OWNER || '';
  const repo = process.env.GITHUB_REPO || '';
  return { owner, repo };
};

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
    const relativePath = relative(repoRoot, join(dirPath, item.name));

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
 * Allows Steward to 'orient' himself
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
        const { owner, repo } = getRepoInfo();
        if (owner && repo) {
          const githubPath = path === '.' || path === '/' ? '' : path;

          // Get repository contents
          const { data: contents } = await octokit.repos.getContent({
            owner,
            repo,
            path: githubPath,
          });

          // Build tree structure from GitHub response
          const buildGitHubTree = (items: any[], prefix: string = '', depth: number = 0): string[] => {
            if (depth > 10) return []; // Prevent infinite recursion

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
                // Directories first, then files
                if (a.type === 'dir' && b.type !== 'dir') return -1;
                if (a.type !== 'dir' && b.type === 'dir') return 1;
                return a.name.localeCompare(b.name);
              });

            filtered.forEach((item: any, index: number) => {
              const isLast = index === filtered.length - 1;
              const currentPrefix = isLast ? '└── ' : '├── ';
              lines.push(`${prefix}${currentPrefix}${item.name}${item.type === 'dir' ? '/' : ''}`);

              // Recursively get subdirectory contents
              if (item.type === 'dir') {
                const nextPrefix = prefix + (isLast ? '    ' : '│   ');
                // Note: This would require additional API calls for each directory
                // For now, we'll just show the directory structure one level deep
                // Full recursion would be expensive, so we limit depth
              }
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
      // Determine the true repository root
      const repoRoot = currentDir.includes('apps/web')
        ? join(currentDir, '../..')
        : currentDir;

      // Resolve the target directory relative to the repo root
      const targetDir = (path === '.' || path === '/')
        ? repoRoot
        : join(repoRoot, path);

      // Verify the path exists
      if (!statSync(targetDir).isDirectory()) {
        throw new Error(`Path does not exist or is not a directory: ${targetDir}`);
      }

      const treeLines = buildFileTree(targetDir, repoRoot);
      const treeString = treeLines.join('\n');

      if (typeof window === 'undefined') {
        console.log(`[get_repo_structure] Successfully built tree from filesystem: ${targetDir} (${treeLines.length} items)`);
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
        const { owner, repo } = getRepoInfo();
        if (owner && repo) {
          const { data: fileData } = await octokit.repos.getContent({
            owner,
            repo,
            path: path,
            ref: branch || 'main',
          });

          // GitHub API can return an array (for directories) or a single object (for files)
          // We need a file, so if it's an array, that's an error
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
      const repoRoot = currentDir.includes('apps/web')
        ? join(currentDir, '../..')
        : currentDir;

      // Resolve the file path
      const filePath = path.startsWith('/') || path.includes(':')
        ? path
        : join(repoRoot, path);

      // Security: ensure the path is within the repo root
      const resolvedPath = relative(repoRoot, filePath);
      if (resolvedPath.startsWith('..') || resolvedPath.includes('node_modules')) {
        throw new Error('Access denied: path is outside repository root or in node_modules');
      }

      if (typeof window === 'undefined') {
        console.log(`[read_file_content] Resolved path: ${filePath} (from repo root: ${repoRoot})`);
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

/**
 * Tool: create_issue
 * Takes a title and body, creates a GitHub Issue
 * For feature tracking
 */
export const create_issue = createUntypedTool({
  description: 'Creates a GitHub Issue with the provided title and body.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      title: { type: 'string', description: 'The title of the GitHub issue.' },
      body: { type: 'string', description: 'The body/description of the GitHub issue.' },
      owner: { type: 'string', description: 'GitHub repository owner. Leave empty to use GITHUB_OWNER env var.' },
      repo: { type: 'string', description: 'GitHub repository name. Leave empty to use GITHUB_REPO env var.' },
    },
    required: ['title', 'body'],
  }),
  execute: async ({ title, body, owner, repo }: { title: string; body: string; owner?: string; repo?: string }) => {
    try {
      const { owner: defaultOwner, repo: defaultRepo } = getRepoInfo();
      const finalOwner = owner || defaultOwner;
      const finalRepo = repo || defaultRepo;

      if (!finalOwner || !finalRepo) {
        throw new Error('GitHub owner and repo must be provided either as parameters or via GITHUB_OWNER and GITHUB_REPO environment variables');
      }

      if (!process.env.GITHUB_TOKEN) {
        throw new Error('GITHUB_TOKEN environment variable is required');
      }

      const { data } = await octokit.issues.create({
        owner: finalOwner,
        repo: finalRepo,
        title,
        body,
      });

      return {
        success: true,
        issue: {
          number: data.number,
          title: data.title,
          url: data.html_url,
          state: data.state,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

/**
 * Tool: create_pull_request
 * Creates a new branch, commits file changes, and opens a PR against main
 */
type FileChange = { path: string; content: string };
type CreatePullRequestArgs = {
  title: string;
  body: string;
  branch_name: string;
  file_changes: FileChange[];
  owner?: string;
  repo?: string;
  base_branch?: string;
};

export const create_pull_request = createUntypedTool({
  description: 'Creates a new branch, commits file changes, and opens a pull request.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      title: { type: 'string', description: 'The title of the pull request.' },
      body: { type: 'string', description: 'The body/description of the pull request.' },
      branch_name: { type: 'string', description: 'The name of the new branch to create.' },
      file_changes: {
        type: 'array',
        description: 'Array of file changes to commit.',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Relative path to the file from repository root.' },
            content: { type: 'string', description: 'The full content of the file to create or update.' },
          },
          required: ['path', 'content'],
        },
      },
      owner: { type: 'string', description: 'GitHub repository owner. Leave empty to use GITHUB_OWNER env var.' },
      repo: { type: 'string', description: 'GitHub repository name. Leave empty to use GITHUB_REPO env var.' },
      base_branch: { type: 'string', description: 'The base branch to create the PR against. Defaults to main.' },
    },
    required: ['title', 'body', 'branch_name', 'file_changes'],
  }),
  execute: async ({ title, body, branch_name, file_changes, owner, repo, base_branch: base_branch_arg }: CreatePullRequestArgs) => {
    const base_branch = base_branch_arg || 'main';
    try {
      const { owner: defaultOwner, repo: defaultRepo } = getRepoInfo();
      const finalOwner = owner || defaultOwner;
      const finalRepo = repo || defaultRepo;

      if (!finalOwner || !finalRepo) {
        throw new Error('GitHub owner and repo must be provided either as parameters or via GITHUB_OWNER and GITHUB_REPO environment variables');
      }

      if (!process.env.GITHUB_TOKEN) {
        throw new Error('GITHUB_TOKEN environment variable is required');
      }

      // Get the latest commit SHA from the base branch
      const { data: refData } = await octokit.git.getRef({
        owner: finalOwner,
        repo: finalRepo,
        ref: `heads/${base_branch}`,
      });
      const baseSha = refData.object.sha;

      // Get the tree SHA from the base commit
      const { data: commitData } = await octokit.git.getCommit({
        owner: finalOwner,
        repo: finalRepo,
        commit_sha: baseSha,
      });
      const baseTreeSha = commitData.tree.sha;

      // Create blobs for each file change
      const treeItems = await Promise.all(
        file_changes.map(async ({ path, content }: { path: string; content: string }) => {
          const { data: blobData } = await octokit.git.createBlob({
            owner: finalOwner,
            repo: finalRepo,
            content: Buffer.from(content).toString('base64'),
            encoding: 'base64',
          });

          return {
            path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blobData.sha,
          };
        })
      );

      // Create a new tree with the file changes
      const { data: treeData } = await octokit.git.createTree({
        owner: finalOwner,
        repo: finalRepo,
        base_tree: baseTreeSha,
        tree: treeItems,
      });

      // Create a new commit
      const { data: commitResult } = await octokit.git.createCommit({
        owner: finalOwner,
        repo: finalRepo,
        message: title,
        tree: treeData.sha,
        parents: [baseSha],
      });

      // Create the new branch
      await octokit.git.createRef({
        owner: finalOwner,
        repo: finalRepo,
        ref: `refs/heads/${branch_name}`,
        sha: commitResult.sha,
      });

      // Create the pull request
      const { data: prData } = await octokit.pulls.create({
        owner: finalOwner,
        repo: finalRepo,
        title,
        body,
        head: branch_name,
        base: base_branch,
      });

      return {
        success: true,
        pull_request: {
          number: prData.number,
          title: prData.title,
          url: prData.html_url,
          state: prData.state,
          branch: branch_name,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

/**
 * Tool: get_database_schema
 * Returns an overview of all tables in the database
 * Uses Supabase RPC function for introspection
 */
export const get_database_schema = createUntypedTool({
  description: 'Returns an overview of all database tables including columns, types, and row counts.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      schema_name: { type: 'string', description: 'The database schema to inspect. Defaults to "public".' },
    },
  }),
  execute: async ({ schema_name: schemaArg }: { schema_name?: string }) => {
    const schema_name = schemaArg || 'public';

    if (typeof window === 'undefined') {
      console.log(`[get_database_schema] Tool called with schema: ${schema_name}`);
    }

    try {
      // Dynamic import to avoid client-side issues
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_schema_overview', {
        schema_name: schema_name || 'public'
      });

      if (error) {
        console.error('[get_database_schema] RPC error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (typeof window === 'undefined') {
        console.log(`[get_database_schema] Successfully retrieved schema with ${data?.length || 0} tables`);
      }

      return {
        success: true,
        schema: schema_name,
        tables: data,
        table_count: data?.length || 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[get_database_schema] Error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Tool: get_table_details
 * Returns detailed info about a specific table
 */
export const get_table_details = createUntypedTool({
  description: 'Returns detailed info about a specific table including columns, indexes, and RLS policies.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      table_name: { type: 'string', description: 'The name of the table to get details for.' },
      schema_name: { type: 'string', description: 'The database schema. Defaults to "public".' },
    },
    required: ['table_name'],
  }),
  execute: async ({ table_name, schema_name: schemaArg }: { table_name: string; schema_name?: string }) => {
    const schema_name = schemaArg || 'public';

    if (typeof window === 'undefined') {
      console.log(`[get_table_details] Tool called for table: ${schema_name}.${table_name}`);
    }

    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_table_details', {
        p_table_name: table_name,
        schema_name: schema_name || 'public'
      });

      if (error) {
        console.error('[get_table_details] RPC error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        table: data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[get_table_details] Error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Export all tools as a single object for easy import
 */
export const stewardTools = {
  get_repo_structure,
  read_file_content,
  create_issue,
  create_pull_request,
  get_database_schema,
  get_table_details,
};

