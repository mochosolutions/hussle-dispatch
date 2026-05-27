# Backend (remote state)
s3_bucket_name      = "hussle-dispatch-terraform-state"
dynamodb_table_name = "hussle-dispatch-terraform-locks"

# Application
project     = "hussle-dispatch"
environment = "dev"
domain_name = "hussledispatch.online"
aws_region  = "us-east-1"

services = ["api", "ui", "rabbitmq"]

service_subdomains = {
  api     = "api-dev"
  ui      = "dev"
  dokploy = "dokploy.dev"
}

hetzner_server_type = "cx32"
hetzner_location    = "ash"
create_server       = false
shared_server_ip    = "5.161.43.189"
create_firewall     = false

allowed_ssh_cidrs = []


cloudflare_account_id = "a0ab47257e3681061773ba020ae74e1d"

ssh_key_name = "jr@mochosolutions.com"

# Sensitive provider tokens stored in AWS Secrets Manager.
# Run: make secrets-init ENV=dev  (before first terraform apply)
