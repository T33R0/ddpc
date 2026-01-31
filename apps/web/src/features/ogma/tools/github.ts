import { tool, jsonSchema } from 'ai';
import { Octokit } from '@octokit/rest';

// Helper to create tools with type erasure for TypeScript
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
