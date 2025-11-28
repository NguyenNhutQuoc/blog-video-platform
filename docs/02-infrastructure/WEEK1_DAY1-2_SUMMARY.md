# 📦 TUẦN 1 - NGÀY 1-2: DOCKER INFRASTRUCTURE SETUP

**Blog & Video Platform - Infrastructure Foundation**

---

## ✅ HOÀN THÀNH

### Ngày 1-2: Docker Infrastructure Setup

Đã hoàn thành setup toàn bộ infrastructure với Docker Compose bao gồm:

#### 🐳 Core Services (6 services)

1. **PostgreSQL 16 with pgvector**
   - Port: 5432
   - Volume: postgres_data (persistent)
   - Extensions: uuid-ossp, pgvector, pg_trgm
   - Auto-migration: Runs 001_initial_schema.sql on startup
   - Health check: pg_isready
   - 16 tables created automatically

2. **Redis 7**
   - Port: 6379
   - Volume: redis_data (persistent)
   - AOF persistence enabled
   - Password protected
   - Purpose: Cache + BullMQ job queue
   - Health check: PING

3. **MinIO (S3-compatible)**
   - API Port: 9000
   - Console Port: 9001
   - Volume: minio_data (persistent)
   - Auto-created buckets: videos, images, thumbnails
   - Public read access configured
   - Health check: /minio/health/live

4. **Ollama (Local LLM)**
   - Port: 11434
   - Volume: ollama_data (persistent)
   - Auto-pulled models: nomic-embed-text, llama3
   - Purpose: AI embeddings & RAG
   - Health check: /api/tags

5. **API Server (Node.js 20)**
   - Port: 3000
   - Multi-stage Dockerfile (deps → builder → production)
   - TypeScript compiled
   - Non-root user (nodejs:1001)
   - Health endpoint: /health
   - Hot reload ready for development

6. **Video Worker (FFmpeg)**
   - Background worker (no exposed port)
   - BullMQ consumer
   - FFmpeg pre-installed
   - Temp volume for processing
   - 4 quality outputs: 1080p, 720p, 480p, 360p

#### 🛠️ Optional Tools (2 services)

7. **pgAdmin** (Profile: tools)
   - Port: 5050
   - Web-based PostgreSQL management
   - Start with: `docker compose --profile tools up -d pgadmin`

8. **Redis Commander** (Profile: tools)
   - Port: 8081
   - Web-based Redis management
   - Start with: `docker compose --profile tools up -d redis-commander`

---

## 📁 FILES CREATED

### Configuration Files

1. **docker-compose.yml** (370 lines)
   - Complete service definitions
   - Health checks configured
   - Networks and volumes defined
   - Environment variables
   - Dependencies managed

2. **.env.example** (200+ lines)
   - All environment variables documented
   - Sections: Database, Redis, MinIO, Ollama, JWT, Session, File limits, Video processing, Rate limiting, Search, Business rules, Email, Logging, Monitoring, Feature flags
   - Copy to .env and update passwords

3. **.dockerignore** (80+ lines)
   - Optimized build context
   - Excludes: node_modules, .git, tests, docs, logs, etc.

### Dockerfiles

4. **apps/api-server/Dockerfile** (Multi-stage)
   - Base: node:20-alpine
   - Stages: deps, builder, production
   - Non-root user
   - Health check included
   - Optimized layer caching

5. **apps/video-worker/Dockerfile** (Multi-stage)
   - Base: node:20-alpine + FFmpeg
   - Temp directory for video processing
   - Same multi-stage pattern as API

### Documentation

6. **DOCKER_SETUP_GUIDE.md** (500+ lines)
   - Complete setup instructions
   - Prerequisites and system requirements
   - Quick start guide
   - Service overview
   - Configuration details
   - Usage commands
   - Health checks
   - Troubleshooting (10+ common issues)
   - Production considerations
   - Backup strategies

### Utility Scripts

