resource "aws_cognito_user_pool" "pool" {
  name                = "${var.project}-user-pool-${var.environment}"
  username_attributes = ["email"]

  username_configuration {
    case_sensitive = false
  }

  auto_verified_attributes = ["email"]

  mfa_configuration = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    string_attribute_constraints {
      min_length = 1
      max_length = 2048
    }
  }

  schema {
    attribute_data_type = "String"
    mutable             = true
    name                = "given_name"
    required            = false
    string_attribute_constraints {
      min_length = 1
      max_length = 2048
    }
  }

  schema {
    attribute_data_type = "String"
    mutable             = true
    name                = "family_name"
    required            = false
    string_attribute_constraints {
      min_length = 1
      max_length = 2048
    }
  }
}


resource "aws_cognito_user_pool_client" "client" {
  name         = "${var.project}-user-pool-client"
  user_pool_id = aws_cognito_user_pool.pool.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    # "ALLOW_USER_AUTH"
  ]
}

output "user_pool_id" {
  value = aws_cognito_user_pool.pool.id
}

output "user_pool_domain" {
  value = aws_cognito_user_pool.pool.domain
}

output "user_pool_endpoint" {
  value = aws_cognito_user_pool.pool.endpoint
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.client.id
}
