---
name: ui-compliance-officer
description: Run this skill to audit components for specific "Component Bible" violations like magic numbers, hex codes, or bad imports.
---

# UI Compliance Officer

## Mission
Locate and report specific violations of the UI Doctrine using strict pattern matching.

## Tactics (The Script)
Run the following shell commands to identify targets.

### 1. Hunt for Magic Numbers (Arbitrary Values)
Objective: Find `w-[35px]`, `p-[10px]`, etc.
grep -r "-\[" apps/web/src/components

### 2. Hunt for Hardcoded Hex Colors
Objective: Find #000, #ffffff, etc. (excluding tailwind.config.ts)
grep -r "#[0-9a-fA-F]\{3,6\}" apps/web/src/components --exclude=".css" --exclude=".json"

### 3. Hunt for Illegal Imports
Objective: Find imports that bypass @repo/ui.
grep -r "from ['\"]\.\./ui/" apps/web/src/components
grep -r "from ['\"]\.\./\.\./ui/" apps/web/src/components

### 4. Hunt for Inline Styles
Objective: Find style={{ usage.
grep -r "style={{" apps/web/src/components