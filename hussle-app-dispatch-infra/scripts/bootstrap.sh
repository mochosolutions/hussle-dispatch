#!/bin/bash
set -e

ENVIRONMENT=${1:-""}
PLAN_ONLY=${2:-""}

if [[ -z "$ENVIRONMENT" ]]; then
    echo "Usage: $0 <dev|qa|staging|prod> [--plan-only]"
    exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SHARED_SCRIPT="$SCRIPT_DIR/../../mocho-infra-modules/tooling/scripts/bootstrap_application.sh"

if [[ ! -f "$SHARED_SCRIPT" ]]; then
    echo "❌ Shared bootstrap script not found: $SHARED_SCRIPT"
    exit 1
fi

export PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
exec bash "$SHARED_SCRIPT" "$ENVIRONMENT" "$PLAN_ONLY"
