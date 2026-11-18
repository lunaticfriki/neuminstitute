SHELL := /bin/bash

.DEFAULT_GOAL := help

.PHONY: help install dev dev-web build build-web \
        test typecheck arch-test check clean

help: ## Show this help
	@echo "Usage: make <target>"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install all workspace dependencies
	pnpm install

dev: ## Run the web dev server
	pnpm dev:web

dev-web: ## Run only the Angular app dev server
	pnpm dev:web

build: ## Build all apps
	pnpm build

build-web: ## Build only the Angular app
	pnpm --filter @neuminstitute/web build

test: ## Run unit/integration tests across the workspace
	pnpm test

typecheck: ## Type-check all apps
	pnpm typecheck

arch-test: ## Run dependency-cruiser layer boundary checks
	pnpm arch-test

check: typecheck test arch-test ## Run typecheck + test + arch-test (what pre-push runs)

clean: ## Remove build output and installed dependencies across the workspace
	rm -rf node_modules apps/*/node_modules apps/*/dist apps/*/.angular
