# DEPRECATED: replaced by aws_iam_split_users.tf (US-11) on 2026-04-27.
# This combined-permission user stays in state until the API has been
# switched to use the split runtime users via Dokploy env vars.
# Removal tracked as a follow-up apply — do not destroy yet.

resource "aws_iam_user" "api_backend" {
  name = "${var.project}-api-${var.environment}"

  tags = {
    Name        = "API Backend Service Account"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Unified credentials for all API AWS operations"
  }
}

# Combined IAM Policy - SES + S3 + Cognito
resource "aws_iam_policy" "api_backend" {
  name        = "${var.project}-api-policy-${var.environment}"
  description = "Combined permissions for API and workers (SES email + S3 blog uploads + Cognito auth + CloudWatch logs)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CognitoUserManagement"
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminDeleteUser",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminRespondToAuthChallenge",
          "cognito-idp:ListUsers",
          "cognito-idp:InitiateAuth",
          "cognito-idp:RespondToAuthChallenge",
          "cognito-idp:ConfirmSignUp",
          "cognito-idp:ResendConfirmationCode",
          "cognito-idp:ForgotPassword",
          "cognito-idp:ConfirmForgotPassword",
          "cognito-idp:GlobalSignOut"
        ]
        Resource = aws_cognito_user_pool.pool.arn
      },
      # v1 LocationService statements (Geocode / Routing / Map) removed in
      # auto-place-resolution US-03 alongside the v1 PlaceIndex/RouteCalculator/Map
      # resources. The dispatch-api uses the v2 SDK + the split runtime user in
      # aws_iam_split_users.tf for geo permissions; this deprecated combined user
      # never needed v2 perms so nothing is added back here.
      {
        Sid    = "SesSendEmail"
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "ses:FromAddress" = "*@${local.ses_send_domain}"
          }
        }
      },
      # CloudWatch Logs
      # {
      #   Sid    = "CloudWatchLogs"
      #   Effect = "Allow"
      #   Action = [
      #     "logs:CreateLogStream",
      #     "logs:PutLogEvents",
      #     "logs:DescribeLogStreams"
      #   ]
      #   Resource = [
      #     "${aws_cloudwatch_log_group.api.arn}:*",
      #     "${aws_cloudwatch_log_group.workers.arn}:*"
      #   ]
      # }
    ]
  })

  tags = {
    Name        = "API Backend Policy"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Attach policy to user
resource "aws_iam_user_policy_attachment" "api_backend" {
  user       = aws_iam_user.api_backend.name
  policy_arn = aws_iam_policy.api_backend.arn
}

# Generate IAM access key
# Stored in Terraform state (encrypted with KMS)
resource "aws_iam_access_key" "api_backend" {
  user = aws_iam_user.api_backend.name
}

# Outputs
output "api_iam_user_name" {
  description = "API backend IAM user name"
  value       = aws_iam_user.api_backend.name
}

output "api_iam_user_arn" {
  description = "API backend IAM user ARN"
  value       = aws_iam_user.api_backend.arn
}

output "api_access_key_id" {
  description = "API backend access key ID (SES + S3 + Cognito permissions)"
  value       = aws_iam_access_key.api_backend.id
  sensitive   = true
}

output "api_secret_access_key" {
  description = "API backend secret access key (SES + S3 + Cognito permissions)"
  value       = aws_iam_access_key.api_backend.secret
  sensitive   = true
}

