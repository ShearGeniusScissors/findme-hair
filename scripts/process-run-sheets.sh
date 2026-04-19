#!/usr/bin/env bash
# Shear Genius run-sheet batch processor
#
# Watches run-sheets/incoming/ for new CSVs, processes each one via
# ingest-run-sheet.js, then moves it to run-sheets/processed/.
#
# Designed for cron: runs nightly at 20:00 local time.
# Add to crontab:
#   0 20 * * * /Users/mattgrumley/Projects/findme-hair/scripts/process-run-sheets.sh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INCOMING_DIR="$PROJECT_DIR/run-sheets/incoming"
PROCESSED_DIR="$PROJECT_DIR/run-sheets/processed"
LOG_FILE="/private/tmp/run-sheet-ingest.log"

cd "$PROJECT_DIR"

# Ensure env is available (node scripts load .env.local automatically)
source ~/.zshrc 2>/dev/null || true

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting run-sheet processor" >> "$LOG_FILE"

shopt -s nullglob
CSV_FILES=("$INCOMING_DIR"/*.csv)

if [ ${#CSV_FILES[@]} -eq 0 ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] No CSVs in incoming — nothing to do" >> "$LOG_FILE"
  exit 0
fi

for csv in "${CSV_FILES[@]}"; do
  filename="$(basename "$csv")"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Processing $filename" >> "$LOG_FILE"

  if node scripts/ingest-run-sheet.js "$csv" >> "$LOG_FILE" 2>&1; then
    mv "$csv" "$PROCESSED_DIR/$filename"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] OK — moved to processed/$filename" >> "$LOG_FILE"
  else
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] FAILED — $filename left in incoming for retry" >> "$LOG_FILE"
  fi
done

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Done" >> "$LOG_FILE"
