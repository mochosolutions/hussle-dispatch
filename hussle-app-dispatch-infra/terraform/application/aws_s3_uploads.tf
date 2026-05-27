locals {
  ui_origin = "https://${lookup(var.service_subdomains, "ui", "app")}.${var.domain_name}"
}

module "s3_uploads" {
  source = "../../../mocho-infra-modules/modules/s3-uploads"

  bucket_name  = "fleet-command-uploads-${var.environment}"
  cors_origins = var.environment == "prod" ? [local.ui_origin] : [local.ui_origin, "http://localhost:5173", "http://localhost:8080"]

  tags = {
    Project   = "fleet-command"
    ManagedBy = "terraform"
  }
}
