import { z } from 'zod';
import { tool } from 'ai';
import { Octokit } from '@octokit/rest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

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
 * Returns a tree view of the file system (ignoring node_modules)
 * Allows Ogma to 'orient' himself
 */
const getRepoStructureSchema = z.object({
  // Optional: if not provided, uses local filesystem
  path: z.string().optional().describe('Optional subdirectory path to scan. If not provided, scans from repository root.'),
});

export const get_repo_structure = tool({
  description: 'Returns a tree view of the file system (ignoring node_modules, .git, dist, build, .next, .turbo). Allows Ogma to orient himself in the repository structure.',
  parameters: getRepoStructureSchema,
  // @ts-ignore - Vercel AI SDK tool types are incorrect, execute is valid at runtime
  execute: async (args: any) => {
    const { path } = args as z.infer<typeof getRepoStructureSchema>;
    
    // Server-side debug logging
    if (typeof window === 'undefined') {
      console.log(`[get_repo_structure] Tool called with path: ${path || 'root'}`);
    }
    
    try {
      // Determine repository root (assuming we're in apps/web)
      const currentDir = process.cwd();
      const repoRoot = path 
        ? join(currentDir, path)
        : currentDir.includes('apps/web') 
          ? join(currentDir, '../..')
          : currentDir;

      // Verify the path exists
      if (!statSync(repoRoot).isDirectory()) {
        throw new Error(`Path does not exist or is not a directory: ${repoRoot}`);
      }

      const treeLines = buildFileTree(repoRoot, repoRoot);
      const treeString = treeLines.join('\n');
      
      if (typeof window === 'undefined') {
        console.log(`[get_repo_structure] Successfully built tree from: ${repoRoot} (${treeLines.length} items)`);
      }
      
      return {
        success: true,
        tree: treeString,
        root: repoRoot,
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
 * Allows Ogma to 'read' code
 */
const readFileContentSchema = z.object({
  path: z.string().describe('Relative path to the file from repository root, or absolute path.'),
});

export const read_file_content = tool({
  description: 'Takes a file path and returns the raw text content. Allows Ogma to read code files from the repository.',
  parameters: readFileContentSchema,
  // @ts-ignore - Vercel AI SDK tool types are incorrect, execute is valid at runtime
  execute: async (args: any) => {
    const { path } = args as z.infer<typeof readFileContentSchema>;
    
    // Server-side debug logging
    if (typeof window === 'undefined') {
      console.log(`[read_file_content] Tool called with path: ${path}`);
    }
    
    try {
      // Determine repository root
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
        console.log(`[read_file_content] Successfully read file: ${filePath} (${content.length} bytes)`);
      }
      
      return {
        success: true,
        path: filePath,
        content,
        size: content.length,
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
const createIssueSchema = z.object({
  title: z.string().describe('The title of the GitHub issue.'),
  body: z.string().describe('The body/description of the GitHub issue.'),
  owner: z.string().optional().describe('GitHub repository owner. If not provided, uses GITHUB_OWNER env var.'),
  repo: z.string().optional().describe('GitHub repository name. If not provided, uses GITHUB_REPO env var.'),
});

export const create_issue = tool({
  description: 'Creates a GitHub Issue with the provided title and body. Useful for feature tracking and task management.',
  parameters: createIssueSchema,
  // @ts-ignore - Vercel AI SDK tool types are incorrect, execute is valid at runtime
  execute: async (args: any) => {
    const { title, body, owner, repo } = args as z.infer<typeof createIssueSchema>;
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
const createPullRequestSchema = z.object({
  title: z.string().describe('The title of the pull request.'),
  body: z.string().describe('The body/description of the pull request.'),
  branch_name: z.string().describe('The name of the new branch to create.'),
  file_changes: z.array(z.object({
    path: z.string().describe('Relative path to the file from repository root.'),
    content: z.string().describe('The full content of the file to create or update.'),
  })).describe('Array of file changes to commit. Each change includes a path and content.'),
  owner: z.string().optional().describe('GitHub repository owner. If not provided, uses GITHUB_OWNER env var.'),
  repo: z.string().optional().describe('GitHub repository name. If not provided, uses GITHUB_REPO env var.'),
  base_branch: z.string().default('main').describe('The base branch to create the PR against. Defaults to "main".'),
});

export const create_pull_request = tool({
  description: 'Creates a new branch, commits the provided file changes, and opens a pull request against the main branch.',
  parameters: createPullRequestSchema,
  // @ts-ignore - Vercel AI SDK tool types are incorrect, execute is valid at runtime
  execute: async (args: any) => {
    const { title, body, branch_name, file_changes, owner, repo, base_branch } = args as z.infer<typeof createPullRequestSchema>;
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
 * Export all tools as a single object for easy import
 */
export const ogmaTools = {
  get_repo_structure,
  read_file_content,
  create_issue,
  create_pull_request,
};

