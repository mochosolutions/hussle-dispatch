# Dispatch Infrastructure

Terraform-managed infrastructure for Fleet Command — AWS (ECR, IAM, S3, Cognito, SES, Location) + Hetzner VPS + Cloudflare (DNS, R2).

## Repositories

| Repo | Purpose |
|------|---------|
| `hussle-app-dispatch-infra/` | This repo — Terraform root modules |
| `mocho-infra-modules/` | Shared Terraform modules |

## Prerequisites

- Terraform >= 1.5
- AWS CLI configured (`aws configure` or `AWS_PROFILE`)
- Cloudflare API token with Zone:Edit + R2:Edit permissions
- Hetzner Cloud API token

## Required environment variables

Set these before running `terraform`:

```bash
export AWS_PROFILE=hussle-dispatch          # or use AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
export TF_VAR_cloudflare_api_token="..."    # Cloudflare API token
export TF_VAR_hetzner_api_token="..."       # Hetzner Cloud API token
```

## Module structure

```
terraform/
  backend/      # S3 state bucket + DynamoDB lock table (one-time bootstrap)
  application/  # All application infrastructure
    stages/
      dev.tfvars
      prod.tfvars
```

## First-time bootstrap

### 1. Bootstrap state backend (once per AWS account)

```bash
cd terraform/backend
terraform init
terraform apply
```

### 2. Apply application stack

Fill in `stages/dev.tfvars`:
- `allowed_ssh_cidrs` — your office/home IP in CIDR notation (e.g., `["1.2.3.4/32"]`)
- `cloudflare_zone_id` — from Cloudflare dashboard → domain → Overview → Zone ID
- `cloudflare_account_id` — from Cloudflare dashboard → Account ID (top right)

```bash
cd terraform/application
terraform init
terraform plan -var-file=stages/dev.tfvars
terraform apply -var-file=stages/dev.tfvars
```

### 3. Capture outputs

After apply, retrieve credentials for Dokploy and Jenkins:

```bash
terraform output -json -var-file=stages/dev.tfvars
```

Key outputs and where they go:

| Output | Destination |
|--------|-------------|
| `api_runtime_credentials` | Dokploy → API service env vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) |
| `ses_sender_credentials` | Dokploy → API service env vars (SES sender) |
| `jenkins_ecr_credentials` | Jenkins → Credentials store (ECR push) |
| `dokploy_ecr_credentials` | Dokploy → server env vars (ECR pull login) |
| `r2_backup_credentials` | Dokploy → backup service env vars |
| `ecr_registry_url` | Jenkins pipeline + Dokploy |
| `hetzner_vps_ipv4` | Confirm DNS A records resolved |
| `cognito_user_pool_id` | Dokploy → API service (`COGNITO_USER_POOL_ID`) |
| `cognito_client_id` | Dokploy → API service (`COGNITO_CLIENT_ID`) |

## Production apply

```bash
cd terraform/application
terraform plan -var-file=stages/prod.tfvars
terraform apply -var-file=stages/prod.tfvars
```

Prod creates a separate VPS, separate ECR tags, and separate S3/R2 buckets. Review the plan carefully before applying.

## Out-of-scope (manual one-time steps)

These are not managed by Terraform:

| Item | How |
|------|-----|
| **Dokploy app + env vars** | Dokploy UI → compose upload → environment variables tab |
| **Twilio credentials** | Twilio console → generate and store in Dokploy env vars |
| **AWS Location API key** | `aws location create-key --key-name fleet-command-dev --restrictions '{"AllowActions":["geo:*"],"AllowReferers":["https://app.fleet.hussledispatch.com"]}'` |
| **CloudTrail** | AWS Console → account-level, not per-project |
| **Let's Encrypt (Traefik)** | Auto-provisioned by Traefik once DNS propagates; configure in Dokploy UI |

## Updating infrastructure

1. Edit the relevant `.tf` file
2. `terraform plan -var-file=stages/<env>.tfvars` — review the diff
3. `terraform apply -var-file=stages/<env>.tfvars`

## Backup restore drill (monthly)

```bash
# 1. Download latest backup from R2
aws s3 cp s3://fleet-command-backups-prod/postgres/latest.dump /tmp/fleet-backup.dump \
  --endpoint-url $(terraform output -raw r2_backup_endpoint) \
  --profile r2

# 2. Restore into a throwaway container
docker run --rm -e POSTGRES_PASSWORD=test -d --name pg-restore postgres:16-alpine
docker exec pg-restore createdb -U postgres fleet_restore
docker exec -i pg-restore pg_restore -U postgres -d fleet_restore < /tmp/fleet-backup.dump

# 3. Sanity check
docker exec pg-restore psql -U postgres -d fleet_restore -c 'SELECT count(*) FROM "Organization";'

# 4. Teardown
docker stop pg-restore
```
