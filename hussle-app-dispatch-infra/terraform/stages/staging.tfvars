# Backend (remote state)
s3_bucket_name      = "hussle-dispatch-terraform-state"
dynamodb_table_name = "hussle-dispatch-terraform-locks"

# Application
project     = "hussle-dispatch"
environment = "staging"
domain_name = "hussledispatch.com"
aws_region  = "us-east-1"

services = ["api", "ui", "emails", "rabbitmq"]

service_subdomains = {
  api     = "api.staging"
  ui      = "staging"
  dokploy = "dokploy.staging"
}

hetzner_server_type = "cx32"
hetzner_location    = "ash"
create_server       = true
create_firewall     = false

allowed_ssh_cidrs = ["0.0.0.0/0"]

# OPERATOR: get from Cloudflare dashboard — hussledispatch.com zone
cloudflare_account_id = "a0ab47257e3681061773ba020ae74e1d"

ssh_key_name = "jr@mochosolutions.com"

# Sensitive vars are passed via environment:
#   export TF_VAR_cloudflare_api_token="..."
#   export TF_VAR_hetzner_api_token="..."
