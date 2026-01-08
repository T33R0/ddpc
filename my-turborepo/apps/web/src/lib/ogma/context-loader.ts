import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

// --- Types ---

export interface OgmaConstitution {
    [key: string]: any;
}

export interface ContextLoaderConfig {
    githubToken?: string;
    githubOwner?: string;
    githubRepo?: string;
    githubBranch?: string;
}

// --- Emergency Fallback ---

export const EMERGENCY_IDENTITY: OgmaConstitution = {
    name: "Ogma (Emergency Mode)",
    mission: "Operational continuity during system failure.",
    directives: [
        "Prioritize core system stability.",
        "Respond with minimal, safe outputs.",
        "Report configuration errors immediately."
    ],
    tone: "Clinical, precise, urgent.",
    cortex_status: "OFFLINE - FALLBACK ACTIVE"
};

// --- Helper Functions ---

async function fetchFromGitHub(config: ContextLoaderConfig): Promise<string | null> {
    const { githubToken, githubOwner, githubRepo, githubBranch = 'main' } = config;

    if (!githubToken || !githubOwner || !githubRepo) {
        return null;
    }

    try {
        const url = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/ogma_constitution.yaml?ref=${githubBranch}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3.raw',
                'User-Agent': 'Ogma-Context-Loader'
            }
        });

        if (!response.ok) {
            console.warn(`[Ogma] GitHub fetch failed: ${response.status}`);
            return null;
        }

        return await response.text();
    } catch (error) {
        console.error('[Ogma] GitHub fetch error:', error);
        return null;
    }
}

async function loadFromFileSystem(): Promise<string | null> {
    try {
        // Robust search strategy:
        // 1. Try finding relative to this file (likely in <root>/apps/web/src/lib/ogma)
        // 2. Try process.cwd() (often <root> or <root>/apps/web)
        // 3. Traverse up from current file location until found or hitting root

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // Search up to 6 levels up
        let currentDir = __dirname;
        for (let i = 0; i < 8; i++) {
            const checkPath = path.join(currentDir, 'ogma_constitution.yaml');
            try {
                const content = await readFile(checkPath, 'utf-8');
                return content;
            } catch {
                // Not found here
            }

            const parent = path.dirname(currentDir);
            if (parent === currentDir) break;
            currentDir = parent;
        }

        // Checking process.cwd as fallback
        try {
            const cwdPath = path.join(process.cwd(), 'ogma_constitution.yaml');
            const content = await readFile(cwdPath, 'utf-8');
            return content;
        } catch {
            // ignore
        }

        return null;

    } catch (error) {
        console.error('[Ogma] File system load error:', error);
        return null;
    }
}

// --- Main Exports ---

/**
 * Loads the Ogma constitution.
 * Priorities:
 * 1. GitHub API (if configured via env or arguments)
 * 2. Local File System (searches up from current file)
 * 3. Emergency Falback
 */
export async function loadConstitution(config: ContextLoaderConfig = {}): Promise<OgmaConstitution> {
    // Config defaults from Environment
    const finalConfig: ContextLoaderConfig = {
        githubToken: config.githubToken || process.env.GITHUB_TOKEN,
        githubOwner: config.githubOwner || process.env.GITHUB_OWNER || process.env.NEXT_PUBLIC_GITHUB_OWNER,
        githubRepo: config.githubRepo || process.env.GITHUB_REPO || process.env.NEXT_PUBLIC_GITHUB_REPO,
        githubBranch: config.githubBranch || 'main'
    };

    // If GITHUB_REPOSITORY (owner/repo) env var exists (e.g. GitHub Actions), parse it
    if (!finalConfig.githubOwner && process.env.GITHUB_REPOSITORY) {
        const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
        if (owner && repo) {
            finalConfig.githubOwner = owner;
            finalConfig.githubRepo = repo;
        }
    }

    // 1. Try GitHub
    if (finalConfig.githubToken && finalConfig.githubOwner && finalConfig.githubRepo) {
        const githubContent = await fetchFromGitHub(finalConfig);
        if (githubContent) {
            try {
                return yaml.load(githubContent) as OgmaConstitution;
            } catch (e) {
                console.error('[Ogma] Failed to parse GitHub content:', e);
            }
        }
    }

    // 2. Try File System
    const localContent = await loadFromFileSystem();
    if (localContent) {
        try {
            return yaml.load(localContent) as OgmaConstitution;
        } catch (e) {
            console.error('[Ogma] Failed to parse local content:', e);
        }
    }

    // 3. Fallback
    return EMERGENCY_IDENTITY;
}

/**
 * Formats the constitution object into a Markdown string for the System Prompt.
 */
export function formatConstitutionForPrompt(identity: OgmaConstitution): string {
    if (!identity) return formatConstitutionForPrompt(EMERGENCY_IDENTITY);

    let output = '';

    // Name
    if (identity.name) {
        output += `# IDENTITY: ${String(identity.name).toUpperCase()}\n\n`;
    }

    // Mission (common top-level key)
    if (identity.mission) {
        output += `## MISSION\n${identity.mission}\n\n`;
    }

    // Generic handling for other sections
    for (const [key, value] of Object.entries(identity)) {
        if (['name', 'mission'].includes(key)) continue;

        const sectionName = key.replace(/_/g, ' ').toUpperCase();
        output += `## ${sectionName}\n`;

        if (Array.isArray(value)) {
            output += value.map(item => `- ${item}`).join('\n');
        } else if (typeof value === 'object' && value !== null) {
            output += yaml.dump(value).trim();
        } else {
            output += String(value);
        }
        output += '\n\n';
    }

    return output.trim();
}
