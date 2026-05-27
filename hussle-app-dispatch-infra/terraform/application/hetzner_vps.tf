locals {
  server_ip = var.create_server ? module.hetzner_vps[0].ipv4_address : var.shared_server_ip
}

module "hetzner_vps" {
  count  = var.create_server ? 1 : 0
  source = "../../../mocho-infra-modules/modules/hcloud_vps"

  name        = "fleet-${var.environment}"
  server_type = var.hetzner_server_type
  image       = "ubuntu-24.04"
  location    = var.hetzner_location
  ssh_keys    = [var.ssh_key_name]

  # create_firewall   = var.create_firewall
  open_http_https   = true
  allowed_ssh_cidrs = var.allowed_ssh_cidrs

  labels = {
    environment = var.environment
    project     = var.project
    managed_by  = "terraform"
  }
}
