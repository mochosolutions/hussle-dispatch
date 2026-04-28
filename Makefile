# Fleet Command - Infrastructure & Deployment Makefile

.PHONY: help \
        bootstrap configure-server deploy health-check \
        cloudflare-lockdown dokploy-list-github-providers \
        logs rollback \
        tf-init-backend tf-plan-backend tf-apply-backend \
        tf-init tf-plan tf-apply tf-destroy \
        ensure-workspace workspaces current-workspace \
        drift outputs show-resources fmt validate \
        status destroy

# ============================================================================
# Configuration & Variables
# ============================================================================

SHELL := /bin/bash
ENV ?= dev

INFRA_DIR      = hussle-app-dispatch-infra
TERRAFORM_DIR  = $(INFRA_DIR)/terraform/application
ANSIBLE_DIR    = $(INFRA_DIR)/ansible
SCRIPTS_DIR    = $(INFRA_DIR)/scripts
ENV_DIR        = $(INFRA_DIR)/environments/$(ENV)
STAGES_DIR     = $(INFRA_DIR)/terraform/stages
MODULES_DIR    = mocho-infra-modules

PYTHON = $(shell command -v python3 2>/dev/null || echo python)

TFVARS_FILE = $(STAGES_DIR)/$(ENV).tfvars
ENV_FILE    = $(ENV_DIR)/.env

TF           = terraform
CHDIR        = $(TF) -chdir=$(TERRAFORM_DIR)
CHDIR_BACKEND = $(TF) -chdir=$(INFRA_DIR)/terraform/backend

LINES  ?= 100
SERVICE ?= api

