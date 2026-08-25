#!/bin/bash
# Double-click this file to publish your edits to brendaong.com.
cd "$(dirname "$0")" || exit 1

BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; RED=$'\033[31m'; YEL=$'\033[33m'; OFF=$'\033[0m'

printf "\n%s" "$BOLD"
echo "  Publish to brendaong.com"
printf "%s" "$OFF"
echo "  ------------------------------------------------------"
echo

# --- anything to do? -----------------------------------------------------
if [ -z "$(git status --porcelain)" ]; then
  echo "  ${GREEN}Nothing to publish.${OFF}"
  echo "  The live site already matches this folder."
  echo
  echo "  (If you edited a file, check you saved it.)"
  echo
  read -n 1 -s -r -p "  Press any key to close..."
  echo; exit 0
fi

# --- show what changed ---------------------------------------------------
echo "  ${BOLD}You changed:${OFF}"
git status --porcelain | while read -r line; do echo "    $line"; done
echo
echo "  ${DIM}Lines added/removed:${OFF}"
git diff --stat | tail -n +1 | while read -r line; do echo "    $line"; done
echo

# --- basic safety check on HTML -----------------------------------------
BROKEN=""
for f in $(git diff --name-only; git ls-files --others --exclude-standard); do
  case "$f" in
    *.html)
      o=$(grep -o '<div' "$f" 2>/dev/null | wc -l | tr -d ' ')
      c=$(grep -o '</div>' "$f" 2>/dev/null | wc -l | tr -d ' ')
      [ "$o" != "$c" ] && BROKEN="$BROKEN$f ($o open vs $c closing <div>)\n"
      ;;
  esac
done
if [ -n "$BROKEN" ]; then
  echo "  ${RED}Hold on - the HTML looks unbalanced:${OFF}"
  printf "    $BROKEN"
  echo "  ${YEL}Publishing anyway may break the page layout.${OFF}"
  echo
fi

# --- confirm -------------------------------------------------------------
read -r -p "  Publish these changes? [y/N] " ok
case "$ok" in
  y|Y|yes|YES) ;;
  *) echo; echo "  Cancelled. Nothing was published."; echo
     read -n 1 -s -r -p "  Press any key to close..."; echo; exit 0 ;;
esac

echo
read -r -p "  Short note about the change (or press Enter): " msg
[ -z "$msg" ] && msg="Content update $(date '+%d %b %Y, %H:%M')"

echo
echo "  Publishing..."
git add -A
git commit -q -m "$msg" || { echo "  ${RED}Commit failed.${OFF}"; read -n 1 -s -r -p "  Press any key..."; exit 1; }

if ! git push -q origin main 2>/dev/null; then
  echo "  ${RED}Push failed.${OFF} You may be offline, or the GitHub copy moved ahead."
  echo "  Ask Claude to sort it out - your work is committed and safe."
  echo
  read -n 1 -s -r -p "  Press any key to close..."; echo; exit 1
fi

echo "  ${GREEN}Sent.${OFF} GitHub is rebuilding the site."
echo
printf "  Waiting for it to go live"
for i in $(seq 1 20); do printf "."; sleep 3
  if command -v gh >/dev/null 2>&1; then
    st=$(gh api repos/bibiong/bibiong.github.io/pages/builds/latest -q .status 2>/dev/null)
    [ "$st" = "built" ] && break
  fi
done
echo
echo
echo "  ${GREEN}${BOLD}Done - your changes are live at brendaong.com${OFF}"
echo "  ${DIM}If the page looks unchanged, hard-refresh: Cmd-Shift-R${OFF}"
echo
read -n 1 -s -r -p "  Press any key to close..."
echo
