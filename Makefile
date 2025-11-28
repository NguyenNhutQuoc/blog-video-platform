# =====================================================
# Makefile - Blog & Video Platform
# Quick commands for Docker management
# =====================================================

.PHONY: help start stop restart status logs clean build test

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

## help: Show this help message
help:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║         Makefile - Blog & Video Platform                  ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@echo ""
	@grep -E '^## ' Makefile | sed 's/## /  $(GREEN)/' | sed 's/:/$(NC):/'
	@echo ""

## start: Start all Docker services
start:
	@echo "$(BLUE)Starting all services...$(NC)"
	@docker compose -f docker/docker-compose.yml up -d
	@echo "$(GREEN)✓ Services started$(NC)"

## stop: Stop all Docker services
stop:
	@echo "$(BLUE)Stopping all services...$(NC)"
	@docker compose -f docker/docker-compose.yml down
	@echo "$(GREEN)✓ Services stopped$(NC)"

## restart: Restart all Docker services
restart:
	@echo "$(BLUE)Restarting all services...$(NC)"
	@docker compose -f docker/docker-compose.yml restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

## status: Show status of all services
status:
	@echo "$(BLUE)Service Status:$(NC)"
	@docker compose -f docker/docker-compose.yml ps

## logs: Show logs for all services (Ctrl+C to exit)
logs:
	@docker compose -f docker/docker-compose.yml logs -f

## logs-api: Show logs for API server
logs-api:
	@docker compose -f docker/docker-compose.yml logs -f api-server

## logs-worker: Show logs for video worker
logs-worker:
	@docker compose -f docker/docker-compose.yml logs -f video-worker

## logs-postgres: Show logs for PostgreSQL
logs-postgres:
	@docker compose -f docker/docker-compose.yml logs -f postgres

## build: Build Docker images
build:
	@echo "$(BLUE)Building Docker images...$(NC)"
	@docker compose -f docker/docker-compose.yml build
	@echo "$(GREEN)✓ Build completed$(NC)"

## build-api: Build API server image
build-api:
	@echo "$(BLUE)Building API server...$(NC)"
	@docker compose -f docker/docker-compose.yml build api-server
	@echo "$(GREEN)✓ API server built$(NC)"

## build-worker: Build video worker image
build-worker:
	@echo "$(BLUE)Building video worker...$(NC)"
	@docker compose -f docker/docker-compose.yml build video-worker
	@echo "$(GREEN)✓ Video worker built$(NC)"

## clean: Remove all containers, volumes, and images
clean:
	@echo "$(YELLOW)⚠ This will remove all containers, volumes, and data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose -f docker/docker-compose.yml down -v; \
		docker system prune -af; \
		echo "$(GREEN)✓ Cleanup completed$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

## ps: Show running containers
ps:
	@docker compose -f docker/docker-compose.yml ps

## top: Show running processes in containers
top:
	@docker compose -f docker/docker-compose.yml top

## stats: Show container resource usage
stats:
	@docker stats

## shell-api: Open shell in API server container
shell-api:
	@docker compose -f docker/docker-compose.yml exec api-server sh

## shell-worker: Open shell in video worker container
shell-worker:
	@docker compose -f docker/docker-compose.yml exec video-worker sh

## shell-postgres: Open PostgreSQL shell
shell-postgres:
	@docker compose -f docker/docker-compose.yml exec postgres psql -U blog_user -d blog_platform

## shell-redis: Open Redis CLI
shell-redis:
	@docker compose -f docker/docker-compose.yml exec redis redis-cli -a redis_password_change_in_production

## backup-db: Create database backup
backup-db:
	@mkdir -p backups
	@docker compose -f docker/docker-compose.yml exec -T postgres pg_dump -U blog_user blog_platform | gzip > backups/db-backup-$$(date +%Y%m%d-%H%M%S).sql.gz
	@echo "$(GREEN)✓ Database backup created$(NC)"

## migrate: Run database migrations
migrate:
	@echo "$(BLUE)Running database migrations...$(NC)"
	@docker compose -f docker/docker-compose.yml exec -T postgres psql -U blog_user -d blog_platform < database/migrations/001_initial_schema.sql
	@echo "$(GREEN)✓ Migrations completed$(NC)"

## seed: Seed database with sample data (if available)
seed:
	@echo "$(BLUE)Seeding database...$(NC)"
	@echo "$(YELLOW)Seed script not yet implemented$(NC)"

## test: Run tests (when implemented)
test:
	@echo "$(BLUE)Running tests...$(NC)"
	@echo "$(YELLOW)Tests not yet implemented$(NC)"

## health: Check health of all services
health:
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "PostgreSQL:" && docker compose -f docker/docker-compose.yml exec postgres pg_isready -U blog_user && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(YELLOW)✗ Unhealthy$(NC)"
	@echo "Redis:" && docker compose -f docker/docker-compose.yml exec redis redis-cli -a redis_password_change_in_production PING && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(YELLOW)✗ Unhealthy$(NC)"
	@echo "MinIO:" && curl -sf http://localhost:9000/minio/health/live > /dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(YELLOW)✗ Unhealthy$(NC)"
	@echo "Ollama:" && curl -sf http://localhost:11434/api/tags > /dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(YELLOW)✗ Unhealthy$(NC)"

## setup: Initial setup (copy .env, start services)
setup:
	@echo "$(BLUE)Initial setup...$(NC)"
	@if [ ! -f docker/.env ]; then \
		cp docker/.env.example docker/.env; \
		echo "$(YELLOW)⚠ .env file created. Please update passwords before starting.$(NC)"; \
		read -p "Press Enter to continue..."; \
	fi
	@$(MAKE) start
	@echo "$(GREEN)✓ Setup completed$(NC)"

## install: Install dependencies (placeholder)
install:
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

## dev: Start development environment
dev: start
	@echo "$(GREEN)✓ Development environment ready$(NC)"
	@echo "$(BLUE)Services available at:$(NC)"
	@echo "  - API Server: http://localhost:3000"
	@echo "  - MinIO Console: http://localhost:9001"
	@echo "  - pgAdmin: http://localhost:5050 (with --profile tools)"

## prod: Build and start production environment
prod:
	@echo "$(BLUE)Building production images...$(NC)"
	@docker compose -f docker/docker-compose.yml build
	@docker compose -f docker/docker-compose.yml up -d
	@echo "$(GREEN)✓ Production environment started$(NC)"

## tools: Start optional tools (pgAdmin, Redis Commander)
tools:
	@echo "$(BLUE)Starting optional tools...$(NC)"
	@docker compose -f docker/docker-compose.yml --profile tools up -d
	@echo "$(GREEN)✓ Tools started$(NC)"
	@echo "  - pgAdmin: http://localhost:5050"
	@echo "  - Redis Commander: http://localhost:8081"

## pull: Pull latest images
pull:
	@echo "$(BLUE)Pulling latest images...$(NC)"
	@docker compose -f docker/docker-compose.yml pull
	@echo "$(GREEN)✓ Images pulled$(NC)"
