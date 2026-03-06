#!/bin/sh
set -e

# Parse arguments
DEV_MODE=false
DB_NAME_PARAM=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dev)
      DEV_MODE=true
      ;;
    --db-name)
      if [ -z "$2" ]; then
        echo "✗ --db-name requires a value"
        exit 1
      fi
      DB_NAME_PARAM="$2"
      shift
      ;;
    *)
      echo "✗ Unknown argument: $1"
      echo "Usage: $0 [--dev] [--db-name <database_name>]"
      exit 1
      ;;
  esac
  shift
done

if [ -z "$DB_NAME_PARAM" ]; then
  DB_NAME_PARAM="$DB_NAME"
fi

if [ -z "$DB_NAME_PARAM" ]; then
  DB_NAME_PARAM=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
fi

if [ -z "$DB_NAME_PARAM" ]; then
  echo "✗ Could not determine database name. Provide --db-name or set DB_NAME."
  exit 1
fi

if [ "$DEV_MODE" = "true" ]; then
  echo "============================================"
  echo "Starting Mocho Solutions API (Development)"
  echo "============================================"
else
  echo "============================================"
  echo "Starting Mocho Solutions API"
  echo "============================================"
fi

echo "Using database: $DB_NAME_PARAM"

# ============================================
# Sync node_modules if dependencies changed (dev only)
# Production images have correct deps from Docker build
# ============================================
if [ "$DEV_MODE" = "true" ]; then
  LOCKFILE_HASH=$(md5sum package-lock.json | cut -d' ' -f1)
  if [ ! -f node_modules/.lockfile_hash ] || [ "$(cat node_modules/.lockfile_hash)" != "$LOCKFILE_HASH" ]; then
    echo "Dependencies changed, running npm install..."
    npm install
    echo "$LOCKFILE_HASH" > node_modules/.lockfile_hash
    echo "✓ Dependencies synced"
  else
    echo "✓ Dependencies up to date"
  fi
fi

# Wait for database to be ready
echo "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0

if [ "$DEV_MODE" = "true" ]; then
  # Use Prisma db execute for dev (no psql available in dev image)
  # Note: prisma migrate status exits with code 1 when migrations are pending,
  # so we use db execute with a simple SELECT instead
  while [ $attempt -lt $max_attempts ]; do
    if echo "SELECT 1" | npx prisma db execute --stdin --schema=./prisma/schema.prisma > /dev/null 2>&1; then
      echo "✓ PostgreSQL is ready!"
      break
    fi
    attempt=$((attempt + 1))
    echo "Waiting for database... attempt $attempt/$max_attempts"
    sleep 2
  done
else
  # Extract database connection details from DATABASE_URL
  # Format: postgresql://user:pass@host:port/dbname
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p')

  # Use psql for prod (faster, more reliable)
  while [ $attempt -lt $max_attempts ]; do
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME_PARAM" -c "SELECT 1" > /dev/null 2>&1; then
      echo "✓ PostgreSQL is ready!"
      break
    fi

    attempt=$((attempt + 1))
    echo "Waiting for database... attempt $attempt/$max_attempts"
    sleep 2
  done
fi

if [ $attempt -eq $max_attempts ]; then
  echo "✗ Failed to connect to PostgreSQL after $max_attempts attempts"
  exit 1
fi

# ============================================
# Handle existing database without migration history (baselining)
# Only in prod mode (requires psql which isn't available in dev image)
# ============================================
if [ "$DEV_MODE" = "false" ]; then
  echo "Checking database state..."

  # Check if _prisma_migrations table exists
  MIGRATIONS_TABLE_EXISTS=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME_PARAM" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations')" 2>/dev/null || echo "f")

  # Check if any application tables exist
  APP_TABLES_EXIST=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME_PARAM" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('posts', 'users', 'organizations'))" 2>/dev/null || echo "f")

  # If app tables exist but no migration history, we need to baseline
  if [ "$APP_TABLES_EXIST" = "t" ] && [ "$MIGRATIONS_TABLE_EXISTS" = "f" ]; then
    echo "⚠ Existing database detected without migration history"
    echo "  Auto-baselining existing migrations..."

    # Get all migration folder names and mark them as applied
    for migration in $(ls -1 prisma/migrations/ 2>/dev/null | grep -E '^[0-9]+_'); do
      echo "  → Marking $migration as applied..."
      npx prisma migrate resolve --applied "$migration" || {
        echo "  ⚠ Could not baseline $migration, continuing..."
      }
    done

    echo "✓ Baseline complete"
  fi
fi

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✓ Migrations completed successfully"
else
  echo "✗ Migration failed"
  exit 1
fi

# Note: Prisma Client is already generated and copied from builder stage
# It's located at /usr/app/generated/prisma (source code imports from '../../generated/prisma')

# ============================================
# Optional: Migrate local images to S3
# ============================================
if [ "$RUN_IMAGE_MIGRATION" = "true" ] && [ "$USE_LOCAL_STORAGE" = "false" ]; then
  echo "============================================"
  echo "Migrating local images to S3..."
  echo "============================================"

  # Run migration script
  node dist/scripts/migrateImagesToS3.js

  if [ $? -eq 0 ]; then
    echo "✓ Image migration completed successfully"
  else
    echo "✗ Image migration failed (continuing with startup)"
    # Don't exit - allow app to start even if migration fails
  fi
elif [ "$RUN_IMAGE_MIGRATION" = "true" ] && [ "$USE_LOCAL_STORAGE" != "false" ]; then
  echo "⚠ Skipping image migration: USE_LOCAL_STORAGE is not 'false'"
  echo "  (Migration only runs when using S3 storage)"
else
  echo "Skipping image migration (RUN_IMAGE_MIGRATION=${RUN_IMAGE_MIGRATION:-not set})"
fi

# Start the application
echo ""
echo "============================================"
echo "Starting API server..."
echo "============================================"

if [ "$DEV_MODE" = "true" ]; then
  exec npm run dev
else
  exec node dist/index.js
fi
