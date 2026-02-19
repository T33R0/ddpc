#!/bin/bash
set -e

# Rename script: Ogma -> Steward
# Processes all .ts, .tsx files in the affected directories

SED_ARGS=(
  -e 's/OgmaChatWindow/StewardChatWindow/g'
  -e 's/OgmaImprovement/StewardImprovement/g'
  -e 's/OgmaConfig/StewardConfig/g'
  -e 's/OgmaResponse/StewardResponse/g'
  -e 's/OgmaAlert/StewardAlert/g'
  -e 's/OgmaSensors/StewardSensors/g'
  -e 's/OgmaAdminPage/StewardAdminPage/g'
  -e 's/OgmaDashboardPage/StewardDashboardPage/g'
  -e 's/runOgma/runSteward/g'
  -e 's/ogmaTools/stewardTools/g'
  -e 's/ogmaSensors/stewardSensors/g'
  -e 's/ogma-gateway/steward-gateway/g'
  -e 's|features/ogma|features/steward|g'
  -e 's|/admin/ogma|/admin/steward|g'
  -e 's|/api/ogma|/api/steward|g'
  -e 's|lib/ogma|lib/steward|g'
  -e 's/ogma_chat_sessions/steward_chat_sessions/g'
  -e 's/ogma_chat_messages/steward_chat_messages/g'
  -e 's/ogma_improvements/steward_improvements/g'
  -e 's/OGMA_VERIFIED_EMAILS/STEWARD_VERIFIED_EMAILS/g'
  -e 's/OGMA_VERIFIED_IDS/STEWARD_VERIFIED_IDS/g'
  -e 's/OGMA_CRON_RECIPIENTS/STEWARD_CRON_RECIPIENTS/g'
  -e 's/testOgmaStream/testStewardStream/g'
  -e 's/testOgmaGateway/testStewardGateway/g'
  -e 's/Ogma/Steward/g'
  -e 's/ogma/steward/g'
  -e 's/OGMA/STEWARD/g'
)

# Process TS/TSX files
echo "Processing .ts and .tsx files..."
for f in $(find \
  apps/web/src/features/steward \
  apps/web/src/app/api/steward \
  apps/web/src/app/admin/steward \
  apps/web/src/scripts \
  apps/web/scripts \
  -type f \( -name '*.ts' -o -name '*.tsx' \)); do
  echo "  $f"
  sed -i '' "${SED_ARGS[@]}" "$f"
done

# Process individual files outside the renamed directories
echo "Processing individual files..."
for f in \
  apps/web/src/app/admin/layout.tsx \
  apps/web/src/app/admin/page.tsx \
  apps/web/src/lib/ai-gateway.ts; do
  echo "  $f"
  sed -i '' "${SED_ARGS[@]}" "$f"
done

# Process documentation / config files (.md, .yaml, .json, .sql)
echo "Processing docs, config, and SQL..."
for f in $(find \
  apps/docs/content/steward \
  apps/docs/content/engineering \
  -type f \( -name '*.md' -o -name '*.yaml' \)); do
  echo "  $f"
  sed -i '' "${SED_ARGS[@]}" "$f"
done

# Root config / doc files
for f in \
  CLAUDE.md \
  REPO_ANALYSIS.md \
  NEXT_CHAT_PROMPT.md \
  turbo.json \
  steward_schema.sql; do
  if [ -f "$f" ]; then
    echo "  $f"
    sed -i '' "${SED_ARGS[@]}" "$f"
  fi
done

echo "Done! All ogma references replaced with steward."
