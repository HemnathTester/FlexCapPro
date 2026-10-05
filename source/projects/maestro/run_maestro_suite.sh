#!/usr/bin/env bash
set -uo pipefail
# Run from this script's folder so relative paths work from anywhere (e.g. repo root).
cd "$(dirname "${BASH_SOURCE[0]}")"
ROOT="$(cd ../../.. && pwd)"
export PATH="$PATH:$HOME/.maestro/bin"

# Load the root .env (APP_ID / API_BASE_URL are passed to flows as -e values)
if [ -f "$ROOT/.env" ]; then
  set -a; . "$ROOT/.env"; set +a
fi

RESULTS_DIR="$ROOT/reports/results/maestro"
LOG_DIR="$ROOT/executions/logs"
mkdir -p "$RESULTS_DIR" "$LOG_DIR"
TS=$(date +%Y-%m-%dT%H-%M-%S)
LOG_FILE="$LOG_DIR/${TS}_maestro.log"

echo "Running Maestro flows..." | tee "$LOG_FILE"
maestro test . \
  -e APP_ID="${ANDROID_APP_ID:-}" \
  -e API_BASE_URL="${API_BASE_URL:-}" \
  --format junit \
  --output "$RESULTS_DIR/maestro-results.xml" \
  2>&1 | tee -a "$LOG_FILE"
STATUS=${PIPESTATUS[0]}   # exit code of maestro, not tee
echo "Maestro run finished with exit code $STATUS" | tee -a "$LOG_FILE"
exit $STATUS
