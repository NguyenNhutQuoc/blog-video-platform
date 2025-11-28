# 🐳 DOCKER INFRASTRUCTURE SETUP GUIDE

**Blog & Video Platform - Tuần 1: Infrastructure**

This guide covers the complete Docker infrastructure setup for the Blog & Video Platform project.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Services Overview](#services-overview)
4. [Configuration](#configuration)
5. [Usage Commands](#usage-commands)
6. [Health Checks](#health-checks)
7. [Troubleshooting](#troubleshooting)
8. [Production Considerations](#production-considerations)

---

## 🔧 Prerequisites

### Required Software:

- **Docker**: Version 24.0+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.0+ (included with Docker Desktop)
- **Git**: For cloning the repository

### System Requirements:

- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: 20GB free space
- **CPU**: 4 cores recommended (for video encoding)

### Verify Installation:

```bash
docker --version
# Docker version 24.0.0 or higher

docker compose version
# Docker Compose version v2.0.0 or higher
```

---

## 🚀 Quick Start

### 1. Clone Repository & Setup

```bash
# Clone the project
git clone <repository-url>
cd blog-video-platform

# Copy environment file
cp .env.example .env

# Edit .env and update passwords/secrets
nano .env
```

### 2. Start All Services

```bash
# Start infrastructure services
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

### 3. Verify Services

```bash
# PostgreSQL
docker compose exec postgres psql -U blog_user -d blog_platform -c "SELECT version();"

# Redis
docker compose exec redis redis-cli -a redis_password_change_in_production PING

# MinIO (should return buckets)
curl http://localhost:9000

# Ollama
curl http://localhost:11434/api/tags
```

### 4. Access Web Interfaces

- **MinIO Console**: http://localhost:9001

  - Username: `minio_admin`
  - Password: `minio_password_change_in_production`

- **pgAdmin** (optional): http://localhost:5050

  - Email: `admin@blogplatform.local`
  - Password: `admin_password_change_in_production`

- **Redis Commander** (optional): http://localhost:8081

---

## 📦 Services Overview

### Core Services (Always Running)

#### 1. **PostgreSQL 16 with pgvector**

- **Port**: 5432
- **Purpose**: Primary database with vector search support
- **Volume**: `postgres_data`
- **Extensions**: uuid-ossp, pgvector, pg_trgm
- **Auto-migration**: Runs `001_initial_schema.sql` on first start

#### 2. **Redis 7**

- **Port**: 6379
- **Purpose**: Cache + Job Queue (BullMQ)
- **Volume**: `redis_data`
- **Persistence**: AOF enabled

#### 3. **MinIO**

- **API Port**: 9000
- **Console Port**: 9001
- **Purpose**: S3-compatible object storage
- **Buckets**: videos, images, thumbnails (auto-created)
- **Volume**: `minio_data`

#### 4. **Ollama**

- **Port**: 11434
- **Purpose**: Local LLM for AI features
- **Models**: nomic-embed-text, llama3 (auto-pulled)
- **Volume**: `ollama_data`

#### 5. **API Server**

- **Port**: 3000
- **Purpose**: RESTful API backend
- **Tech**: Node.js 20 + TypeScript
- **Health**: http://localhost:3000/health

#### 6. **Video Worker**

- **Purpose**: FFmpeg video encoding (BullMQ consumer)
- **Tech**: Node.js 20 + FFmpeg + TypeScript
- **Temp Volume**: `/tmp/video-processing`

### Optional Services (profiles: tools)

#### 7. **pgAdmin**

```bash
docker compose --profile tools up -d pgadmin
```

#### 8. **Redis Commander**

```bash
docker compose --profile tools up -d redis-commander
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

**Critical Variables to Change:**

```env
# Database
DATABASE_PASSWORD=your_secure_password_here

# Redis
REDIS_PASSWORD=your_redis_password_here

# MinIO
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key

# JWT
JWT_SECRET=your_jwt_secret_min_32_characters_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Session
SESSION_SECRET=your_session_secret_here
```

### Docker Compose Profiles

**Default** (no profile):

```bash
docker compose up -d
```

Starts: postgres, redis, minio, ollama, api-server, video-worker

**With Tools**:

```bash
docker compose --profile tools up -d
```

Adds: pgadmin, redis-commander

### Volume Management

**List volumes:**

```bash
docker volume ls | grep blog-
```

**Inspect volume:**

```bash
docker volume inspect blog-postgres-data
```

**Backup volume:**

```bash
docker run --rm -v blog-postgres-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup-$(date +%Y%m%d).tar.gz /data
```

---

## 💻 Usage Commands

### Service Management

**Start all services:**

```bash
docker compose up -d
```

**Stop all services:**

```bash
docker compose down
```

**Restart specific service:**

```bash
docker compose restart api-server
```

**Stop and remove volumes:**

```bash
docker compose down -v  # ⚠️ Deletes all data!
```

### Logs

**View all logs:**

```bash
docker compose logs -f
```

**View specific service:**

```bash
docker compose logs -f api-server
docker compose logs -f video-worker
docker compose logs -f postgres
```

**Last 100 lines:**

```bash
docker compose logs --tail=100 api-server
```

### Executing Commands

**PostgreSQL:**

```bash
# Connect to psql
docker compose exec postgres psql -U blog_user -d blog_platform

# Run SQL file
docker compose exec -T postgres psql -U blog_user -d blog_platform < migration.sql

# Database dump
docker compose exec postgres pg_dump -U blog_user blog_platform > backup.sql
```

**Redis:**

```bash
# Connect to redis-cli
docker compose exec redis redis-cli -a redis_password_change_in_production

# Get all keys
docker compose exec redis redis-cli -a redis_password_change_in_production KEYS '*'

# Flush all data
docker compose exec redis redis-cli -a redis_password_change_in_production FLUSHALL
```

**MinIO:**

```bash
# Using MinIO Client (mc)
docker compose exec minio-client mc ls myminio

# List objects in bucket
docker compose exec minio-client mc ls myminio/videos
```

**API Server:**

```bash
# Shell access
docker compose exec api-server sh

# Run npm command
docker compose exec api-server npm run test
```

### Rebuilding Services

**Rebuild after code changes:**

```bash
docker compose build api-server
docker compose up -d api-server
```

**Force rebuild (no cache):**

```bash
docker compose build --no-cache api-server
```

**Rebuild all:**

```bash
docker compose build
docker compose up -d
```

---

## 🏥 Health Checks

All services have health checks configured. Check status:

```bash
docker compose ps
```

Output shows health status:

- `healthy`: Service is ready
- `starting`: Health check in progress
- `unhealthy`: Service has issues

**Manual health checks:**

```bash
# API Server
curl http://localhost:3000/health

# PostgreSQL
docker compose exec postgres pg_isready -U blog_user

# Redis
docker compose exec redis redis-cli -a redis_password_change_in_production PING

# MinIO
curl http://localhost:9000/minio/health/live

# Ollama
curl http://localhost:11434/api/tags
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Bind for localhost:5432 failed: port is already allocated`

**Solution**:

```bash
# Find process using port
lsof -i :5432

# Kill process or change port in docker-compose.yml
```

#### 2. Volume Permission Issues

**Error**: `Permission denied`

**Solution**:

```bash
# Fix permissions
sudo chown -R $USER:$USER ./volumes
```

#### 3. Out of Memory

**Error**: `Cannot allocate memory`

**Solution**:

```bash
# Increase Docker memory in Docker Desktop Settings
# Or prune unused resources:
docker system prune -a
```

#### 4. Database Connection Refused

**Error**: `connection refused`

**Solution**:

```bash
# Wait for health check
docker compose logs postgres

# Check if container is running
docker compose ps postgres

# Restart service
docker compose restart postgres
```

#### 5. MinIO Buckets Not Created

**Error**: Buckets don't exist

**Solution**:

```bash
# Re-run bucket creation
docker compose up -d minio-client

# Or create manually
docker compose exec minio-client mc mb myminio/videos
```

#### 6. Ollama Models Not Downloaded

**Error**: Model not found

**Solution**:

```bash
# Check ollama logs
docker compose logs ollama-puller

# Pull models manually
docker compose exec ollama ollama pull nomic-embed-text
docker compose exec ollama ollama pull llama3
```

### Debugging Commands

**Check resource usage:**

```bash
docker stats
```

**Inspect container:**

```bash
docker compose exec api-server sh
docker compose inspect api-server
```

**Network connectivity:**

```bash
# Test from one container to another
docker compose exec api-server ping postgres
docker compose exec api-server curl http://minio:9000
```

---

## 🚀 Production Considerations

### Security

1. **Change all default passwords** in `.env`
2. **Use secrets management** (Docker Swarm secrets, Kubernetes secrets)
3. **Enable SSL/TLS**:
   - PostgreSQL: SSL connections
   - Redis: TLS support
   - MinIO: HTTPS
4. **Restrict network access** with firewall rules
5. **Use non-root users** in containers (already configured)

### Performance

1. **Resource limits**:

```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

2. **Database tuning**:

```yaml
environment:
  POSTGRES_SHARED_BUFFERS: 2GB
  POSTGRES_EFFECTIVE_CACHE_SIZE: 6GB
  POSTGRES_MAX_CONNECTIONS: 200
```

3. **Redis tuning**:

```yaml
command: >
  redis-server
  --maxmemory 2gb
  --maxmemory-policy allkeys-lru
  --save ""
```

### Monitoring

1. **Prometheus + Grafana**:

```bash
# Add to docker-compose.yml
prometheus:
  image: prom/prometheus
  # ... configuration

grafana:
  image: grafana/grafana
  # ... configuration
```

2. **Log aggregation** with ELK stack
3. **APM tools**: New Relic, Datadog, Sentry

### Backup Strategy

**Automated backups**:

```bash
# Add cron job
0 2 * * * docker compose exec postgres pg_dump -U blog_user blog_platform | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

### High Availability

For production, consider:

- PostgreSQL replication (primary-replica)
- Redis Sentinel or Redis Cluster
- MinIO distributed mode
- Load balancer for API servers
- Container orchestration (Kubernetes)

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Redis Docker](https://hub.docker.com/_/redis)
- [MinIO Documentation](https://min.io/docs/)
- [Ollama Documentation](https://github.com/ollama/ollama)

---

## ✅ Next Steps

After Docker infrastructure is running:

1. ✅ Verify all services are healthy
2. ✅ Check database has 16 tables (from migration)
3. ✅ Verify MinIO buckets exist
4. ✅ Test Ollama API
5. ➡️ **Proceed to Tuần 1 - Ngày 3-4: Nx Monorepo Setup**

---

**Questions or Issues?**

- Check logs: `docker compose logs -f`
- Review this guide's [Troubleshooting](#troubleshooting) section
- Open an issue in the project repository
