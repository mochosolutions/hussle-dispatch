variable "project" {
  type = string
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "domain_name" {
  description = "Root domain name used for SES send subdomain (e.g. hussledispatch.com)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "services" {
  description = "List of service names to provision ECR repos for"
  type        = list(string)
}

variable "service_subdomains" {
  description = "Map of service key to subdomain prefix (e.g. { api = \"api.fleet\", app = \"app.fleet\" })"
  type        = map(string)
}

variable "create_server" {
  description = "Create a new Hetzner VPS. Set false to share an existing server (e.g. dev+QA on one box)."
  type        = bool
  default     = true
}

variable "shared_server_ip" {
  description = "IP of existing server to reuse. Required when create_server = false."
  type        = string
  default     = null
}

variable "create_firewall" {
  description = "Create and attach an hcloud_firewall. Default false — use UFW via Ansible instead."
  type        = bool
  default     = false
}

variable "hetzner_server_type" {
  description = "Hetzner server type"
  type        = string
  default     = "cpx21"
}

variable "hetzner_location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "ash"
}

variable "allowed_ssh_cidrs" {
  description = "CIDRs allowed to SSH to the VPS"
  type        = list(string)
  default     = []
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "ssh_key_name" {
  description = "Name of the SSH key registered in Hetzner"
  type        = string
}