7. **docker-manager.sh** (Bash script)
   - Commands: start, stop, restart, status, logs, clean, backup-db, restore-db, rebuild, migrate, shell, help
   - Color-coded output
   - Error handling
   - Health checks
   - Database backup/restore
   - Executable: chmod +x

8. **Makefile** (100+ lines)
   - Quick commands: make start, make stop, make logs, make status
   - Service-specific logs: make logs-api, make logs-worker
   - Shell access: make shell-api, make shell-postgres, make shell-redis
   - Database operations: make backup-db, make migrate
   - Health checks: make health
   - Setup: make setup, make dev, make tools

---

## 🚀 QUICK START

### Setup & Start

```bash
# Copy environment file
cp .env.example .env

# Edit passwords (IMPORTANT!)
nano .env

# Start all services
make start
# or
docker compose up -d

# Check status
make status
# or
docker compose ps

# View logs
make logs
```

### Verify Services

```bash
# Using make
make health

# Or manually
curl http://localhost:3000/health    # API (when implemented)
curl http://localhost:9000           # MinIO
curl http://localhost:11434/api/tags # Ollama

# Database
docker compose exec postgres psql -U blog_user -d blog_platform -c "\dt"
# Should show 16 tables

# Redis
docker compose exec redis redis-cli -a redis_password_change_in_production PING
# Should return PONG
```

### Access Web Interfaces

- **MinIO Console**: http://localhost:9001
  - User: minio_admin
  - Pass: minio_password_change_in_production

- **pgAdmin** (optional): http://localhost:5050
  - Email: admin@blogplatform.local
  - Pass: admin_password_change_in_production

- **Redis Commander** (optional): http://localhost:8081

---

## 📊 ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Network                        │
│                         (blog-network)                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │  Redis   │  │  MinIO   │  │  Ollama  │   │
│  │   :5432  │  │  :6379   │  │ :9000/01 │  │  :11434  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │          │
│       └─────────────┴─────────────┴─────────────┘          │
│                        │                                    │
│              ┌─────────┴──────────┐                        │
│              │                    │                        │
│         ┌────▼─────┐       ┌─────▼──────┐                 │
│         │   API    │       │   Video    │                 │
│         │  Server  │       │   Worker   │                 │
│         │  :3000   │       │  (FFmpeg)  │                 │
│         └──────────┘       └────────────┘                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔒 SECURITY CHECKLIST

Before deploying to production:

- [ ] Change all passwords in .env
- [ ] Generate secure JWT_SECRET (min 32 chars)
- [ ] Enable PostgreSQL SSL
- [ ] Enable Redis TLS
- [ ] Enable MinIO HTTPS
- [ ] Configure firewall rules
- [ ] Set resource limits
- [ ] Enable log rotation
- [ ] Setup monitoring
- [ ] Configure backups

---

## 📈 RESOURCE REQUIREMENTS

### Minimum (Development)
- **RAM**: 8GB
- **CPU**: 4 cores
- **Disk**: 20GB

### Recommended (Development)
- **RAM**: 16GB
- **CPU**: 8 cores
- **Disk**: 50GB SSD

### Production
- **RAM**: 32GB+
- **CPU**: 16 cores+
- **Disk**: 200GB+ SSD
- **Network**: 1 Gbps+

---

## 🧪 TESTING INFRASTRUCTURE

### Test Database Connection
```bash
docker compose exec postgres psql -U blog_user -d blog_platform -c "SELECT COUNT(*) FROM users;"
```

### Test Redis Connection
```bash
docker compose exec redis redis-cli -a redis_password_change_in_production SET test "Hello World"
docker compose exec redis redis-cli -a redis_password_change_in_production GET test
```

### Test MinIO Upload
```bash
# Create test file
echo "Test upload" > test.txt

# Upload with mc client
docker compose exec minio-client mc cp /tmp/test.txt myminio/videos/

# List files
docker compose exec minio-client mc ls myminio/videos/
```

