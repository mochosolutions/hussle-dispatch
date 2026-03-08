# Mocho Solutions - Unified Makefile
# Multi-Environment Infrastructure & Deployment Management
# Version: 2.0 - Consolidated from 3 Makefiles

.PHONY: help bootstrap deploy destroy status logs rollback \
        tf-init-backend tf-plan-backend tf-apply-backend \
        tf-init tf-plan tf-apply tf-destroy ensure-workspace workspaces current-workspace \
        configure-server dokploy-ansible cloudflare-lockdown dokploy-list-github-providers \
        secrets-sync sync-images \
        infra-plan infra-apply infra-destroy \
        drift outputs show-resources fmt validate \
        dev-deploy prod-deploy check

# ============================================================================
# Configuration & Variables
# ============================================================================

SHELL := /bin/bash
ENV ?= dev

# Directories (all relative to project root)
INFRA_DIR = hussle-app-dispatch-infra
TERRAFORM_DIR = $(INFRA_DIR)/terraform/application
SCRIPTS_DIR = $(INFRA_DIR)/scripts
ENV_DIR = $(INFRA_DIR)/environments/$(ENV)
STAGES_DIR = $(INFRA_DIR)/terraform/stages

# Python - use venv if available, otherwise system python3
PYTHON = $(shell if [ -f "$(SCRIPTS_DIR)/venv/bin/python3" ]; then echo "$(SCRIPTS_DIR)/venv/bin/python3"; else echo "python3"; fi)

# Extract project name from tfvars (single source of truth)
PROJECT = $(shell grep '^project' $(STAGES_DIR)/$(ENV).tfvars 2>/dev/null | awk -F'=' '{print $$2}' | tr -d ' "' || echo "mochosolutions")

# Files
TFVARS_FILE = $(INFRA_DIR)/terraform/stages/$(ENV).tfvars
CONFIG_FILE = $(INFRA_DIR)/environments/$(ENV)/config.yaml
ENV_FILE = $(ENV_DIR)/.env

# Terraform
TF = terraform
WORKSPACE = $(ENV)
CHDIR = $(TF) -chdir=$(TERRAFORM_DIR)
CHDIR_BACKEND = $(TF) -chdir=$(INFRA_DIR)/terraform/backend

# Deployment
DRY_RUN ?= false
SERVICE ?= api
VERSION ?= previous
LINES ?= 100
FOLLOW ?= false

