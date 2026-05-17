data "aws_iam_policy_document" "jenkins_ecr" {
  statement {
    sid       = "ECRAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
  statement {
    sid    = "ECRPush"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
    ]
    resources = ["arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/fleet-*"]
  }
}

module "iam_jenkins" {
  source      = "../../../mocho-infra-modules/modules/iam-runtime-user"
  name        = "fleet-jenkins-ecr-${var.environment}"
  policy_json = data.aws_iam_policy_document.jenkins_ecr.json
  tags = {
    Project   = var.project
    Purpose   = "Jenkins ECR push"
    ManagedBy = "terraform"
  }
}
