variable "s3_bucket_name" {
  description = "S3 bucket for storing Terraform remote state"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB table for Terraform state locking"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "hussle-dispatch"
}
