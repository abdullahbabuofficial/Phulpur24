#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Usage: scripts/copilot-agent.sh \"Task for Copilot CLI\""
  exit 1
fi

gh copilot -- \
  --add-dir "$(pwd)" \
  --allow-url github.com \
  --allow-tool='shell(git status:*)' \
  --allow-tool='shell(git diff:*)' \
  --allow-tool='shell(git log:*)' \
  --allow-tool='shell(rg:*)' \
  --allow-tool='shell(find:*)' \
  --allow-tool='shell(ls:*)' \
  --allow-tool='shell(sed:*)' \
  --allow-tool='shell(cat:*)' \
  --allow-tool='shell(npm run lint:*)' \
  --allow-tool='shell(npx tsc --noEmit:*)' \
  --allow-tool='shell(npm audit:*)' \
  --deny-tool='shell(git push:*)' \
  --deny-tool='shell(git reset:*)' \
  --deny-tool='shell(git checkout:*)' \
  --deny-tool='shell(rm:*)' \
  -p "$*"
