#!/bin/bash
# Double-click to preview the site on this Mac before publishing.
cd "$(dirname "$0")" || exit 1

BOLD=$'\033[1m'; DIM=$'\033[2m'; OFF=$'\033[0m'

printf "\n%s" "$BOLD"
echo "  Local preview - nothing here is public"
printf "%s" "$OFF"
echo "  ------------------------------------------------------"
echo "  Opening http://localhost:8811"
echo
echo "  Edit a file, save it, then refresh the browser to see it."
echo "  ${DIM}Close this window (or press Ctrl-C) when you're done.${OFF}"
echo

sleep 1
open "http://localhost:8811" 2>/dev/null
python3 -m http.server 8811
