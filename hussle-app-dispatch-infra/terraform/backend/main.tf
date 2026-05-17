# ============================================================================
# KMS Key for State Encryption
# ============================================================================

resource "aws_kms_key" "terraform_state" {
  description             = "Terraform state encryption key"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "Terraform State Encryption"
    Project     = var.project
    Environment = "global"
    ManagedBy   = "Terraform"
  }
}

resource "aws_kms_alias" "terraform_state" {
  name          = "alias/${var.project}-terraform-state-${var.environment}"
  target_key_id = aws_kms_key.terraform_state.key_id
}

# ============================================================================
# S3 Bucket for Terraform State
# ============================================================================

resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project}-terraform-state"

  tags = {
    Name        = "Terraform State Bucket"
    Environment = "global"
    Project     = var.project
    ManagedBy   = "Terraform"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Versioning for state history
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# KMS encryption (upgrade from AES256)
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.terraform_state.arn
    }
    bucket_key_enabled = true
  }
}

# Enforce HTTPS-only access
resource "aws_s3_bucket_policy" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.terraform_state.arn,
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.terraform_state]
}

resource "aws_dynamodb_table" "terraform_locks" {
  name = "${var.project}-terraform-locks"

  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# ============================================================================
# AWS Secrets Manager - Infrastructure Provider Tokens
# ============================================================================

resource "aws_secretsmanager_secret" "terraform_providers" {
  name        = "${var.project}-terraform-${var.environment}"
  description = "Infrastructure provider tokens for Terraform (Hetzner, Cloudflare)"

  tags = {
    Name        = "${var.project}-terraform-${var.environment}"
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "Terraform"
    Type        = "terraform-providers"
  }
}

# ============================================================================
# AWS Secrets Manager - Application Runtime Secrets
# ============================================================================

# resource "aws_secretsmanager_secret" "application" {
#   name        = "${var.project}-app-${var.environment}"
#   description = "Application runtime secrets and deploy credentials"
#
#   tags = {
#     Name        = "${var.project}-app-${var.environment}"
#     Environment = var.environment
#     Project     = var.project
#     ManagedBy   = "Terraform"
#     Type        = "application-secrets"
#   }
# }
