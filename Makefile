# Fleet Command - Infrastructure & Deployment Makefile

.PHONY: help \
        bootstrap configure-server deploy health-check \
        cloudflare-lockdown dokploy-list-github-providers \
        logs rollback fill-env \
        tf-init-backend tf-plan-backend tf-apply-backend \
        tf-init tf-plan tf-apply tf-destroy \
        ensure-workspace workspaces current-workspace \
        drift outputs show-resources fmt validate \
        status destroy \
        build-local run-local ecr-login build-push \
        secrets-init secrets-check secrets-validate secrets-rotate-hcloud secrets-rotate-cloudflare secrets-show

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
	@echo "$(YELLOW)Secrets (one-time per environment):$(NC)"
	@echo "  make secrets-init ENV=dev      Store Hetzner + Cloudflare tokens in Secrets Manager"
	@echo "  make secrets-check ENV=dev     Check if tokens are populated"
	@echo "  make secrets-show ENV=dev      Show masked token values"
	@echo "  make secrets-validate ENV=dev  Validate tokens against live APIs"
	@echo "  make secrets-rotate-hcloud ENV=dev    Rotate Hetzner token"
	@echo "  make secrets-rotate-cloudflare ENV=dev  Rotate Cloudflare token"
	@echo ""
	@echo "$(YELLOW)Bootstrap & Provisioning:$(NC)"
	@echo "  make bootstrap ENV=dev         Provision infrastructure (VPS, DNS, ECR, Cognito, S3)"
	@echo "  make configure-server ENV=dev  Install Docker + Dokploy via Ansible"
	@echo "  make cloudflare-lockdown ENV=dev  Restrict 80/443 to Cloudflare IPs only"
	@echo ""
	@echo "$(YELLOW)Docker — Local Build & Run:$(NC)"
	@echo "  make build-local               Build prod images locally (no push)"
	@echo "  make run-local                 Run prod stack locally on localhost"
	@echo "  make ecr-login ENV=dev         Authenticate Docker to ECR"
	@echo "  make build-push ENV=dev        Build and push images to ECR"
	@echo ""
	@echo "$(YELLOW)Deployment:$(NC)"
	@echo "  make fill-env ENV=dev          Populate .env from Terraform outputs + prompts"
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
# Secrets Management
# ============================================================================

secrets-init: validate-env
	@echo "$(BLUE)🔐 Initializing provider tokens for $(ENV)...$(NC)"
	@bash $(SCRIPTS_DIR)/secrets-init.sh $(ENV) --check-or-prompt

secrets-check: validate-env
	@bash $(SCRIPTS_DIR)/secrets-init.sh $(ENV) --check

secrets-show: validate-env
	@bash $(SCRIPTS_DIR)/secrets-manage.sh $(ENV) --show

secrets-validate: validate-env
	@bash $(SCRIPTS_DIR)/secrets-manage.sh $(ENV) --validate

secrets-rotate-hcloud: validate-env
	@bash $(SCRIPTS_DIR)/secrets-manage.sh $(ENV) --rotate-hcloud

secrets-rotate-cloudflare: validate-env
	@bash $(SCRIPTS_DIR)/secrets-manage.sh $(ENV) --rotate-cloudflare

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

fill-env: ensure-workspace
	@echo "$(BLUE)📝 Filling $(ENV_FILE) from Terraform + prompts...$(NC)"
	@bash $(SCRIPTS_DIR)/fill-env.sh $(ENV)

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

# ============================================================================
# Docker — Local Build & Run
# ============================================================================

# Per-environment VITE_API_URL (baked into UI image at build time)
VITE_API_URL_local = http://localhost:3001
VITE_API_URL_dev   = https://api.dev.hussledispatch.online
VITE_API_URL      ?= $(or $(VITE_API_URL_$(ENV)),http://localhost:3001)

build-local:
	@echo "$(BLUE)🏗️  Building prod images locally...$(NC)"
	ECR_REGISTRY=fleet-local IMAGE_TAG=local VITE_API_URL=http://localhost:3001 \
	docker compose -f docker-compose-build.yml \
		--profile api --profile ui \
		build
	@echo "$(GREEN)✅ Images built: fleet-local/fleet-{api,ui}:local$(NC)"

run-local:
	@echo "$(BLUE)▶️  Starting prod stack locally...$(NC)"
	docker compose \
		-f docker-compose-prod.yml \
		-f docker-compose.local.yml \
		--env-file .env.local \
		up --build

ecr-login: ensure-workspace
	@echo "$(BLUE)🔐 Authenticating Docker to ECR ($(ENV))...$(NC)"
	@ECR_URL=$$($(CHDIR) output -raw ecr_registry_url 2>/dev/null); \
	if [ -z "$$ECR_URL" ]; then \
		echo "$(RED)❌ Could not get ECR URL. Run: make outputs ENV=$(ENV)$(NC)"; \
		exit 1; \
	fi; \
	aws ecr get-login-password --region us-east-1 | \
		docker login --username AWS --password-stdin $$ECR_URL && \
	echo "$(GREEN)✅ Authenticated to $$ECR_URL$(NC)"

build-push: ensure-workspace ecr-login validate-env
	@echo "$(BLUE)🚀 Building and pushing images to ECR ($(ENV))...$(NC)"
	@ECR_REGISTRY=$$($(CHDIR) output -raw ecr_registry_url 2>/dev/null); \
	IMAGE_TAG=$(ENV)-$$(git rev-parse --short HEAD); \
	echo "$(BLUE)  Registry : $$ECR_REGISTRY$(NC)"; \
	echo "$(BLUE)  Tag      : $$IMAGE_TAG$(NC)"; \
	echo "$(BLUE)  VITE_URL : $(VITE_API_URL)$(NC)"; \
	DOCKER_DEFAULT_PLATFORM=linux/amd64 \
	ECR_REGISTRY="$$ECR_REGISTRY" \
	IMAGE_TAG="$$IMAGE_TAG" \
	VITE_API_URL="$(VITE_API_URL)" \
	docker compose -f docker-compose-build.yml \
		--profile api --profile ui --profile rabbitmq \
		build && \
	DOCKER_DEFAULT_PLATFORM=linux/amd64 \
	ECR_REGISTRY="$$ECR_REGISTRY" \
	IMAGE_TAG="$$IMAGE_TAG" \
	docker compose -f docker-compose-build.yml \
		--profile api --profile ui --profile rabbitmq \
		push && \
	echo "$(GREEN)✅ Pushed: $$ECR_REGISTRY/fleet-{api,ui,rabbitmq}:$$IMAGE_TAG$(NC)"; \
	ENV_FILE="$(ENV_DIR)/.env"; \
	if [ -f "$$ENV_FILE" ]; then \
		if grep -q "^IMAGE_TAG=" "$$ENV_FILE"; then \
			sed -i.bak "s|^IMAGE_TAG=.*|IMAGE_TAG=$$IMAGE_TAG|" "$$ENV_FILE" && rm -f "$$ENV_FILE.bak"; \
		else \
			echo "IMAGE_TAG=$$IMAGE_TAG" >> "$$ENV_FILE"; \
		fi; \
		echo "$(GREEN)  → IMAGE_TAG=$$IMAGE_TAG written to $$ENV_FILE$(NC)"; \
	else \
		echo "$(YELLOW)  ⚠ $$ENV_FILE not found — run make fill-env ENV=$(ENV) first$(NC)"; \
	fi
