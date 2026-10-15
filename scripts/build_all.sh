#!/usr/bin/env bash
# Rebuild workbook (formulas), recalculate with LibreOffice (cached values), then model + reports.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
python3 "$ROOT/scripts/build_estimate.py"
soffice --headless --calc --convert-to xlsx --outdir "$TMP" "$ROOT/output/SFH_Ouachita_Takeoff_Estimate.xlsx" >/dev/null 2>&1
cp "$TMP/SFH_Ouachita_Takeoff_Estimate.xlsx" "$ROOT/output/SFH_Ouachita_Takeoff_Estimate.xlsx"
python3 "$ROOT/scripts/build_reports.py" "$ROOT/output/SFH_Ouachita_Takeoff_Estimate.xlsx" "${1:-$TMP/artifact_body.html}"
rm -rf "$TMP"
