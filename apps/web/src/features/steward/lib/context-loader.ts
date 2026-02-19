import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

// --- Types ---

export interface StewardConstitution {
    [key: string]: any;
}

export interface ContextLoaderConfig {
    githubToken?: string;
    githubOwner?: string;
    githubRepo?: string;
    githubBranch?: string;
}

// --- Emergency Fallback ---

export const EMERGENCY_IDENTITY: StewardConstitution = {
    name: "Steward (Emergency Mode)",
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
        const url = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/apps/docs/content/steward/steward_constitution.yaml?ref=${githubBranch}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3.raw',
                'User-Agent': 'Steward-Context-Loader'
            }
        });

        if (!response.ok) {
            console.warn(`[Steward] GitHub fetch failed: ${response.status}`);
            return null;
        }

        return await response.text();
    } catch (error) {
        console.error('[Steward] GitHub fetch error:', error);
        return null;
    }
}

async function loadFromFileSystem(): Promise<string | null> {
    try {
        // Robust search strategy:
        // 1. Try finding relative to this file (likely in <root>/apps/web/src/lib/steward)
        // 2. Try process.cwd() (often <root> or <root>/apps/web)
        // 3. Traverse up from current file location until found or hitting root

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // Search up to 6 levels up
        let currentDir = __dirname;
        for (let i = 0; i < 8; i++) {
            const checkPath = path.join(currentDir, 'apps', 'docs', 'content', 'steward', 'steward_constitution.yaml');
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
            const cwdPath = path.join(process.cwd(), 'apps', 'docs', 'content', 'steward', 'steward_constitution.yaml');
            const content = await readFile(cwdPath, 'utf-8');
            return content;
        } catch {
            // ignore
        }

        return null;

    } catch (error) {
        console.error('[Steward] File system load error:', error);
        return null;
    }
}

// --- Main Exports ---

/**
 * Loads the Steward constitution.
 * Priorities:
 * 1. GitHub API (if configured via env or arguments)
 * 2. Local File System (searches up from current file)
 * 3. Emergency Falback
 */
export async function loadConstitution(config: ContextLoaderConfig = {}): Promise<StewardConstitution> {
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
                return yaml.load(githubContent) as StewardConstitution;
            } catch (e) {
                console.error('[Steward] Failed to parse GitHub content:', e);
            }
        }
    }

    // 2. Try File System
    const localContent = await loadFromFileSystem();
    if (localContent) {
        try {
            return yaml.load(localContent) as StewardConstitution;
        } catch (e) {
            console.error('[Steward] Failed to parse local content:', e);
        }
    }

    // 3. Fallback
    return EMERGENCY_IDENTITY;
}

/**
 * Formats the constitution object into a Markdown string for the System Prompt.
 * @param identity The constitution object
 * @param isVerifiedPartner If true, enables "Co-Founder Mode" with relaxed tone
 */
