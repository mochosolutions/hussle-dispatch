output "s3_bucket_name" {
  description = "The name of the S3 bucket used for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "dynamodb_table" {
  description = "The name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_locks.id
}

# Secrets Manager Outputs
# output "terraform_providers_secret_name" {
#   description = "Name of the Secrets Manager secret for Terraform provider tokens"
#   value       = aws_secretsmanager_secret.terraform_providers.name
# }

# output "terraform_providers_secret_arn" {
#   description = "ARN of the Secrets Manager secret for Terraform provider tokens"
#   value       = aws_secretsmanager_secret.terraform_providers.arn
# }

# output "application_secret_name" {
#   description = "Name of the Secrets Manager secret for application secrets"
#   value       = aws_secretsmanager_secret.application.name
# }

# output "application_secret_arn" {
#   description = "ARN of the Secrets Manager secret for application secrets"
#   value       = aws_secretsmanager_secret.application.arn
# }
