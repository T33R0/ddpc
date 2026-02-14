import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

export interface StructureItem {
  id: string;
  name: string;
  type: 'page' | 'component';
  path: string;
  metadata: Record<string, unknown>;
  category?: string; // Optional derived category
}

/**
 * Scans the application structure (Pages and UI Components).
 * @param options.webRoot - Path to apps/web root. Defaults to process.cwd()
 * @param options.repoRoot - Path to repo root. Defaults to process.cwd()/../..
 */
export async function scanStructureData(options: { webRoot?: string; repoRoot?: string } = {}): Promise<StructureItem[]> {
  const WEB_ROOT = options.webRoot || process.cwd();
  // Attempt to deduce REPO_ROOT if not provided. Assuming standard turborepo layout: apps/web -> ../..
  const REPO_ROOT = options.repoRoot || path.resolve(WEB_ROOT, '../../');

  const APP_DIR = path.join(WEB_ROOT, 'src/app');
  const UI_DIR = path.join(REPO_ROOT, 'packages/ui/src');
  const UI_PACKAGE_JSON = path.join(REPO_ROOT, 'packages/ui/package.json');

  const items: StructureItem[] = [];

  // 1. Scan Pages
  if (fs.existsSync(APP_DIR)) {
    const pages = await glob('**/page.tsx', { cwd: APP_DIR });

    for (const pageFile of pages) {
      const routePath = '/' + path.dirname(pageFile)
        .replace(/\\/g, '/')
        .replace(/\(.*\)\//g, '') // remove route groups like (auth)
        .replace(/\/page$/, '');

      // Normalize path (handle root page)
      const normalizedPath = routePath === '/.' ? '/' : routePath;
      const name = normalizedPath === '/' ? 'Home' :
        normalizedPath.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Page';

      const id = generateUUID(normalizedPath + 'page');

      items.push({
        id,
        name,
        type: 'page',
        path: normalizedPath,
        metadata: {},
        category: 'App Route'
      });
    }
  } else {
    console.warn(`Warning: App directory not found at ${APP_DIR}`);
  }

  // 2. Scan Components
  if (fs.existsSync(UI_PACKAGE_JSON) && fs.existsSync(UI_DIR)) {
    try {
      const uiPkg = JSON.parse(fs.readFileSync(UI_PACKAGE_JSON, 'utf-8'));
      const exports = uiPkg.exports || {};
      const validExports = new Set(
        Object.keys(exports)
          .map(k => k.replace(/^\.\//, '')) // remove ./ prefix
          .filter(k => k !== '*') // ignore wildcard
      );

      const components = await glob('**/*.tsx', { cwd: UI_DIR });

      for (const compFile of components) {
        // Skip internal files
        if (compFile.includes('index.ts') || compFile.includes('.stories.') || compFile.includes('.test.')) continue;

        const name = path.basename(compFile, '.tsx');

        // Check if exported
        if (!validExports.has(name)) {
          continue;
        }

        const importPath = `@repo/ui/${name}`;
        const id = generateUUID(name + 'component');

        items.push({
          id,
          name,
          type: 'component',
          path: importPath,
          metadata: { defaultProps: {} },
          category: 'UI Primitive'
        });
      }
    } catch (error) {
       console.error('Error scanning UI components:', error);
    }
  } else {
    console.warn(`Warning: UI package or directory not found at ${UI_DIR}`);
  }

  return items;
}

// Simple UUID generator for consistent IDs based on string (mock implementation)
// Must match the one in the original script to ensure IDs are stable
function generateUUID(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `00000000-0000-0000-0000-${hex.padEnd(12, '0')}`;
}

// Helper to PascalCase (if needed by consumers, though this function returns data not code)
export function toPascalCase(str: string): string {
  return str.replace(/(^\w|-\w)/g, (g) => g.replace('-', '').toUpperCase());
}
