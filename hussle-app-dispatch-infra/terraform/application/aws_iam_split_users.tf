# ---------------------------------------------------------------------------
# fleet-api-runtime — S3 uploads + Cognito
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "api_runtime" {
  statement {
    sid    = "S3Uploads"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = ["arn:aws:s3:::fleet-command-uploads-${var.environment}/*"]
  }
  statement {
    sid    = "S3UploadsList"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
    ]
    resources = ["arn:aws:s3:::fleet-command-uploads-${var.environment}"]
  }
  statement {
    sid    = "Cognito"
    effect = "Allow"
    actions = [
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminInitiateAuth",
      "cognito-idp:AdminRespondToAuthChallenge",
      "cognito-idp:AdminSetUserPassword",
      "cognito-idp:AdminDeleteUser",
    ]
    resources = [aws_cognito_user_pool.pool.arn]
  }
  # ---------------------------------------------------------------------------
  # AWS Location Service v2 (geo-places / geo-routes / geo-maps)
  #
  # v1 (geo:*) statements + the v1 PlaceIndex/RouteCalculator/Map resources
  # were removed in Phase 0 Stage 3 cleanup (auto-place-resolution US-03)
  # once the dispatch-api code was fully on the v2 SDK. v2 actions are
  # resource-less in the SDK call but scoped to a "provider" ARN at the
  # IAM layer: arn:aws:geo-places:<region>::provider/default (Esri data plan).
  # ---------------------------------------------------------------------------
  statement {
    sid    = "LocationV2Places"
    effect = "Allow"
    actions = [
      "geo-places:Geocode",
      "geo-places:ReverseGeocode",
      "geo-places:SearchText",
      "geo-places:SearchNearby",
      "geo-places:Autocomplete",
      "geo-places:GetPlace",
    ]
    resources = ["arn:aws:geo-places:${var.aws_region}::provider/default"]
  }

  statement {
    sid       = "LocationV2Routes"
    effect    = "Allow"
    actions   = ["geo-routes:CalculateRoutes"]
    resources = ["arn:aws:geo-routes:${var.aws_region}::provider/default"]
  }

  statement {
    sid    = "LocationV2Maps"
    effect = "Allow"
    actions = [
      "geo-maps:GetTile",
      "geo-maps:GetStyleDescriptor",
      "geo-maps:GetSprites",
      "geo-maps:GetGlyphs",
      "geo-maps:GetStaticMap",
    ]
    resources = ["arn:aws:geo-maps:${var.aws_region}::provider/default"]
  }
}

module "iam_api_runtime" {
  source      = "../../../mocho-infra-modules/modules/iam-runtime-user"
  name        = "fleet-api-runtime-${var.environment}"
  policy_json = data.aws_iam_policy_document.api_runtime.json
  tags = {
    Project   = var.project
    Purpose   = "API runtime S3 uploads + Cognito"
    ManagedBy = "terraform"
  }
}

# AWS auto-attaches AWSCompromisedKeyQuarantineV3 to this user when it detects
# a leaked access key — the resulting broad Deny overrides the inline Allow
# above. This resource pins the set of managed-policy attachments to exactly
# what terraform manages (none), so any out-of-band attachment is removed on
# the next apply.
resource "aws_iam_user_policy_attachments_exclusive" "api_runtime" {
  user_name   = module.iam_api_runtime.user_name
  policy_arns = []
}

# ---------------------------------------------------------------------------
# fleet-ses-sender — SES send email
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "ses_sender" {
  statement {
    sid    = "SESSend"
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]
    resources = [aws_ses_domain_identity.notify.arn]
  }
}

module "iam_ses_sender" {
  source      = "../../../mocho-infra-modules/modules/iam-runtime-user"
  name        = "fleet-ses-sender-${var.environment}"
  policy_json = data.aws_iam_policy_document.ses_sender.json
  tags = {
    Project   = var.project
    Purpose   = "SES email sending"
    ManagedBy = "terraform"
  }
}

# Same rationale as api_runtime above.
resource "aws_iam_user_policy_attachments_exclusive" "ses_sender" {
  user_name   = module.iam_ses_sender.user_name
  policy_arns = []
}
