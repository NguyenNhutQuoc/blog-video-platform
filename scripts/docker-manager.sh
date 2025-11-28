#!/bin/bash

# =====================================================
# Docker Management Script - Blog & Video Platform
# Usage: ./docker-manager.sh [command]
# =====================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         Docker Manager - Blog & Video Platform            ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found"
        print_info "Copying .env.example to .env"
        cp .env.example .env
        print_warning "Please update passwords in .env before starting services"
        read -p "Press Enter to continue or Ctrl+C to exit..."
    else
        print_success ".env file found"
    fi
}

# Start all services
start_all() {
    print_header
    print_info "Starting all services..."
    
    check_docker
    check_env
    
    docker compose up -d
    
    echo ""
    print_success "All services started successfully"
    print_info "Run './docker-manager.sh status' to check service health"
}

# Stop all services
stop_all() {
    print_header
    print_info "Stopping all services..."
    
    docker compose down
    
    print_success "All services stopped"
}

# Restart all services
restart_all() {
    print_header
    print_info "Restarting all services..."
    
    docker compose restart
    
    print_success "All services restarted"
}

# Show status
show_status() {
    print_header
    print_info "Service Status:"
    echo ""
    
    docker compose ps
    
    echo ""
    print_info "Health Checks:"
    
    # Check PostgreSQL
    if docker compose exec -T postgres pg_isready -U blog_user &> /dev/null; then
        print_success "PostgreSQL: Healthy"
    else
        print_error "PostgreSQL: Unhealthy"
    fi
    
    # Check Redis
    if docker compose exec -T redis redis-cli -a redis_password_change_in_production PING &> /dev/null; then
        print_success "Redis: Healthy"
    else
        print_error "Redis: Unhealthy"
    fi
    
    # Check MinIO
    if curl -f http://localhost:9000/minio/health/live &> /dev/null; then
        print_success "MinIO: Healthy"
    else
        print_error "MinIO: Unhealthy"
    fi
    
    # Check Ollama
    if curl -f http://localhost:11434/api/tags &> /dev/null; then
        print_success "Ollama: Healthy"
    else
        print_error "Ollama: Unhealthy"
    fi
    
    # Check API Server
    if curl -f http://localhost:3000/health &> /dev/null; then
        print_success "API Server: Healthy"
    else
        print_warning "API Server: Not running or unhealthy"
    fi
}

# Show logs
show_logs() {
    print_header
    
    if [ -z "$1" ]; then
        print_info "Showing logs for all services (Ctrl+C to exit)..."
        docker compose logs -f
    else
        print_info "Showing logs for $1 (Ctrl+C to exit)..."
        docker compose logs -f "$1"
    fi
}

# Clean up everything
clean_all() {
    print_header
    print_warning "This will remove all containers, volumes, and data!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Cancelled"
        exit 0
    fi
    
    print_info "Stopping and removing all services..."
    docker compose down -v
    
    print_info "Removing unused Docker resources..."
    docker system prune -af
    
    print_success "Cleanup completed"
}

# Database backup
backup_db() {
    print_header
    
    BACKUP_DIR="./backups"
    BACKUP_FILE="db-backup-$(date +%Y%m%d-%H%M%S).sql.gz"
    
    mkdir -p "$BACKUP_DIR"
    
    print_info "Creating database backup..."
    
    docker compose exec -T postgres pg_dump -U blog_user blog_platform | gzip > "$BACKUP_DIR/$BACKUP_FILE"
    
    print_success "Backup created: $BACKUP_DIR/$BACKUP_FILE"
}

# Database restore
restore_db() {
    print_header
    
    if [ -z "$1" ]; then
        print_error "Usage: ./docker-manager.sh restore-db <backup-file>"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        print_error "Backup file not found: $1"
        exit 1
    fi
    
    print_warning "This will overwrite the current database!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Cancelled"
        exit 0
    fi
    
    print_info "Restoring database from $1..."
    
    gunzip -c "$1" | docker compose exec -T postgres psql -U blog_user -d blog_platform
    
    print_success "Database restored successfully"
}

# Rebuild specific service
rebuild_service() {
    print_header
    
    if [ -z "$1" ]; then
        print_error "Usage: ./docker-manager.sh rebuild <service-name>"
        exit 1
    fi
    
    print_info "Rebuilding $1..."
    
    docker compose build --no-cache "$1"
    docker compose up -d "$1"
    
    print_success "$1 rebuilt and restarted"
}

# Run database migrations
run_migrations() {
    print_header
    print_info "Running database migrations..."
    
    # Check if migration file exists
    if [ ! -f "001_initial_schema.sql" ]; then
        print_error "Migration file not found: 001_initial_schema.sql"
        exit 1
    fi
    
    docker compose exec -T postgres psql -U blog_user -d blog_platform < 001_initial_schema.sql
    
    print_success "Migrations completed"
}

# Show help
show_help() {
    print_header
    echo "Usage: ./docker-manager.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start              Start all services"
    echo "  stop               Stop all services"
    echo "  restart            Restart all services"
    echo "  status             Show service status and health"
    echo "  logs [service]     Show logs (all or specific service)"
    echo "  clean              Remove all containers and volumes"
    echo "  backup-db          Create database backup"
    echo "  restore-db <file>  Restore database from backup"
    echo "  rebuild <service>  Rebuild specific service"
    echo "  migrate            Run database migrations"
    echo "  shell <service>    Open shell in service container"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-manager.sh start"
    echo "  ./docker-manager.sh logs api-server"
    echo "  ./docker-manager.sh rebuild api-server"
    echo "  ./docker-manager.sh backup-db"
    echo ""
}

# Open shell in container
open_shell() {
    print_header
    
    if [ -z "$1" ]; then
        print_error "Usage: ./docker-manager.sh shell <service-name>"
        exit 1
    fi
    
    print_info "Opening shell in $1..."
    docker compose exec "$1" sh
}

# Main script
main() {
    case "${1:-help}" in
        start)
            start_all
            ;;
        stop)
            stop_all
            ;;
        restart)
            restart_all
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        clean)
            clean_all
            ;;
        backup-db)
            backup_db
            ;;
        restore-db)
            restore_db "$2"
            ;;
        rebuild)
            rebuild_service "$2"
            ;;
        migrate)
            run_migrations
            ;;
        shell)
            open_shell "$2"
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Run main
main "$@"
