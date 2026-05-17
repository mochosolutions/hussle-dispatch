#!/bin/bash
set -e

ENVIRONMENT=${1:-""}

if [[ -z "$ENVIRONMENT" ]]; then
    echo "Usage: $0 <dev|qa|staging|prod>"
    exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT="$SCRIPT_DIR/.."
SHARED_SCRIPT="$SCRIPT_DIR/../../mocho-infra-modules/tooling/scripts/health_check.py"

if [[ ! -f "$SHARED_SCRIPT" ]]; then
    echo "❌ Shared health-check script not found: $SHARED_SCRIPT"
    exit 1
fi

exec python3 "$SHARED_SCRIPT" \
    --env "$ENVIRONMENT" \
    --project-root "$PROJECT_ROOT" \
    "${@:2}"
