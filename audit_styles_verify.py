import os
import re
import json

# Configuration
SEARCH_DIRS = [
    "my-turborepo/apps/web/src",
    "my-turborepo/apps/docs",
    "my-turborepo/packages/ui/src"
]
IGNORE_DIRS = ["node_modules", ".next", "dist", "build", ".git"]
EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".css"]

# Regex Patterns
PATTERNS = {
    "Arbitrary Value": r"(?<!\w)([\w-]*-\[[^\]]+\])",
    "Non-Semantic Color": r"\b(bg|text|border|ring|outline|fill|stroke)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d+",
    "Hardcoded Black/White": r"\b(bg|text|border|ring|outline|fill|stroke)-(black|white)\b",
    "Inline Hex/RGB": r"(#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|hsl\([^)]+\))",
    "Inline Style": r"style=\{\{([^}]+)\}\}",
}

findings = []

def scan_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for i, line in enumerate(lines):
            line_num = i + 1

            # Check for patterns
            for issue_type, pattern in PATTERNS.items():
                matches = re.findall(pattern, line)
                for match in matches:
                    # Filter out false positives if needed
                    match_str = match if isinstance(match, str) else match[0]

                    # Context extraction (trim whitespace)
                    context = line.strip()[:100] + "..." if len(line.strip()) > 100 else line.strip()

                    findings.append({
                        "file": filepath,
                        "line": line_num,
                        "type": issue_type,
                        "match": match_str,
                        "context": context
                    })

    except Exception as e:
        print(f"Error reading {filepath}: {e}")

def main():
    print("Starting Audit...")
    for root_dir in SEARCH_DIRS:
        if not os.path.exists(root_dir):
            print(f"Directory not found: {root_dir}")
            continue

        for root, dirs, files in os.walk(root_dir):
            # Modify dirs in-place to ignore specified directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                if any(file.endswith(ext) for ext in EXTENSIONS):
                    filepath = os.path.join(root, file)
                    scan_file(filepath)

    # Grouping results
    grouped = {}
    for finding in findings:
        ftype = finding['type']
        if ftype not in grouped:
            grouped[ftype] = []
        grouped[ftype].append(finding)

    print(f"Audit Complete. Found {len(findings)} issues.")
    for ftype, items in grouped.items():
        print(f"- {ftype}: {len(items)}")

if __name__ == "__main__":
    main()
