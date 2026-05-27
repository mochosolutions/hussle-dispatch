#!/bin/bash
set -e

ENVIRONMENT=${1:-""}

if [[ -z "$ENVIRONMENT" ]]; then
    echo "Usage: $0 <dev|qa|staging|prod>"
    exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT="$SCRIPT_DIR/.."
SHARED_SCRIPT="$SCRIPT_DIR/../../mocho-infra-modules/tooling/scripts/dokploy_deploy.py"
CONFIG="$PROJECT_ROOT/environments/$ENVIRONMENT/config.yaml"
BASE_CONFIG="$PROJECT_ROOT/environments/base/config.yaml"
ENV_FILE="$PROJECT_ROOT/environments/$ENVIRONMENT/.env"

if [[ ! -f "$SHARED_SCRIPT" ]]; then
    echo "❌ Shared deploy script not found: $SHARED_SCRIPT"
    exit 1
fi

if [[ ! -f "$CONFIG" ]]; then
    echo "❌ Config not found: $CONFIG"
    exit 1
fi

ENV_ARGS=""
if [[ -f "$ENV_FILE" ]]; then
    ENV_ARGS="--env-file $ENV_FILE"
fi

exec python3 "$SHARED_SCRIPT" \
    --config "$CONFIG" \
    --base-config "$BASE_CONFIG" \
    $ENV_ARGS \
    "${@:2}"