BLUE   = \033[0;34m
GREEN  = \033[0;32m
YELLOW = \033[1;33m
RED    = \033[0;31m
NC     = \033[0m

# ============================================================================
# Help
# ============================================================================

help:
	@echo "$(BLUE)╔══════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║         Fleet Command - Infra Management            ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Usage: make <target> ENV=<environment>$(NC)"
	@echo ""
	@echo "$(YELLOW)Environments:$(NC)  dev | qa | staging | prod"
	@echo ""
	@echo "$(YELLOW)Bootstrap & Provisioning:$(NC)"
	@echo "  make bootstrap ENV=dev         Provision infrastructure (VPS, DNS, ECR, Cognito, S3)"
	@echo "  make configure-server ENV=dev  Install Docker + Dokploy via Ansible"
	@echo "  make cloudflare-lockdown ENV=dev  Restrict 80/443 to Cloudflare IPs only"
	@echo ""
	@echo "$(YELLOW)Deployment:$(NC)"
	@echo "  make deploy ENV=dev            Deploy application via Dokploy"
	@echo "  make health-check ENV=dev      Check health endpoints"
	@echo "  make logs ENV=dev              View application logs via SSH"
	@echo "  make rollback ENV=prod         Trigger Jenkins rollback job"
	@echo ""
	@echo "$(YELLOW)Terraform:$(NC)"
	@echo "  make tf-apply-backend          Provision S3 + DynamoDB remote state (run once)"
	@echo "  make tf-plan ENV=dev           Plan infrastructure changes"
	@echo "  make tf-apply ENV=dev          Apply infrastructure changes"
	@echo "  make tf-destroy ENV=dev        Destroy environment"
	@echo "  make drift ENV=dev             Check for infrastructure drift"
	@echo "  make outputs ENV=dev           Show Terraform outputs"
	@echo "  make fmt                       Format Terraform code"
	@echo "  make validate                  Validate Terraform code"
	@echo ""
	@echo "$(YELLOW)Dokploy:$(NC)"
	@echo "  make dokploy-list-github-providers ENV=dev  List connected GitHub providers"
	@echo ""
	@echo "$(YELLOW)Settings:$(NC)  ENV=$(ENV)"
	@echo ""

# ============================================================================
# Validation
# ============================================================================

validate-env:
	@if [ ! -f "$(TFVARS_FILE)" ]; then \
		echo "$(RED)❌ $(TFVARS_FILE) not found. Available: dev, qa, staging, prod$(NC)"; \
		exit 1; \
	fi

# ============================================================================
# Bootstrap & Provisioning
# ============================================================================

bootstrap: validate-env
	@echo "$(BLUE)🚀 Bootstrapping infrastructure for $(ENV)...$(NC)"
	@bash $(SCRIPTS_DIR)/bootstrap.sh $(ENV)

configure-server: validate-env
	@echo "$(BLUE)⚙️  Configuring server for $(ENV)...$(NC)"
	@SERVER_IP=$$($(CHDIR) output -raw hetzner_vps_ipv4 2>/dev/null); \
	if [ -z "$$SERVER_IP" ]; then \
		echo "$(RED)❌ Could not get server IP. Run: make outputs ENV=$(ENV)$(NC)"; \
		exit 1; \
	fi; \
	echo "$(BLUE)Server IP: $$SERVER_IP$(NC)"; \
	SERVER_IP="$$SERVER_IP" \
	ANSIBLE_CONFIG=$(ANSIBLE_DIR)/ansible.cfg \
		ansible-playbook \
		$(MODULES_DIR)/tooling/ansible/playbooks/provision.yml \
		-i "$$SERVER_IP," \
		--user=root --become
	@echo "$(GREEN)✅ Server configured$(NC)"

cloudflare-lockdown: validate-env
	@echo "$(BLUE)🔒 Locking down to Cloudflare IPs for $(ENV)...$(NC)"
	@SERVER_IP=$$($(CHDIR) output -raw hetzner_vps_ipv4 2>/dev/null); \
	if [ -z "$$SERVER_IP" ]; then \
		echo "$(RED)❌ Could not get server IP$(NC)"; \
		exit 1; \
	fi; \
	SERVER_IP="$$SERVER_IP" \
	ANSIBLE_CONFIG=$(ANSIBLE_DIR)/ansible.cfg \
		ansible-playbook \
		$(MODULES_DIR)/tooling/ansible/playbooks/cloudflare_lockdown.yml \
		-i "$$SERVER_IP," \
		--user=root --become
	@echo "$(GREEN)✅ Cloudflare lockdown applied$(NC)"

# ============================================================================
# Deployment
# ============================================================================

deploy: validate-env
	@echo "$(BLUE)🚢 Deploying to $(ENV)...$(NC)"
	@bash $(SCRIPTS_DIR)/deploy.sh $(ENV)

health-check: validate-env
	@echo "$(BLUE)🏥 Running health checks for $(ENV)...$(NC)"
	@bash $(SCRIPTS_DIR)/health-check.sh $(ENV)

logs: validate-env
	@echo "$(BLUE)📋 Fetching logs for $(ENV) ($(SERVICE))...$(NC)"
	@SERVER_IP=$$($(CHDIR) output -raw hetzner_vps_ipv4 2>/dev/null); \
	if [ -z "$$SERVER_IP" ]; then \
		echo "$(RED)❌ Could not get server IP$(NC)"; \
		exit 1; \
	fi; \
	ssh root@$$SERVER_IP "docker logs \$$(docker ps -q --filter name=$(SERVICE)) --tail=$(LINES) -f"

rollback:
	@echo "$(YELLOW)⏪ Triggering Jenkins rollback for $(ENV)...$(NC)"
	@echo "$(YELLOW)Open Jenkins and run the Jenkinsfile.rollback pipeline.$(NC)"
	@echo "$(YELLOW)  SERVICE=$(SERVICE)  ENVIRONMENT=$(ENV)$(NC)"

dokploy-list-github-providers: validate-env
	@echo "$(BLUE)📋 Fetching GitHub providers from Dokploy...$(NC)"
	@bash $(SCRIPTS_DIR)/deploy.sh $(ENV) --list-github-providers

# ============================================================================
# Status & Destroy
# ============================================================================

status: validate-env
	@echo "$(BLUE)📊 $(ENV) Environment Status$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@$(CHDIR) workspace show || true
	@echo ""
	@$(CHDIR) output || true

destroy: validate-env
	@echo "$(RED)⚠️  Destroying $(ENV) environment...$(NC)"
	@read -p "Type '$(ENV)' to confirm: " confirm; \
	if [ "$$confirm" = "$(ENV)" ]; then \
		$(MAKE) tf-destroy; \
		echo "$(GREEN)✅ $(ENV) destroyed$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
		exit 1; \
	fi

# ============================================================================
# Terraform Backend
# ============================================================================

tf-init-backend:
	@$(CHDIR_BACKEND) init -input=false -upgrade

tf-plan-backend: validate-env
	@$(CHDIR_BACKEND) init -input=false -var-file=../stages/$(ENV).tfvars
	@$(CHDIR_BACKEND) plan -input=false -var-file=../stages/$(ENV).tfvars

tf-apply-backend: validate-env
	@echo "$(BLUE)🚀 Provisioning remote state backend...$(NC)"
	@$(CHDIR_BACKEND) init -input=false -upgrade
	@$(CHDIR_BACKEND) apply -input=false -var-file=../stages/$(ENV).tfvars -auto-approve
	@echo "$(GREEN)✅ Backend provisioned — now run: make tf-init ENV=$(ENV)$(NC)"

# ============================================================================
# Terraform Application
# ============================================================================

tf-init:
	@$(CHDIR) init -input=false -upgrade

ensure-workspace: tf-init
	@$(CHDIR) workspace select $(ENV) 2>/dev/null || $(CHDIR) workspace new $(ENV)

workspaces:
	@$(CHDIR) workspace list

current-workspace:
	@$(CHDIR) workspace show

tf-plan: ensure-workspace validate-env
	@$(CHDIR) plan -input=false -var-file=../stages/$(ENV).tfvars

tf-apply: ensure-workspace validate-env
	@$(CHDIR) apply -input=false -var-file=../stages/$(ENV).tfvars -auto-approve
	@echo "$(GREEN)✅ Applied$(NC)"

tf-destroy: ensure-workspace validate-env
	@$(CHDIR) destroy -input=false -var-file=../stages/$(ENV).tfvars

outputs: ensure-workspace
	@$(CHDIR) output

show-resources:
	@$(CHDIR) state list || true

drift: ensure-workspace validate-env
	@echo "$(BLUE)🔍 Checking drift for $(ENV)...$(NC)"
	@$(CHDIR) plan -input=false -var-file=../stages/$(ENV).tfvars -detailed-exitcode -no-color || \
		{ code=$$?; if [ $$code -eq 2 ]; then \
			echo "$(YELLOW)⚠️  Drift detected$(NC)"; exit 2; \
		else exit $$code; fi; }
	@echo "$(GREEN)✅ No drift$(NC)"

# ============================================================================
# Terraform Code Quality
# ============================================================================

fmt:
	@cd $(INFRA_DIR) && $(TF) fmt -recursive
	@echo "$(GREEN)✅ Formatted$(NC)"

validate:
	@$(CHDIR) init -backend=false > /dev/null 2>&1 || true
	@$(CHDIR) validate
	@echo "$(GREEN)✅ Valid$(NC)"
