data "aws_caller_identity" "current" {}

module "ecr" {
  for_each = toset(var.services)
  source   = "../../../mocho-infra-modules/modules/ecr"

  repository_name         = "fleet-${each.key}"
  scan_on_push            = true
  enable_lifecycle_policy = true
  max_sha_images          = 100
  max_dev_images          = 30
  max_prod_images         = 50
  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}
