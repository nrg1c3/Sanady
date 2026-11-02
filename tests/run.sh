#!/usr/bin/env bash
# Runs every browser test against a local copy of both apps.
# Needs: python3, playwright (pip install playwright && playwright install chromium), xvfb-run for test_alarm.
# The مُدبّر page lives in the nrg1c3.github.io repo, cloned next to this one (or set SITE_REPO).
set -u
HERE="$(cd "$(dirname "$0")/.." && pwd)"
SITE="${SITE_REPO:-$HERE/../nrg1c3.github.io}"
python3 "$HERE/tools/build-app.py" >/dev/null || exit 1
W="$(mktemp -d)"; trap 'rm -rf "$W"' EXIT
for f in "$HERE"/*; do ln -s "$f" "$W/$(basename "$f")"; done
rm -f "$W/app"; ln -s "$SITE/mudabbir" "$W/app"; ln -s "$HERE" "$W/Sanady"
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
