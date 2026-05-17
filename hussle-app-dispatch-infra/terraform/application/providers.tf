terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = ">= 1.49.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Read provider tokens from AWS Secrets Manager (populated via: make secrets-init ENV=<env>)
data "aws_secretsmanager_secret_version" "terraform_providers" {
  secret_id = "${var.project}-terraform-${var.environment}"
}

locals {
  provider_secrets = jsondecode(data.aws_secretsmanager_secret_version.terraform_providers.secret_string)
}

provider "cloudflare" {
  api_token = local.provider_secrets["cloudflare_api_token"]
}

provider "hcloud" {
  token = local.provider_secrets["hcloud_token"]
}
