# 🎬 Blog & Video Platform

Modern full-stack blog and video platform with AI-powered features built with Next.js, React Native, and Node.js.

---

## 🌟 Features

### Core Features
- 📝 **Rich Text Blog** - Create and publish blog posts with advanced editor
- 🎥 **Video Streaming** - Upload and stream videos with HLS adaptive quality (1080p-360p)
- 🔍 **AI-Powered Search** - Semantic search and RAG (Retrieval Augmented Generation)
- 💬 **Comments System** - Engage with 1-level reply support
- ⭐ **Engagement** - Like, bookmark, and organize content
- 📊 **Analytics** - Comprehensive stats and insights

### Platforms
- 🌐 **Web** - Next.js 14 with Material UI (Pastel theme)
- 📱 **Mobile** - React Native with Expo (iOS & Android)
- 🔌 **API** - RESTful API with TypeScript

---

## 🏗️ Architecture

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend Web** | Next.js 14, TypeScript, Material UI |
| **Frontend Mobile** | React Native, Expo SDK 50+ |
| **Backend API** | Node.js 20, Express/Fastify, TypeScript |
| **Database** | PostgreSQL 16 + pgvector |
| **Cache & Queue** | Redis 7 + BullMQ |
| **Storage** | MinIO (S3-compatible) |
| **AI/ML** | Ollama (Llama 3, nomic-embed-text) |
| **Video Processing** | FFmpeg (HLS encoding) |
| **Monorepo** | Nx Workspace |

### Infrastructure
- **Docker** - Containerized services
- **Docker Compose** - Multi-service orchestration
- **CI/CD** - GitHub Actions (coming soon)

---

## 📁 Project Structure

```
blog-video-platform/
├── apps/                       # Applications
│   ├── api-server/            # Node.js backend
│   ├── video-worker/          # FFmpeg worker
│   ├── web-client/            # Next.js web app (Tuần 4+)
│   └── mobile-app/            # React Native (Tuần 7+)
│
├── libs/                       # Shared libraries
│   ├── shared/                # Cross-platform code
│   └── backend/               # Backend shared code
│
├── docker/                     # Docker infrastructure
│   ├── docker-compose.yml     # Services definition
│   ├── .env.example           # Environment template
│   └── configs/               # Service configs
│
├── database/                   # Database files
│   ├── migrations/            # SQL migrations
│   └── seeds/                 # Seed data
│
├── docs/                       # Documentation
│   ├── 00-planning/           # Project planning
│   ├── 01-database/           # Database design
│   └── 02-infrastructure/     # Infrastructure docs
│
└── scripts/                    # Utility scripts
```

---

## 🚀 Quick Start

### Prerequisites
- Docker 24.0+
- Docker Compose 2.0+
- Node.js 20 LTS
- 8GB+ RAM, 20GB+ disk space

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd blog-video-platform
```

2. **Setup environment**
```bash
# Copy environment template
cp docker/.env.example docker/.env

# Edit passwords (IMPORTANT!)
nano docker/.env
```

3. **Start infrastructure**
```bash
# Using Makefile
make start

# Or using docker compose directly
docker compose -f docker/docker-compose.yml up -d
```

4. **Verify services**
```bash
make status
make health
```

5. **Access services**
- MinIO Console: http://localhost:9001
- API Server: http://localhost:3000 (when implemented)
- pgAdmin: http://localhost:5050 (with `make tools`)

---

## 💻 Development

### Available Commands

```bash
# Docker Management
make start          # Start all services
make stop           # Stop all services
make restart        # Restart services
make status         # Show service status
make logs           # View all logs
make health         # Check service health

# Database
make migrate        # Run migrations
make backup-db      # Create backup
make shell-postgres # PostgreSQL shell

# Development
make shell-api      # API server shell
make shell-redis    # Redis CLI
make build          # Build all images
make clean          # Remove everything
```

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| API Server | 3000 | RESTful API |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & Queue |
| MinIO API | 9000 | Object storage |
| MinIO Console | 9001 | Web UI |
| Ollama | 11434 | Local LLM |

---

## 📚 Documentation

- [Docker Setup Guide](docs/02-infrastructure/DOCKER_SETUP_GUIDE.md)
- [Architecture Diagrams](docs/02-infrastructure/DOCKER_ARCHITECTURE_DIAGRAM.md)
- [Database Design](docs/01-database/)
- [Project Planning](docs/00-planning/)

---

## 🗺️ Development Roadmap

### ✅ Completed

**Week 0: Planning & Design**
- Business analysis (Actors, Use Cases, Business Rules)
- Database design (16 tables, ERD, migrations)

**Week 1 - Day 1-2: Infrastructure**
- Docker Compose setup (8 services)
- PostgreSQL + pgvector
- Redis + BullMQ
- MinIO storage
- Ollama AI/LLM
- Comprehensive documentation

### 🚧 In Progress

**Week 1 - Day 3-4: Nx Monorepo** (Current)
- Nx Workspace setup
- Domain entities with Zod
- Repository interfaces
- Unit tests

### 📋 Upcoming

**Week 1-3: Foundation** (Weeks 1-3)
- Authentication with Supabase
- Core Use Cases
- API endpoints
- CI/CD pipeline

**Week 4-6: Core Features**
- Next.js web frontend
- Video infrastructure
- State management with TanStack Query

**Week 7-9: Mobile**
- React Native app
- Video upload & playback
- Advanced features

**Week 10-12: AI & Polish**
- Semantic search
- RAG implementation
- Testing & optimization
- Deployment

---

## 🔒 Security

- ⚠️ **Change all default passwords** in `docker/.env`
- ⚠️ **Generate secure JWT secrets** (min 32 characters)
- ⚠️ **Review security checklist** before production deployment

See [Security Checklist](docs/02-infrastructure/WEEK1_DAY1-2_SUMMARY.md#security-checklist) for details.

---

## 🤝 Contributing

This is a personal project following a structured 12-week development plan. Contributions, suggestions, and feedback are welcome!

---

## 📄 License

[Add your license here]

---

## 👤 Author

**Duy** - Full-stack Developer

---

## 🙏 Acknowledgments

- Anthropic Claude for development assistance
- Open source community
- [Add your acknowledgments]

---

**Current Status**: Week 1 - Day 2 Complete ✅ | Next: Nx Monorepo Setup

Last Updated: November 28, 2025
