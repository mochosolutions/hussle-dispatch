data "aws_iam_policy_document" "dokploy_ecr" {
  statement {
    sid       = "ECRAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
  statement {
    sid    = "ECRPull"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
    ]
    resources = ["arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/fleet-*"]
  }
}

module "iam_dokploy_pull" {
  source      = "../../../mocho-infra-modules/modules/iam-runtime-user"
  name        = "fleet-dokploy-pull-${var.environment}"
  policy_json = data.aws_iam_policy_document.dokploy_ecr.json
  tags = {
    Project   = var.project
    Purpose   = "Dokploy ECR pull"
    ManagedBy = "terraform"
  }
}
