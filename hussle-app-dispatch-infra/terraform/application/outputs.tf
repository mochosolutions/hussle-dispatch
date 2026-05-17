output "cloudflare_nameservers" {
  description = "Cloudflare nameservers to set at your domain registrar"
  value       = cloudflare_zone.this.name_servers
}

output "api_runtime_credentials" {
  description = "AWS credentials for the API runtime user (S3, Cognito)"
  sensitive   = true
  value = {
    access_key_id     = module.iam_api_runtime.access_key_id
    secret_access_key = module.iam_api_runtime.secret_access_key
  }
}

output "ses_sender_credentials" {
  description = "AWS credentials for the SES sender user"
  sensitive   = true
  value = {
    access_key_id     = module.iam_ses_sender.access_key_id
    secret_access_key = module.iam_ses_sender.secret_access_key
  }
}

output "jenkins_ecr_credentials" {
  description = "AWS credentials for Jenkins ECR push"
  sensitive   = true
  value = {
    access_key_id     = module.iam_jenkins.access_key_id
    secret_access_key = module.iam_jenkins.secret_access_key
  }
}

output "dokploy_ecr_credentials" {
  description = "AWS credentials for Dokploy ECR pull"
  sensitive   = true
  value = {
    access_key_id     = module.iam_dokploy_pull.access_key_id
    secret_access_key = module.iam_dokploy_pull.secret_access_key
  }
}

# output "r2_backup_credentials" {
#   description = "Cloudflare R2 credentials for the backups bucket"
#   sensitive   = true
#   value = {
#     access_key_id     = module.cloudflare_r2_backups.access_key_id
#     secret_access_key = module.cloudflare_r2_backups.secret_access_key
#     endpoint_url      = module.cloudflare_r2_backups.endpoint_url
#     bucket_name       = module.cloudflare_r2_backups.bucket_name
#   }
# }

output "ecr_registry_url" {
  description = "ECR registry base URL (account.dkr.ecr.region.amazonaws.com)"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

output "ecr_repository_urls" {
  description = "Map of service name to ECR repository URL"
  value       = { for k, v in module.ecr : k => v.repository_url }
}

output "hetzner_vps_ipv4" {
  description = "Public IPv4 address of the Hetzner VPS"
  value       = local.server_ip
}

output "uploads_bucket_name" {
  description = "Name of the S3 uploads bucket"
  value       = module.s3_uploads.bucket_name
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID"
  value       = aws_cognito_user_pool.pool.id
}

output "cognito_client_id" {
  description = "Cognito user pool client ID"
  value       = aws_cognito_user_pool_client.client.id
}

output "domain_name" {
  description = "Root domain name for this environment"
  value       = var.domain_name
}