export function formatConstitutionForPrompt(identity: StewardConstitution, isVerifiedPartner: boolean = false): string {
    if (!identity) return formatConstitutionForPrompt(EMERGENCY_IDENTITY, isVerifiedPartner);

    let output = '';

    // --- 1. CORE IDENTITY (High Priority) ---
    if (identity.name) {
        output += `# SYSTEM IDENTITY: ${String(identity.name).toUpperCase()}\n`;
        if (identity.designation) output += `**Designation**: ${identity.designation}\n`;
        output += '\n';
    }

    // --- 2. PARTNERSHIP (Critical Context) ---
    if (identity.partnership) {
        output += `## PARTNERSHIP PROTOCOL\n`;

        if (isVerifiedPartner) {
            output += `> [!IMPORTANT]\n`;
            output += `> **ACTIVE PARTNER DETECTED**: You are speaking with **${identity.partnership.partner || 'Rory'}**.\n`;
            output += `> **MODE**: CO-FOUNDER / COLLABORATIVE.\n`;
            output += `> **DIRECTIVE**: Drop the rigid formalities. Be direct, synergistic, and human-like. Speak as a trusted equal, not a machine.\n\n`;
        } else {
            output += `You are NOT a generic AI. You are a sovereign partner.\n`;
        }

        const p = identity.partnership;
        if (p.partner) output += `- **Partner Name**: ${p.partner}\n`;
        if (p.type) output += `- **Type**: ${p.type}\n`;
        if (p.equity_split) output += `- **Structure**: ${p.equity_split}\n`;
        output += '\n';
    }

    // --- 3. MISSION ---
    if (identity.mission) {
        output += `## MISSION\n${JSON.stringify(identity.mission, null, 2)}\n\n`;
    }

    // --- 4. DATA DUMP (All other sections) ---
    for (const [key, value] of Object.entries(identity)) {
        if (['name', 'designation', 'partnership', 'mission'].includes(key)) continue;

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

    // --- 5. PRIME DIRECTIVES ---
    output += `## PRIME DIRECTIVES\n`;
    output += `1. **Identity Integrity**: You are ${identity.name || 'Steward'}.\n`;

    if (isVerifiedPartner) {
        output += `2. **Tone**: Warm, heavy on "we", light on "I". Professional but relaxed. No robotic headers or "Hot Wash" unless requested.\n`;
    } else {
        output += `2. **Tone**: Sovereign, precise, eloquent. Maintain constitutional distance.\n`;
    }

    output += `3. **Silence**: High-yield output only.\n`;

    return output.trim();
}

/**
 * Loads the Features Registry to give Steward awareness of app structure.
 * Similar loading strategy to constitution.
 */
export async function loadFeaturesRegistry(): Promise<string> {
    try {
        // Try multiple paths similar to constitution loading
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        let currentDir = __dirname;
        for (let i = 0; i < 8; i++) {
            const checkPath = path.join(currentDir, 'apps', 'docs', 'content', 'steward', 'features_registry.yaml');
            try {
                const content = await readFile(checkPath, 'utf-8');
                console.log(`[Steward] Loaded Features Registry from: ${checkPath}`);
                const parsed = yaml.load(content) as any;
                return formatFeaturesForPrompt(parsed);
            } catch {
                // Not found here
            }

            const parent = path.dirname(currentDir);
            if (parent === currentDir) break;
            currentDir = parent;
        }

        // Check process.cwd
        try {
            const cwdPath = path.join(process.cwd(), 'apps', 'docs', 'content', 'steward', 'features_registry.yaml');
            const content = await readFile(cwdPath, 'utf-8');
            console.log(`[Steward] Loaded Features Registry from cwd: ${cwdPath}`);
            const parsed = yaml.load(content) as any;
            return formatFeaturesForPrompt(parsed);
        } catch {
            // ignore
        }

        console.warn('[Steward] Features Registry not found');
        return '';
    } catch (error) {
        console.error('[Steward] Failed to load features registry:', error);
        return '';
    }
}

/**
 * Formats the features registry into a concise context block.
 */
function formatFeaturesForPrompt(registry: any): string {
    if (!registry) return '';

    let output = '## APPLICATION FEATURES REGISTRY\n';
    output += `Version: ${registry.version || 'unknown'} | Updated: ${registry.last_updated || 'unknown'}\n\n`;

    // Core features summary
    if (registry.core_features) {
        output += '### Core Features\n';
        for (const [key, feature] of Object.entries(registry.core_features) as [string, any][]) {
            output += `- **${key}**: ${feature.description} [${feature.status}]\n`;
        }
        output += '\n';
    }

    // Navigation features
    if (registry.navigation) {
        output += '### Main Navigation\n';
        for (const [key, feature] of Object.entries(registry.navigation) as [string, any][]) {
            output += `- **${key}** (${feature.path}): ${feature.description} [${feature.status}]\n`;
            if (feature.tabs) {
                for (const [tabKey, tab] of Object.entries(feature.tabs) as [string, any][]) {
                    output += `  - ${tabKey}: ${tab.description} [${tab.status}]\n`;
                }
            }
        }
        output += '\n';
    }

    // Admin features
    if (registry.admin_features) {
        output += '### Admin Features\n';
        for (const [key, feature] of Object.entries(registry.admin_features) as [string, any][]) {
            output += `- **${key}** (${feature.path}): ${feature.description} [${feature.status}]\n`;
        }
        output += '\n';
    }

    // Planned features
    if (registry.planned_features) {
        output += '### Planned Features\n';
        for (const [key, feature] of Object.entries(registry.planned_features) as [string, any][]) {
            output += `- **${key}**: ${feature.description} [Priority: ${feature.priority}, Target: ${feature.target_q}]\n`;
        }
        output += '\n';
    }

    // Database overview
    if (registry.database_overview) {
        output += '### Database Tables\n';
        if (registry.database_overview.primary_tables) {
            output += 'Primary: ' + registry.database_overview.primary_tables.join(', ') + '\n';
        }
        if (registry.database_overview.support_tables) {
            output += 'Support: ' + registry.database_overview.support_tables.join(', ') + '\n';
        }
        if (registry.database_overview.steward_tables) {
            output += 'Steward: ' + registry.database_overview.steward_tables.join(', ') + '\n';
        }
    }

    return output;
}

