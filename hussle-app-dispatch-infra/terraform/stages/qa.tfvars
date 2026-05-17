# Backend (remote state)
s3_bucket_name      = "hussle-dispatch-terraform-state"
dynamodb_table_name = "hussle-dispatch-terraform-locks"

# Application
project     = "hussle-dispatch"
environment = "qa"
domain_name = "hussledispatch.online"
aws_region  = "us-east-1"

services = ["api", "ui", "emails", "rabbitmq"]

# QA shares the dev server — no new VPS created
service_subdomains = {
  api = "api.qa"
  ui  = "qa"
}

hetzner_server_type = "cx32"
hetzner_location    = "ash"
create_server       = false
create_firewall     = false

# OPERATOR: run `make outputs ENV=dev | grep hetzner_vps_ipv4` after dev bootstrap
shared_server_ip = "5.161.43.189"

allowed_ssh_cidrs = ["0.0.0.0/0"]

# OPERATOR: same zone as dev (hussledispatch.online)
cloudflare_account_id = "a0ab47257e3681061773ba020ae74e1d"

ssh_key_name = "jr@mochosolutions.com"

# Sensitive vars are passed via environment:
#   export TF_VAR_cloudflare_api_token="..."
#   export TF_VAR_hetzner_api_token="..."
