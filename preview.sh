#!/bin/bash
# Preview the site locally before publishing.
# Run:  ./preview.sh      then open http://localhost:8811
# Stop: Ctrl-C
cd "$(dirname "$0")" || exit 1
echo "Preview running at http://localhost:8811"
echo "Edit files, save, then refresh the browser. Ctrl-C to stop."
open "http://localhost:8811" 2>/dev/null
python3 -m http.server 8811
