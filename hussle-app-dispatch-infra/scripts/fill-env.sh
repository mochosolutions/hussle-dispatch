#!/bin/bash
set -e

ENVIRONMENT=${1:-""}

if [[ -z "$ENVIRONMENT" ]]; then
    echo "Usage: $0 <dev|qa|staging|prod>"
    exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT="$SCRIPT_DIR/.."
SHARED_SCRIPT="$SCRIPT_DIR/../../mocho-infra-modules/tooling/scripts/fill_env.py"

if [[ ! -f "$SHARED_SCRIPT" ]]; then
    echo "❌ fill_env.py not found: $SHARED_SCRIPT"
    exit 1
fi

exec python3 "$SHARED_SCRIPT" \
    --config "$PROJECT_ROOT/environments/$ENVIRONMENT/config.yaml" \
    --base-config "$PROJECT_ROOT/environments/base/config.yaml" \
    --env-file "$PROJECT_ROOT/environments/$ENVIRONMENT/.env" \
    --tf-dir "$PROJECT_ROOT/terraform/application" \
    --workspace "$ENVIRONMENT"