### Test Ollama
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3",
  "prompt": "Hello, world!"
}'
```

---

## 📋 TROUBLESHOOTING

### Port Conflicts
```bash
# Find process using port
lsof -i :5432
lsof -i :6379
lsof -i :9000

# Kill process or change port in docker-compose.yml
```

### Permission Issues
```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./volumes
```

### Service Won't Start
```bash
# Check logs
docker compose logs <service-name>

# Restart service
docker compose restart <service-name>

# Rebuild service
docker compose build --no-cache <service-name>
docker compose up -d <service-name>
```

### Database Connection Issues
```bash
# Check if container is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Test connection
docker compose exec postgres pg_isready -U blog_user
```

### Out of Memory
```bash
# Check Docker memory settings
docker info | grep Memory

# Increase in Docker Desktop: Settings → Resources → Memory

# Or prune unused resources
docker system prune -a
```

---

## 🎯 NEXT STEPS

After infrastructure is ready:

1. ✅ Verify all 6 core services are healthy
2. ✅ Check PostgreSQL has 16 tables
3. ✅ Verify MinIO buckets exist (videos, images, thumbnails)
4. ✅ Test Ollama API responds
5. ✅ Verify Redis connection
6. ➡️ **Proceed to Tuần 1 - Ngày 3-4: Nx Monorepo Setup**

---

## 📚 USEFUL COMMANDS

### Daily Operations
```bash
make start          # Start all services
make stop           # Stop all services
make restart        # Restart all services
make status         # Check service status
make logs           # View all logs
make logs-api       # View API logs only
make health         # Check service health
```

### Development
```bash
make shell-api      # Shell in API container
make shell-postgres # PostgreSQL shell
make shell-redis    # Redis CLI
make build          # Rebuild all images
make build-api      # Rebuild API only
```

### Database
```bash
make backup-db      # Create backup
make migrate        # Run migrations
```

### Maintenance
```bash
make clean          # Remove everything (⚠️ deletes data)
make pull           # Pull latest images
make tools          # Start pgAdmin & Redis Commander
```

---

## 📊 SERVICE HEALTH ENDPOINTS

| Service    | Endpoint                                    | Expected Response |
|------------|---------------------------------------------|-------------------|
| PostgreSQL | `pg_isready -U blog_user`                   | accepting connections |
| Redis      | `redis-cli PING`                            | PONG              |
| MinIO      | `http://localhost:9000/minio/health/live`   | 200 OK            |
| Ollama     | `http://localhost:11434/api/tags`           | JSON with models  |
| API Server | `http://localhost:3000/health`              | 200 OK (when implemented) |

---

## 🔍 MONITORING

### Real-time Stats
```bash
docker stats
```

### Disk Usage
```bash
docker system df
```

### Volume Sizes
```bash
docker volume ls
docker volume inspect blog-postgres-data
```

### Network Info
```bash
docker network ls
docker network inspect blog-network
```

---

## 📖 ADDITIONAL RESOURCES

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- PostgreSQL Docker: https://hub.docker.com/_/postgres
- Redis Docker: https://hub.docker.com/_/redis
- MinIO Docs: https://min.io/docs/
- Ollama Docs: https://github.com/ollama/ollama

---

## ✨ HIGHLIGHTS

**What Makes This Infrastructure Special:**

1. **Production-Ready**: Multi-stage Dockerfiles, health checks, non-root users
2. **Developer-Friendly**: Hot reload, easy commands, comprehensive docs
3. **AI-Ready**: Ollama with auto-pulled models, vector DB support
4. **Complete Stack**: Database, cache, storage, LLM, API, worker
5. **Well-Documented**: 500+ lines of documentation, troubleshooting guide
6. **Automated**: Auto-migrations, auto-bucket creation, auto-model pulling
7. **Secure**: Password protected, isolated network, minimal attack surface
8. **Scalable**: Easy to add services, horizontal scaling ready

---

**Status**: ✅ **WEEK 1 - DAY 1-2 COMPLETE**

Next: [Tuần 1 - Ngày 3-4: Nx Monorepo Setup](../week1-day3-4/)
