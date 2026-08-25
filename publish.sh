#!/bin/bash
# Publish your edits to the live site.
#   ./publish.sh                      -> commits everything with a dated message
#   ./publish.sh "reworded the hero"  -> commits with your own message
# Live about 30-60 seconds after this finishes.
set -e
cd "$(dirname "$0")" || exit 1

if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to publish - the live site already matches this folder."
  exit 0
fi

echo "About to publish these changes:"
git status --short
echo

MSG="${1:-Content update $(date '+%d %b %Y')}"
git add -A
git commit -q -m "$MSG"
git push -q origin main

echo "Pushed. GitHub is rebuilding the site now."
echo "Give it 30-60 seconds, then hard-refresh the page (Cmd-Shift-R)."
