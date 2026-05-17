# /feature-init

Create a feature planning directory and git branch.

## Usage

```
/feature-init <feature-name>
```

Example: `/feature-init shift-scheduling`

The feature name must be kebab-case. It becomes both the directory name and branch suffix.

## Procedure

### Step 1: Validate

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

FEATURE_NAME="<feature-name>"
FEATURE_DIR=".planning/$FEATURE_NAME"

# Check directory doesn't already exist
if [ -d "$FEATURE_DIR" ]; then
  echo "ERROR: Directory $FEATURE_DIR already exists."
  exit 1
fi

# Check branch doesn't already exist
if git rev-parse --verify "feature/$FEATURE_NAME" >/dev/null 2>&1; then
  echo "ERROR: Branch feature/$FEATURE_NAME already exists."
  exit 1
fi
```

### Step 2: Create Directory

```bash
mkdir -p "$FEATURE_DIR"
```

### Step 3: Create Git Branch

```bash
git checkout -b "feature/$FEATURE_NAME"
```

### Step 4: Report

```
Feature initialized:
  Directory: .planning/<feature-name>/
  Branch:    feature/<feature-name>

Next steps:
  /prd-refine <feature-name>      — Define requirements → plan.md
  /design <feature-name>          — (optional) Design UI screens
  /contract-freeze <feature-name> — (optional) Generate API contract
```