# Colors for output
BLUE = \033[0;34m
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m

# ============================================================================
# Help Menu
# ============================================================================

help:
	@echo "$(BLUE)╔═══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║     Hussle Dispatch - Infrastructure Management             ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Usage: make <target> ENV=<environment>$(NC)"
	@echo ""
	@echo "$(YELLOW)Environments:$(NC)"
	@echo "  dev      - Development"
	@echo ""
	@echo "$(YELLOW)Main Workflow Commands:$(NC)"
	@echo "  make bootstrap ENV=dev     - Provision infrastructure (not yet implemented)"
	@echo "  make deploy ENV=dev        - Deploy application (not yet implemented)"
	@echo "  make sync-images ENV=dev   - Sync images to S3 (not yet implemented)"
	@echo "  make status ENV=dev        - Check environment health"
	@echo "  make destroy ENV=dev       - Teardown environment"
	@echo ""
	@echo "$(YELLOW)Terraform Operations:$(NC)"
	@echo "  make tf-plan-backend       - Plan backend changes (S3 + DynamoDB)"
	@echo "  make tf-apply-backend      - Provision S3 + DynamoDB backend (run once first)"
	@echo "  make tf-init               - Initialize Terraform"
	@echo "  make tf-plan ENV=dev       - Plan infrastructure changes"
	@echo "  make tf-apply ENV=prod     - Apply infrastructure changes"
	@echo "  make tf-destroy ENV=dev    - Destroy infrastructure"
	@echo "  make drift ENV=prod        - Check for infrastructure drift"
	@echo "  make outputs ENV=prod      - Show Terraform outputs"
	@echo "  make fmt                   - Format Terraform code"
	@echo "  make validate              - Validate Terraform code"
	@echo ""
	@echo "$(YELLOW)Server Configuration (Ansible):$(NC)"
	@echo "  make configure-server              - Configure server with Ansible"
	@echo "  make dokploy-ansible               - Install Dokploy on VPS"
	@echo "  make cloudflare-lockdown           - Configure Cloudflare firewall"
	@echo "  make dokploy-list-github-providers - List GitHub providers in Dokploy"
	@echo ""
	@echo "$(YELLOW)Deployment & Operations:$(NC)"
	@echo "  make logs ENV=prod         - View application logs"
	@echo "  make rollback ENV=prod     - Rollback to previous version"
	@echo "  make health-check ENV=prod - Run health checks"
	@echo "  make api-logs ENV=prod     - View API logs"
	@echo "  make ui-logs ENV=prod      - View UI logs"
	@echo ""
	@echo "$(YELLOW)Configuration & Secrets:$(NC)"
	@echo "  make secrets-init ENV=dev         - Initialize provider tokens (interactive)"
	@echo "  make secrets-check ENV=dev        - Check if tokens configured"
	@echo "  make secrets-list ENV=dev         - List secrets (metadata only)"
	@echo "  make secrets-show ENV=dev         - Show secret values (masked)"
	@echo "  make secrets-validate ENV=dev     - Validate all tokens via API"
	@echo "  make secrets-rotate-hcloud ENV=dev - Rotate Hetzner Cloud token"
	@echo "  make secrets-rotate-cloudflare ENV=dev - Rotate Cloudflare token"
	@echo ""
	@echo "$(YELLOW)Quick Commands:$(NC)"
	@echo "  make dev-deploy            - Quick deploy to dev"
	@echo "  make prod-deploy           - Quick deploy to production"
	@echo "  make check ENV=dev         - Quick status check"
	@echo ""
	@echo "$(YELLOW)Current Settings:$(NC)"
	@echo "  ENV:            $(ENV)"
	@echo "  PROJECT:        $(PROJECT)"
	@echo "  TERRAFORM_DIR:  $(TERRAFORM_DIR)"
	@echo "  WORKSPACE:      $(WORKSPACE)"
	@echo ""

# ============================================================================
# Validation Helpers
# ============================================================================

validate-env:
	@if [ ! -f "$(TFVARS_FILE)" ]; then \
		echo "$(RED)❌ Environment '$(ENV)' not found: $(TFVARS_FILE) missing$(NC)"; \
		echo "$(YELLOW)   Available: dev$(NC)"; \
		exit 1; \
	fi

# ============================================================================
# Main Workflow Commands
# ============================================================================

# Bootstrap entire environment from scratch (3-layer process)
bootstrap: validate-env
	@echo "$(YELLOW)⚠️  bootstrap not yet implemented for this project$(NC)"
	@echo "$(YELLOW)   Requires: $(SCRIPTS_DIR)/bootstrap_application.sh$(NC)"
	@exit 1

# Deploy application (includes image sync)
deploy: validate-env
	@echo "$(YELLOW)⚠️  deploy not yet implemented for this project$(NC)"
	@echo "$(YELLOW)   Requires: $(SCRIPTS_DIR)/dokploy_deploy.py$(NC)"
	@exit 1

# Sync images only (useful for quick updates)
sync-images: validate-env
	@echo "$(YELLOW)⚠️  sync-images not yet implemented for this project$(NC)"
	@echo "$(YELLOW)   Requires: $(SCRIPTS_DIR)/sync_images_to_s3.sh$(NC)"
	@exit 1

# Check environment status
status: validate-env
	@echo "$(BLUE)📊 $(ENV) Environment Status$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(YELLOW)Workspace:$(NC)"
	@$(CHDIR) workspace show || true
	@echo ""
	@echo "$(YELLOW)Outputs:$(NC)"
	@$(CHDIR) output || true
	@echo ""
	@echo "$(YELLOW)Resources:$(NC)"
	@$(CHDIR) state list || echo "No resources in state"
	@echo ""
	@echo "$(YELLOW)Health Checks:$(NC)"
	@if [ -f "$(SCRIPTS_DIR)/health_check.py" ]; then \
		cd $(SCRIPTS_DIR) && $(PYTHON) health_check.py --env $(ENV); \
	else \
		echo "$(YELLOW)⚠️  Health check script not found$(NC)"; \
	fi

# Destroy environment
destroy: validate-env
	@echo "$(RED)⚠️  Destroying $(ENV) environment...$(NC)"
	@read -p "Are you sure? Type '$(ENV)' to confirm: " confirm; \
	if [ "$$confirm" = "$(ENV)" ]; then \
		$(MAKE) tf-destroy; \
		echo "$(GREEN)✅ $(ENV) destroyed$(NC)"; \
	else \
		echo "$(YELLOW)❌ Cancelled$(NC)"; \
		exit 1; \
	fi

# ============================================================================
# Terraform Operations
# ============================================================================

# Bootstrap remote state backend (run once before any other tf- commands)
tf-init-backend:
	@echo "$(BLUE)⚙️  Initializing Terraform backend module...$(NC)"
	@$(CHDIR_BACKEND) init -input=false -upgrade

tf-plan-backend:
	@echo "$(BLUE)📋 Planning backend changes (S3 + DynamoDB)...$(NC)"
	@echo "$(BLUE)📋 Planning infrastructure changes for $(ENV)...$(NC)"
	@if [ ! -f "$(TFVARS_FILE)" ]; then \
		echo "$(RED)❌ Error: $(TFVARS_FILE) not found$(NC)"; \
		exit 1; \
	fi
	@$(CHDIR_BACKEND) init -input=false -input=false -var-file=../stages/$(ENV).tfvars
	@$(CHDIR_BACKEND) plan -input=false -var-file=../stages/$(ENV).tfvars -auto-approve

tf-apply-backend:
	@echo "$(BLUE)🚀 Provisioning remote state backend (S3 + DynamoDB)...$(NC)"
	@echo "$(YELLOW)   Run this once before tf-init. State is stored locally.$(NC)"
	@$(CHDIR_BACKEND) init -input=false -upgrade
	@$(CHDIR_BACKEND) apply -input=false -var-file=../stages/$(ENV).tfvars -auto-approve
	@echo "$(GREEN)✅ Backend provisioned — you can now run: make tf-init ENV=dev$(NC)"

tf-init:
	@echo "$(BLUE)⚙️  Initializing Terraform...$(NC)"
	@$(CHDIR) init -input=false -upgrade

ensure-workspace: tf-init
	@echo "$(BLUE)🔧 Ensuring workspace '$(WORKSPACE)' exists...$(NC)"
	@$(CHDIR) workspace select $(WORKSPACE) >/dev/null 2>&1 || \
		$(CHDIR) workspace new $(WORKSPACE)

workspaces:
	@$(CHDIR) workspace list

current-workspace:
	@$(CHDIR) workspace show

tf-plan: ensure-workspace
	@echo "$(BLUE)📋 Planning infrastructure changes for $(ENV)...$(NC)"
	@if [ ! -f "$(TFVARS_FILE)" ]; then \
		echo "$(RED)❌ Error: $(TFVARS_FILE) not found$(NC)"; \
		exit 1; \
	fi
	@$(CHDIR) plan -input=false -var-file=../stages/$(ENV).tfvars

tf-apply: ensure-workspace
	@echo "$(BLUE)🚀 Applying infrastructure changes for $(ENV)...$(NC)"
	@if [ ! -f "$(TFVARS_FILE)" ]; then \
		echo "$(RED)❌ Error: $(TFVARS_FILE) not found$(NC)"; \
		exit 1; \
	fi
	@$(CHDIR) apply -input=false -var-file=../stages/$(ENV).tfvars -auto-approve
	@echo "$(GREEN)✅ Infrastructure changes applied$(NC)"

tf-destroy: ensure-workspace
	@echo "$(RED)💥 Destroying infrastructure for $(ENV)...$(NC)"
	@if [ ! -f "$(TFVARS_FILE)" ]; then \
		echo "$(RED)❌ Error: $(TFVARS_FILE) not found$(NC)"; \
		exit 1; \
	fi
	@$(CHDIR) destroy -input=false -var-file=../stages/$(ENV).tfvars

outputs:
	@$(CHDIR) output

show-resources:
	@$(CHDIR) state list || true

# Check for infrastructure drift (CI-friendly)
drift: ensure-workspace
	@echo "$(BLUE)🔍 Checking for drift in $(ENV)...$(NC)"
	@$(CHDIR) plan -input=false -var-file=../stages/$(ENV).tfvars -detailed-exitcode -no-color || \
		{ code=$$?; \
		if [ $$code -eq 2 ]; then \
			echo "$(YELLOW)⚠️  Drift detected (exit code 2)$(NC)"; \
			exit 2; \
		else \
			exit $$code; \
		fi; }
	@echo "$(GREEN)✅ No drift detected$(NC)"

# ============================================================================
# Terraform Code Quality
# ============================================================================

fmt:
	@echo "$(BLUE)🎨 Formatting Terraform code...$(NC)"
	@cd $(INFRA_DIR) && $(TF) fmt -recursive
	@echo "$(GREEN)✅ Code formatted$(NC)"

validate:
	@echo "$(BLUE)🔍 Validating Terraform code...$(NC)"
	@$(CHDIR) init -backend=false > /dev/null 2>&1 || true
	@$(CHDIR) validate
	@echo "$(GREEN)✅ Code validated$(NC)"

# ============================================================================
# Server Configuration (Ansible)
# ============================================================================

# configure-server:
# 	@echo "$(BLUE)⚙️  Configuring server with Ansible...$(NC)"
# 	@SERVER_IP=$$($(CHDIR) output -raw vps_public_ip 2>/dev/null || $(CHDIR) output -raw vps_ipv4_address); \
# 	if [ -z "$$SERVER_IP" ]; then \
# 		echo "$(RED)❌ Error: Could not get VPS IP from Terraform outputs$(NC)"; \
# 		exit 1; \
# 	fi; \
# 	echo "$(BLUE)Server IP: $$SERVER_IP$(NC)"; \
# 	cd $(INFRA_DIR) && \
# 	ANSIBLE_CONFIG=ansible/ansible.cfg \
# 		ansible-playbook ansible/playbooks/dokploy.yml \
# 		-i "$$SERVER_IP," \
# 		--user=root \
# 		--become
# 	@echo "$(GREEN)✅ Server configured$(NC)"

# dokploy-ansible:
# 	@echo "$(BLUE)🐳 Installing Dokploy on VPS...$(NC)"
# 	@SERVER_IP=$$($(CHDIR) output -raw vps_public_ip 2>/dev/null || $(CHDIR) output -raw vps_ipv4_address); \
# 	if [ -z "$$SERVER_IP" ]; then \
# 		echo "$(RED)❌ Error: Could not get VPS IP from Terraform outputs$(NC)"; \
# 		exit 1; \
# 	fi; \
# 	echo "$(BLUE)Server IP: $$SERVER_IP$(NC)"; \
# 	cd $(INFRA_DIR) && \
# 	ANSIBLE_CONFIG=ansible/ansible.cfg \
# 		ansible-playbook ansible/playbooks/dokploy.yml \
# 		-i "$$SERVER_IP," \
# 		--user=root \
# 		--become --become-method=sudo --become-user=root

# cloudflare-lockdown:
# 	@echo "$(BLUE)🔒 Configuring Cloudflare firewall rules...$(NC)"
# 	@{ \
# 		set -euo pipefail; \
# 		echo "$(BLUE)Workspace: $$($(CHDIR) workspace show)$(NC)"; \
# 		SERVER_IP="$$($(CHDIR) output -raw vps_public_ip)"; \
# 		if [ -z "$$SERVER_IP" ]; then \
# 			echo "$(RED)❌ Error: Terraform output 'vps_public_ip' is empty$(NC)" >&2; \
# 			exit 1; \
# 		fi; \
# 		echo "$(BLUE)Server IP: $$SERVER_IP$(NC)"; \
# 		cd $(INFRA_DIR) && \
# 		ANSIBLE_CONFIG=ansible/ansible.cfg \
# 			ansible-playbook ansible/playbooks/cloudflare_lockdown.yml \
# 			-i "$$SERVER_IP," \
# 			-e role_debug=true -vv \
# 			--user=root --become --become-method=sudo --become-user=root; \
# 	}
# 	@echo "$(GREEN)✅ Cloudflare firewall configured$(NC)"

# dokploy-list-github-providers: validate-env
# 	@echo "$(BLUE)📋 Fetching GitHub providers from Dokploy...$(NC)"
# 	@if [ ! -f "$(ENV_FILE)" ]; then \
# 		echo "$(RED)❌ Error: $(ENV_FILE) not found$(NC)"; \
# 		echo "$(YELLOW)   Make sure DOKPLOY_API_TOKEN is set in your environment file$(NC)"; \
# 		exit 1; \
# 	fi
# 	@if [ -f "$(SCRIPTS_DIR)/dokploy_deploy.py" ]; then \
# 		cd $(SCRIPTS_DIR) && \
# 		./dokploy_deploy.py \
# 			--config ../environments/$(ENV)/config.yaml \
# 			--base-config ../environments/base/config.yaml \
# 			--env-file ../environments/$(ENV)/.env \
# 			--list-github-providers; \
# 	else \
# 		echo "$(RED)❌ Error: dokploy_deploy.py not found$(NC)"; \
# 		exit 1; \
# 	fi

# # ============================================================================
# # Deployment Operations
# # ============================================================================

# logs: validate-env
# 	@echo "$(BLUE)📋 Fetching logs for $(ENV) - $(SERVICE)...$(NC)"
# 	@echo "$(YELLOW)ℹ️  Log viewing via Makefile not implemented$(NC)"
# 	@echo "$(YELLOW)   Use Dokploy UI or SSH to the server and run:$(NC)"
# 	@echo "$(YELLOW)   docker logs <container_name>$(NC)"

# rollback: validate-env
# 	@echo "$(YELLOW)⏪ Rolling back $(ENV) to $(VERSION)...$(NC)"
# 	@echo "$(YELLOW)ℹ️  Automated rollback not implemented$(NC)"
# 	@echo ""
# 	@echo "$(YELLOW)Manual rollback steps:$(NC)"
# 	@echo "  1. Find previous git commit hash or image tag"
# 	@echo "  2. Update Dokploy project to use that commit/tag"
# 	@echo "  3. Redeploy the application via Dokploy UI"
# 	@echo ""
# 	@echo "$(YELLOW)Alternative - redeploy previous ECR image:$(NC)"
# 	@echo "  make deploy ENV=$(ENV) IMAGE_TAG=sha-<previous-commit>"

# health-check: validate-env
# 	@echo "$(BLUE)🏥 Running health checks for $(ENV)...$(NC)"
# 	@if [ -f "$(SCRIPTS_DIR)/health_check.py" ]; then \
# 		cd $(SCRIPTS_DIR) && $(PYTHON) health_check.py --env $(ENV); \
# 	else \
# 		echo "$(YELLOW)⚠️  health_check.py not found$(NC)"; \
# 	fi

# api-logs:
# 	@$(MAKE) logs SERVICE=api

# ui-logs:
# 	@$(MAKE) logs SERVICE=ui

# follow-logs:
# 	@$(MAKE) logs FOLLOW=true

# # ============================================================================
# # Configuration & Secrets
# # ============================================================================

# # Initialize provider tokens (prompts for Hetzner/Cloudflare tokens)
# secrets-init: validate-env
# 	@echo "$(BLUE)🔐 Initializing provider tokens for $(ENV)...$(NC)"
# 	@cd $(SCRIPTS_DIR) && $(PYTHON) init_secrets.py --env $(ENV) --project $(PROJECT) --interactive

# # Check if provider tokens are configured
# secrets-check: validate-env
# 	@cd $(SCRIPTS_DIR) && $(PYTHON) init_secrets.py --env $(ENV) --project $(PROJECT) --check

# # List all secrets (metadata only)
# secrets-list: validate-env
# 	@cd $(SCRIPTS_DIR) && $(PYTHON) manage_secrets.py --env $(ENV) --project $(PROJECT) --list

# # Show secret values (masked)
# secrets-show: validate-env
# 	@cd $(SCRIPTS_DIR) && $(PYTHON) manage_secrets.py --env $(ENV) --project $(PROJECT) --show

# # Validate all tokens still work
# secrets-validate: validate-env
# 	@cd $(SCRIPTS_DIR) && $(PYTHON) manage_secrets.py --env $(ENV) --project $(PROJECT) --validate

# # Rotate Hetzner Cloud token
# secrets-rotate-hcloud: validate-env
# 	@cd $(SCRIPTS_DIR) && $(PYTHON) manage_secrets.py --env $(ENV) --project $(PROJECT) --rotate-hcloud

# # Rotate Cloudflare API token
# secrets-rotate-cloudflare: validate-env
# 	@cd $(SCRIPTS_DIR) && $(PYTHON) manage_secrets.py --env $(ENV) --project $(PROJECT) --rotate-cloudflare

# # secrets-sync: validate-env
# # 	@echo "$(BLUE)🔐 Syncing secrets for $(ENV)...$(NC)"
# # 	@if [ -f "$(SCRIPTS_DIR)/sync_secrets.py" ]; then \
# # 		$(PYTHON) $(SCRIPTS_DIR)/sync_secrets.py --env $(ENV); \
# # 		echo "$(GREEN)✅ Secrets synced$(NC)"; \
# # 	else \
# # 		echo "$(YELLOW)⚠️  Secrets sync not yet implemented$(NC)"; \
# # 	fi

# # ============================================================================
# # Infrastructure Management (Aliases)
# # ============================================================================

# infra-plan: tf-plan
# infra-apply: tf-apply
# infra-destroy: tf-destroy

# # ============================================================================
# # Quick Commands (Shortcuts)
# # ============================================================================

# dev-deploy:
# 	@$(MAKE) deploy ENV=dev

# prod-deploy:
# 	@$(MAKE) deploy ENV=prod

# check:
# 	@$(MAKE) status ENV=$(ENV)

# # ============================================================================
# # Local Production Testing
# # ============================================================================

# .PHONY: build-prod-local test-prod-local test-prod-local-d stop-prod-local clean-prod-local logs-prod-local

# build-prod-local: ## Build production images locally. Use SERVICE=api|ui|admin-ui|workers to build one.
# 	@echo "$(CYAN)==> Building production images locally...$(RESET)"
# 	@if [ ! -f .env.local ]; then \
# 		echo "$(RED)ERROR: .env.local not found. Please create it from .env.local.example$(RESET)"; \
# 		exit 1; \
# 	fi
# ifdef SERVICE
# 	docker compose -f docker-compose-build.yml \
# 		--env-file .env.local \
# 		--profile $(SERVICE) \
# 		build
# else
# 	docker compose -f docker-compose-build.yml \
# 		--env-file .env.local \
# 		--profile ui --profile api --profile admin-ui --profile workers \
# 		build
# endif
# 	@echo "$(GREEN)✓ Production images built successfully$(RESET)"

# test-prod-local: build-prod-local ## Build and run production stack locally with exposed ports (foreground)
# 	@echo "$(CYAN)==> Starting production stack locally for testing...$(RESET)"
# 	@echo "$(YELLOW)INFO: Services will be accessible at:$(RESET)"
# 	@echo "  - Marketing UI:  http://localhost:3000"
# 	@echo "  - Admin UI:      http://localhost:3002"
# 	@echo "  - API:           http://localhost:3001"
# 	@echo "  - PostgreSQL:    localhost:5432"
# 	@echo "  - Redis:         localhost:6379"
# 	@echo ""
# 	docker compose -f docker-compose-prod.yml -f docker-compose.local.yml \
# 		--env-file .env.local \
# 		--project-name mocho-prod-local \
# 		up

# test-prod-local-d: build-prod-local ## Build and run production stack locally in detached mode (background)
# 	@echo "$(CYAN)==> Starting production stack locally (detached)...$(RESET)"
# 	docker compose -f docker-compose-prod.yml -f docker-compose.local.yml \
# 		--env-file .env.local \
# 		--project-name mocho-prod-local \
# 		up -d
# 	@echo "$(GREEN)✓ Production stack started in background$(RESET)"
# 	@echo ""
# 	@echo "Access services at:"
# 	@echo "  - Marketing UI:  http://localhost:3000"
# 	@echo "  - Admin UI:      http://localhost:3002"
# 	@echo "  - API:           http://localhost:3001/api/health"
# 	@echo ""
# 	@echo "View logs: make logs-prod-local"
# 	@echo "Stop services: make stop-prod-local"

# stop-prod-local: ## Stop local production testing stack
# 	@echo "$(CYAN)==> Stopping local production stack...$(RESET)"
# 	docker compose -f docker-compose-prod.yml -f docker-compose.local.yml \
# 		--project-name mocho-prod-local \
# 		down
# 	@echo "$(GREEN)✓ Local production stack stopped$(RESET)"

# clean-prod-local: ## Stop and remove all containers, volumes for local production testing
# 	@echo "$(YELLOW)WARNING: This will remove all containers and volumes (database data will be lost)$(RESET)"
# 	@read -p "Are you sure? (yes/no): " confirm; \
# 	if [ "$$confirm" = "yes" ]; then \
# 		echo "$(CYAN)==> Cleaning up local production stack...$(RESET)"; \
# 		docker compose -f docker-compose-prod.yml -f docker-compose.local.yml \
# 			--project-name mocho-prod-local \
# 			down -v; \
# 		echo "$(GREEN)✓ Local production stack cleaned up$(RESET)"; \
# 	else \
# 		echo "$(YELLOW)Cleanup cancelled$(RESET)"; \
# 	fi

# logs-prod-local: ## Show logs from local production stack
# 	@echo "$(CYAN)==> Showing logs from local production stack...$(RESET)"
# 	docker compose -f docker-compose-prod.yml -f docker-compose.local.yml \
# 		--project-name mocho-prod-local \
# 		logs -f

# # ECR Image Building & Testing
# ECR_REGISTRY ?= 127168571259.dkr.ecr.us-east-1.amazonaws.com
# AWS_REGION ?= us-east-1

# # Auto-generate image tag from git commit (matches Jenkins pattern)
# GIT_SHA := $(shell git rev-parse --short HEAD)
# BUILD_TIMESTAMP := $(shell date +%Y%m%d-%H%M%S)
# AUTO_IMAGE_TAG := sha-$(GIT_SHA)-$(BUILD_TIMESTAMP)

# # Use AUTO_IMAGE_TAG if IMAGE_TAG not provided
# IMAGE_TAG ?= $(AUTO_IMAGE_TAG)

# # Service build flags (default all to true, match Jenkins pattern)
# BUILD_UI ?= true
# BUILD_API ?= true
# BUILD_ADMIN_UI ?= true
# BUILD_WORKERS ?= true

# .PHONY: ecr-login test-ecr-local test-ecr-local-d

# ecr-login: ## Login to AWS ECR
# 	@echo "$(CYAN)==> Logging into ECR...$(RESET)"
# 	aws ecr get-login-password --region $(AWS_REGION) | \
# 		docker login --username AWS --password-stdin $(ECR_REGISTRY)
# 	@echo "$(GREEN)✓ ECR login successful$(RESET)"

# build-ecr: ecr-login ## Build and push images to ECR (auto-generates IMAGE_TAG, use BUILD_UI/BUILD_API/BUILD_ADMIN_UI flags)
# 	@if [ ! -f ".env" ]; then \
# 		echo "$(RED)ERROR: .env not found$(RESET)"; \
# 		exit 1; \
# 	fi
# 	@echo "$(CYAN)==> Building images with tag: $(IMAGE_TAG)$(RESET)"
# 	@echo "    BUILD_UI=$(BUILD_UI) BUILD_API=$(BUILD_API) BUILD_ADMIN_UI=$(BUILD_ADMIN_UI) BUILD_WORKERS=$(BUILD_WORKERS)"
# ifeq ($(BUILD_UI),true)
# 	@echo "$(CYAN)==> Building UI image...$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile ui build
# endif
# ifeq ($(BUILD_API),true)
# 	@echo "$(CYAN)==> Building API image...$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) API_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile api build
# endif
# ifeq ($(BUILD_ADMIN_UI),true)
# 	@echo "$(CYAN)==> Building Admin UI image...$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) ADMIN_UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile admin-ui build
# endif
# ifeq ($(BUILD_WORKERS),true)
# 	@echo "$(CYAN)==> Building Workers image...$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) WORKERS_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile workers build
# endif
# 	@echo "$(CYAN)==> Pushing images to ECR...$(RESET)"
# ifeq ($(BUILD_UI),true)
# 	ECR_REGISTRY=$(ECR_REGISTRY) UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile ui push
# 	@echo "$(CYAN)==> Tagging UI as latest...$(RESET)"
# 	docker tag $(ECR_REGISTRY)/mochosolutions-ui:$(IMAGE_TAG) $(ECR_REGISTRY)/mochosolutions-ui:latest
# 	docker push $(ECR_REGISTRY)/mochosolutions-ui:latest
# endif
# ifeq ($(BUILD_API),true)
# 	ECR_REGISTRY=$(ECR_REGISTRY) API_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile api push
# 	@echo "$(CYAN)==> Tagging API as latest...$(RESET)"
# 	docker tag $(ECR_REGISTRY)/mochosolutions-api:$(IMAGE_TAG) $(ECR_REGISTRY)/mochosolutions-api:latest
# 	docker push $(ECR_REGISTRY)/mochosolutions-api:latest
# endif
# ifeq ($(BUILD_ADMIN_UI),true)
# 	ECR_REGISTRY=$(ECR_REGISTRY) ADMIN_UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile admin-ui push
# 	@echo "$(CYAN)==> Tagging Admin UI as latest...$(RESET)"
# 	docker tag $(ECR_REGISTRY)/mochosolutions-admin-ui:$(IMAGE_TAG) $(ECR_REGISTRY)/mochosolutions-admin-ui:latest
# 	docker push $(ECR_REGISTRY)/mochosolutions-admin-ui:latest
# endif
# ifeq ($(BUILD_WORKERS),true)
# 	ECR_REGISTRY=$(ECR_REGISTRY) WORKERS_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile workers push
# 	@echo "$(CYAN)==> Tagging Workers as latest...$(RESET)"
# 	docker tag $(ECR_REGISTRY)/mochosolutions-workers:$(IMAGE_TAG) $(ECR_REGISTRY)/mochosolutions-workers:latest
# 	docker push $(ECR_REGISTRY)/mochosolutions-workers:latest
# endif
# 	@echo "$(GREEN)✓ Images pushed to ECR with tag: $(IMAGE_TAG) (also tagged as latest)$(RESET)"

# build-ecr-ui: ecr-login ## Build and push UI image to ECR (auto-generates IMAGE_TAG)
# 	@if [ ! -f ".env" ]; then \
# 		echo "$(RED)ERROR: .env not found$(RESET)"; \
# 		exit 1; \
# 	fi
# 	@echo "$(CYAN)==> Building UI image with tag: $(IMAGE_TAG)$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile ui build
# 	@echo "$(CYAN)==> Pushing UI image to ECR...$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile ui push
# 	@echo "$(CYAN)==> Tagging UI as latest...$(RESET)"
# 	docker tag $(ECR_REGISTRY)/mochosolutions-ui:$(IMAGE_TAG) $(ECR_REGISTRY)/mochosolutions-ui:latest
# 	docker push $(ECR_REGISTRY)/mochosolutions-ui:latest
# 	@echo "$(GREEN)✓ UI pushed to ECR with tag: $(IMAGE_TAG) (also tagged as latest)$(RESET)"

# build-ecr-api: ecr-login ## Build and push API image to ECR (auto-generates IMAGE_TAG)
# 	@if [ ! -f ".env" ]; then \
# 		echo "$(RED)ERROR: .env not found$(RESET)"; \
# 		exit 1; \
# 	fi
# 	@echo "$(CYAN)==> Building API image with tag: $(IMAGE_TAG)$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) API_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile api build
# 	@echo "$(CYAN)==> Pushing API image to ECR...$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) API_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile api push
# 	@echo "$(CYAN)==> Tagging API as latest...$(RESET)"
# 	docker tag $(ECR_REGISTRY)/mochosolutions-api:$(IMAGE_TAG) $(ECR_REGISTRY)/mochosolutions-api:latest
# 	docker push $(ECR_REGISTRY)/mochosolutions-api:latest
# 	@echo "$(GREEN)✓ API pushed to ECR with tag: $(IMAGE_TAG) (also tagged as latest)$(RESET)"

# build-ecr-admin: ecr-login ## Build and push Admin UI image to ECR (auto-generates IMAGE_TAG)
# 	@if [ ! -f ".env" ]; then \
# 		echo "$(RED)ERROR: .env not found$(RESET)"; \
# 		exit 1; \
# 	fi
# 	@echo "$(CYAN)==> Building Admin UI image with tag: $(IMAGE_TAG)$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) ADMIN_UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile admin-ui build
# 	@echo "$(CYAN)==> Pushing Admin UI image to ECR...$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) ADMIN_UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile admin-ui push
# 	@echo "$(CYAN)==> Tagging Admin UI as latest...$(RESET)"
# 	docker tag $(ECR_REGISTRY)/mochosolutions-admin-ui:$(IMAGE_TAG) $(ECR_REGISTRY)/mochosolutions-admin-ui:latest
# 	docker push $(ECR_REGISTRY)/mochosolutions-admin-ui:latest
# 	@echo "$(GREEN)✓ Admin UI pushed to ECR with tag: $(IMAGE_TAG) (also tagged as latest)$(RESET)"

# build-ecr-workers: ecr-login ## Build and push Workers image to ECR (auto-generates IMAGE_TAG)
# 	@if [ ! -f ".env" ]; then \
# 		echo "$(RED)ERROR: .env not found$(RESET)"; \
# 		exit 1; \
# 	fi
# 	@echo "$(CYAN)==> Building Workers image with tag: $(IMAGE_TAG)$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) WORKERS_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile workers build
# 	@echo "$(CYAN)==> Pushing Workers image to ECR...$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) WORKERS_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-build.yml --env-file .env --profile workers push
# 	@echo "$(CYAN)==> Tagging Workers as latest...$(RESET)"
# 	docker tag $(ECR_REGISTRY)/mochosolutions-workers:$(IMAGE_TAG) $(ECR_REGISTRY)/mochosolutions-workers:latest
# 	docker push $(ECR_REGISTRY)/mochosolutions-workers:latest
# 	@echo "$(GREEN)✓ Workers pushed to ECR with tag: $(IMAGE_TAG) (also tagged as latest)$(RESET)"

# test-ecr-local: ecr-login ## Pull and run ECR images locally (requires IMAGE_TAG=sha-xxx)
# 	@if [ -z "$(IMAGE_TAG)" ]; then \
# 		echo "$(RED)ERROR: IMAGE_TAG is required. Usage: make test-ecr-local IMAGE_TAG=sha-xxx$(RESET)"; \
# 		exit 1; \
# 	fi
# 	@if [ ! -f .env.local ]; then \
# 		echo "$(RED)ERROR: .env.local not found$(RESET)"; \
# 		exit 1; \
# 	fi
# 	@echo "$(CYAN)==> Pulling ECR images with tag: $(IMAGE_TAG)$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) \
# 	UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	API_IMAGE_TAG=$(IMAGE_TAG) \
# 	ADMIN_UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	WORKERS_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-prod.yml -f docker-compose.local.yml \
# 		--env-file .env.local \
# 		--project-name mocho-prod-local \
# 		pull ui api admin-ui workers
# 	@echo "$(CYAN)==> Starting services...$(RESET)"
# 	@echo "$(YELLOW)INFO: Services will be accessible at:$(RESET)"
# 	@echo "  - Marketing UI:  http://localhost:3000"
# 	@echo "  - Admin UI:      http://localhost:3002"
# 	@echo "  - API:           http://localhost:3001"
# 	@echo ""
# 	ECR_REGISTRY=$(ECR_REGISTRY) \
# 	UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	API_IMAGE_TAG=$(IMAGE_TAG) \
# 	ADMIN_UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	WORKERS_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-prod.yml -f docker-compose.local.yml \
# 		--env-file .env.local \
# 		--project-name mocho-prod-local \
# 		up

# test-ecr-local-d: ecr-login ## Pull and run ECR images locally in background (requires IMAGE_TAG=sha-xxx)
# 	@if [ -z "$(IMAGE_TAG)" ]; then \
# 		echo "$(RED)ERROR: IMAGE_TAG is required. Usage: make test-ecr-local-d IMAGE_TAG=sha-xxx$(RESET)"; \
# 		exit 1; \
# 	fi
# 	@if [ ! -f .env.local ]; then \
# 		echo "$(RED)ERROR: .env.local not found$(RESET)"; \
# 		exit 1; \
# 	fi
# 	@echo "$(CYAN)==> Pulling ECR images with tag: $(IMAGE_TAG)$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) \
# 	UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	API_IMAGE_TAG=$(IMAGE_TAG) \
# 	ADMIN_UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	WORKERS_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-prod.yml -f docker-compose.local.yml \
# 		--env-file .env.local \
# 		--project-name mocho-prod-local \
# 		pull ui api admin-ui workers
# 	@echo "$(CYAN)==> Starting services (detached)...$(RESET)"
# 	ECR_REGISTRY=$(ECR_REGISTRY) \
# 	UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	API_IMAGE_TAG=$(IMAGE_TAG) \
# 	ADMIN_UI_IMAGE_TAG=$(IMAGE_TAG) \
# 	WORKERS_IMAGE_TAG=$(IMAGE_TAG) \
# 	docker compose -f docker-compose-prod.yml -f docker-compose.local.yml \
# 		--env-file .env.local \
# 		--project-name mocho-prod-local \
# 		up -d
# 	@echo "$(GREEN)✓ ECR images running in background$(RESET)"
# 	@echo ""
# 	@echo "Access services at:"
# 	@echo "  - Marketing UI:  http://localhost:3000"
# 	@echo "  - Admin UI:      http://localhost:3002"
# 	@echo "  - API:           http://localhost:3001/api/health"
# 	@echo ""
# 	@echo "View logs: make logs-prod-local"
# 	@echo "Stop services: make stop-prod-local"
