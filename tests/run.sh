#!/usr/bin/env bash
# Runs every browser test against a local copy of both apps.
# Needs: python3, playwright (pip install playwright && playwright install chromium), xvfb-run for test_alarm.
set -u
HERE="$(cd "$(dirname "$0")/.." && pwd)"
W="$(mktemp -d)"; trap 'rm -rf "$W"' EXIT
# one app (Sayvo). The page at / has Focus+ on (the focus tests), /app/ has it off; same files.
mk(){ d="$1"; flag="$2"; mkdir -p "$d"; for f in "$HERE"/*; do n=$(basename "$f"); [ "$n" = index.html ] || ln -s "$f" "$d/$n"; done
  sed "s|<head>|<head><script>try{if(localStorage.getItem('sy_focus')===null)localStorage.setItem('sy_focus','$flag');if(localStorage.getItem('sy_seenPick')===null)localStorage.setItem('sy_seenPick','true')}catch(e){}</script>|" "$HERE/index.html" > "$d/index.html"; }
mk "$W" true; rm -rf "$W/app"; mk "$W/app" false; ln -s "$HERE" "$W/Sanady"
export PYTHONPATH="$HERE/tests/_ar${PYTHONPATH:+:$PYTHONPATH}"
fail=0
for t in "$HERE"/tests/test_*.py; do
  n=$(basename "$t" .py); runner=python3
  [ "$n" = test_alarm ] && command -v xvfb-run >/dev/null && runner="xvfb-run -a python3"
  out=$($runner "$t" "$W" 2>&1); last=$(echo "$out" | grep -E "passed|errors" | tail -1)
  echo "$n: $last"
  echo "$out" | grep -q "FAIL\|Traceback" && { fail=1; echo "$out" | grep -E "FAIL|Error" | head -5; }
done
exit $fail
