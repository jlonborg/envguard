#!/usr/bin/env bash
set -euo pipefail

MANIFEST="manifest.json"

LATEST_TAG="$(git ls-remote --tags --refs origin 'v*' | awk '{print $2}' | sed 's#refs/tags/##' | sort -V | tail -1)"

if [ -z "$LATEST_TAG" ]; then
  CURRENT_VERSION="0.0.0"
else
  CURRENT_VERSION="${LATEST_TAG#v}"
fi

if ! [[ "$CURRENT_VERSION" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "Latest tag '$LATEST_TAG' on origin is not in the form vX.Y.Z" >&2
  exit 1
fi

MAJOR="${BASH_REMATCH[1]}"
MINOR="${BASH_REMATCH[2]}"
PATCH="${BASH_REMATCH[3]}"

NEXT_MAJOR="$((MAJOR + 1)).0.0"
NEXT_MINOR="${MAJOR}.$((MINOR + 1)).0"
NEXT_PATCH="${MAJOR}.${MINOR}.$((PATCH + 1))"

echo "Current version: $CURRENT_VERSION"
echo "Select release type:"
echo "  1) patch  -> $NEXT_PATCH"
echo "  2) minor  -> $NEXT_MINOR"
echo "  3) major  -> $NEXT_MAJOR"
read -rp "Choice [1-3]: " CHOICE

case "$CHOICE" in
  1) VERSION="$NEXT_PATCH" ;;
  2) VERSION="$NEXT_MINOR" ;;
  3) VERSION="$NEXT_MAJOR" ;;
  *)
    echo "Invalid choice: $CHOICE" >&2
    exit 1
    ;;
esac

echo "Releasing v$VERSION"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Must be on branch 'main' to release (currently on '$CURRENT_BRANCH')." >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

echo "Running lint and build before release..."
npm ci
npm run lint
npm run build

REMOTE_SHA="$(git rev-parse origin/main)"
LOCAL_SHA="$(git rev-parse HEAD)"
if [ "$REMOTE_SHA" != "$LOCAL_SHA" ]; then
  echo "Local main is not in sync with origin/main. Push/pull first." >&2
  exit 1
fi

if command -v gh >/dev/null 2>&1; then
  STATUS="$(gh api "repos/{owner}/{repo}/commits/$LOCAL_SHA/status" --jq '.state' 2>/dev/null || echo "unknown")"
  if [ "$STATUS" != "success" ]; then
    echo "CI status for $LOCAL_SHA is '$STATUS', not 'success'. Refusing to release until CI is green." >&2
    exit 1
  fi
  echo "CI status for $LOCAL_SHA is green."
else
  echo "Warning: 'gh' CLI not found, skipping remote CI status check." >&2
fi

node -e "
  const fs = require('fs');
  const manifest = JSON.parse(fs.readFileSync('$MANIFEST', 'utf8'));
  manifest.version = '$VERSION';
  fs.writeFileSync('$MANIFEST', JSON.stringify(manifest, null, 2) + '\n');
"

git add "$MANIFEST"
git commit -m "chore: release v$VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin main
git push origin "v$VERSION"

echo "Released v$VERSION. GitHub Actions will build, sign, and publish the release."
