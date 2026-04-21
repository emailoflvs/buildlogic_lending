#!/usr/bin/env bash
# Deploy dev 'main' to the production repo, stripping paths listed in
# EXCLUDE_PATHS (internal docs, plans, etc.) so they never reach prod.
#
# Usage: ./scripts/deploy-to-prod.sh
#
# Flow:
#   1. verify local main == origin/main (dev is source of truth)
#   2. clone prod repo into temp dir
#   3. fetch dev main into the temp clone
#   4. merge dev/main into prod/main (prefers dev on conflict)
#   5. git rm -r each EXCLUDE_PATHS entry that is tracked
#   6. commit + push prod/main
#
# Re-runnable. If nothing changed — exits clean.

set -euo pipefail

DEV_REMOTE="origin"
PROD_URL="git@github.com:emailoflvs/buildlogic_lending.git"
EXCLUDE_PATHS=("docs")

cd "$(git rev-parse --show-toplevel)"

# 1. sanity: local main must match dev remote main
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

# 2. temp clone of prod
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "→ cloning prod into $TMP"
git clone --quiet "$PROD_URL" "$TMP/prod"
cd "$TMP/prod"
git config user.email "$GIT_EMAIL"
git config user.name "$GIT_NAME"

# 3. fetch dev main
git remote add dev "$DEV_URL"
git fetch --quiet dev main

# 4. merge dev/main (prefer dev version on conflict; expected to be fast-forward
#    or already-up-to-date after the first deploy)
BEFORE_MERGE=$(git rev-parse HEAD)
git merge dev/main -X theirs --no-edit >/dev/null
AFTER_MERGE=$(git rev-parse HEAD)

# 5. strip excluded paths
STRIPPED=0
for p in "${EXCLUDE_PATHS[@]}"; do
  if git ls-files --error-unmatch "$p" >/dev/null 2>&1; then
    echo "→ removing $p/ from prod tree"
    git rm -rf --quiet "$p"
    STRIPPED=$((STRIPPED + 1))
  fi
done

if (( STRIPPED > 0 )); then
  git commit --quiet -m "deploy: strip internal paths (${EXCLUDE_PATHS[*]}) from prod"
fi

# 6. push if anything changed
if [[ "$(git rev-parse HEAD)" == "$BEFORE_MERGE" ]]; then
  echo "✓ prod already up to date (${BEFORE_MERGE:0:7})"
else
  echo "→ pushing prod main"
  git push --quiet origin main
  echo "✓ deployed dev ${LOCAL:0:7} → prod $(git rev-parse --short HEAD)"
fi
