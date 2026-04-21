#!/usr/bin/env bash
# Deploy dev 'main' to prod: sync the public prod repo (stripping internal
# paths), then trigger the production server to git-pull + rebuild.
#
# Usage: ./scripts/deploy-to-prod.sh
#
# Flow:
#   A. sync dev -> prod GitHub repo
#      1. verify local main == origin/main (dev is source of truth)
#      2. clone prod repo into temp dir
#      3. fetch dev main into the temp clone
#      4. reset prod main to dev main (linear — no merge commits)
#      5. git rm -r each EXCLUDE_PATHS entry that is tracked
#      6. force-push prod/main (prod is always "dev main + one strip commit")
#   B. trigger server: git pull + docker compose up -d --build
#
# Server pulls from DEV repo directly (via deploy key at github-buildlogic).
# Prod repo is a public "clean" mirror, not the server's deploy source.
#
# Re-runnable. Idempotent.

set -euo pipefail

DEV_REMOTE="origin"
PROD_URL="git@github.com:emailoflvs/buildlogic_lending.git"
EXCLUDE_PATHS=("docs")

SERVER_HOST="max@57.129.62.58"
SERVER_PATH="/opt/docker-projects/buildlogic_www"

cd "$(git rev-parse --show-toplevel)"

# === A. sync dev -> prod repo ===

git fetch --quiet "$DEV_REMOTE" main
LOCAL=$(git rev-parse main)
DEV_HEAD=$(git rev-parse "$DEV_REMOTE/main")
if [[ "$LOCAL" != "$DEV_HEAD" ]]; then
  echo "error: local main ($LOCAL) differs from $DEV_REMOTE/main ($DEV_HEAD)"
  echo "       push to dev first:  git push $DEV_REMOTE main"
  exit 1
fi

GIT_EMAIL=$(git config user.email 2>/dev/null || echo "deploy@buildlogic.eu")
GIT_NAME=$(git config user.name 2>/dev/null || echo "Deploy Bot")
DEV_URL=$(git remote get-url "$DEV_REMOTE")

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "→ cloning prod into $TMP"
git clone --quiet "$PROD_URL" "$TMP/prod"
cd "$TMP/prod"
git config user.email "$GIT_EMAIL"
git config user.name "$GIT_NAME"

git remote add dev "$DEV_URL"
git fetch --quiet dev main

# idempotency check: prod is "up to date" if its HEAD's parent equals current
# dev/main tip AND no EXCLUDE_PATHS are tracked in prod. Skip push in that case.
PROD_HEAD=$(git rev-parse HEAD)
PROD_PARENT=$(git rev-parse HEAD^ 2>/dev/null || echo none)
DEV_TIP=$(git rev-parse dev/main)

NEEDS_PUSH=true
if [[ "$PROD_PARENT" == "$DEV_TIP" ]]; then
  TRACKED_EXCLUDES=0
  for p in "${EXCLUDE_PATHS[@]}"; do
    if git ls-files --error-unmatch "$p" >/dev/null 2>&1; then
      TRACKED_EXCLUDES=$((TRACKED_EXCLUDES + 1))
    fi
  done
  if (( TRACKED_EXCLUDES == 0 )); then
    NEEDS_PUSH=false
  fi
fi

if ! $NEEDS_PUSH; then
  echo "✓ prod repo already up to date (${PROD_HEAD:0:7})"
else
  # rebuild prod main: reset to dev tip, strip excluded paths, one commit on top
  git reset --hard --quiet dev/main
  for p in "${EXCLUDE_PATHS[@]}"; do
    if git ls-files --error-unmatch "$p" >/dev/null 2>&1; then
      echo "→ removing $p/ from prod tree"
      git rm -rf --quiet "$p"
    fi
  done
  if ! git diff --cached --quiet; then
    git commit --quiet -m "deploy: strip internal paths (${EXCLUDE_PATHS[*]}) from prod"
  fi
  echo "→ pushing prod main (force — linear rebuild on top of dev)"
  git push --force-with-lease --quiet origin main
  echo "✓ prod repo: dev ${LOCAL:0:7} → prod $(git rev-parse --short HEAD)"
fi

# === B. trigger server deploy ===

echo
echo "→ server: git pull + docker compose up -d --build"
ssh -o BatchMode=yes "$SERVER_HOST" "set -e
  cd $SERVER_PATH
  git fetch --quiet origin
  BEFORE=\$(git rev-parse HEAD)
  git reset --quiet --hard origin/main
  AFTER=\$(git rev-parse HEAD)
  if [[ \"\$BEFORE\" == \"\$AFTER\" ]]; then
    echo '  server git already at '\"\${AFTER:0:7}\"' — rebuilding anyway to pick up any override/config changes'
  else
    echo '  server git: '\"\${BEFORE:0:7}\"' → '\"\${AFTER:0:7}\"
  fi
  docker compose up -d --build 2>&1 | grep -E 'Built|Creating|Recreating|Started|Error' | sed 's/^/  /'
  docker ps --filter name=buildlogic-landing --format 'table {{.Names}}\t{{.Status}}' | sed 's/^/  /'
"

echo
echo "→ verify https://buildlogic.eu/"
curl -sfI https://buildlogic.eu/ | head -1 | sed 's/^/  /' || echo "  WARN: curl failed"
