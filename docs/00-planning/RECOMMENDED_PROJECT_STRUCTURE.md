# 📁 RECOMMENDED PROJECT STRUCTURE

Blog & Video Platform - Production-Ready Structure

## ✅ PLACEMENT SUMMARY

| File | Current | Recommended | Reason |
|------|---------|-------------|---------|
| docker-compose.yml | `/` | `/docker/` | Better organization |
| .env.example | `/` | `/docker/` | Keep with compose |
| .dockerignore | `/` | `/` root | Applies to all builds |
| Dockerfiles | `/apps/*/` | ✅ Same | Correct location |
| docker-manager.sh | `/` | `/scripts/` | Utility folder |
| Makefile | `/` | ✅ `/` root | Easy access |
| 001_initial_schema.sql | `/` | `/database/migrations/` | DB files together |
| Documentation | `/` | `/docs/02-infrastructure/` | Organized docs |
| PDFs | `/` | `/docs/00-planning/`, `/docs/01-database/` | Organized |

## 📂 FULL STRUCTURE

```
blog-video-platform/
│
├── apps/                           # Applications
│   ├── api-server/
│   │   ├── src/
│   │   ├── Dockerfile             ✅ Keep here
│   │   └── package.json
│   └── video-worker/
│       ├── src/
│       ├── Dockerfile             ✅ Keep here
│       └── package.json
│
├── libs/                           # Shared code (Tuần 1)
│   ├── shared/
│   └── backend/
│
├── docker/                         ← MOVE HERE
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── .env (gitignored)
│   └── configs/
│       ├── postgres/
│       └── redis/
│
├── database/                       ← MOVE HERE
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seeds/
│
├── scripts/                        ← MOVE HERE
│   └── docker-manager.sh
│
├── docs/                           ← MOVE HERE
│   ├── 00-planning/
│   │   ├── Tuan_0_Phan_Tich_Nghiep_Vu.pdf
│   │   └── Ke_Hoach_12_Tuan.pdf
│   ├── 01-database/
│   │   └── Ngay_4-7_Thiet_Ke_Database.pdf
│   └── 02-infrastructure/
│       ├── DOCKER_SETUP_GUIDE.md
│       ├── DOCKER_ARCHITECTURE_DIAGRAM.md
│       └── WEEK1_DAY1-2_SUMMARY.md
│
├── .dockerignore                  ✅ Keep at root
├── Makefile                       ✅ Keep at root
├── COMPLETION_CHECKLIST.md        ✅ Keep at root
├── README.md
├── package.json
└── nx.json (Tuần 1)
```

## 🔄 MIGRATION COMMANDS

```bash
# Create directories
mkdir -p docker/configs/{postgres,redis}
mkdir -p database/{migrations,seeds}
mkdir -p scripts
mkdir -p docs/{00-planning,01-database,02-infrastructure}

# Move Docker files
mv docker-compose.yml docker/
mv .env.example docker/

# Move database
mv 001_initial_schema.sql database/migrations/

# Move scripts
mv docker-manager.sh scripts/
chmod +x scripts/docker-manager.sh

# Move docs
mv DOCKER_SETUP_GUIDE.md docs/02-infrastructure/
mv DOCKER_ARCHITECTURE_DIAGRAM.md docs/02-infrastructure/
mv WEEK1_DAY1-2_SUMMARY.md docs/02-infrastructure/
mv Tuan_0_Phan_Tich_Nghiep_Vu.pdf docs/00-planning/
mv Ngay_4-7_Thiet_Ke_Database.pdf docs/01-database/
```

## 📝 UPDATE MAKEFILE

```makefile
# Option 1: Change directory
start:
	@cd docker && docker compose up -d

# Option 2: Use -f flag
start:
	@docker compose -f docker/docker-compose.yml up -d
```

## 🎯 BENEFITS

1. **Organized** - Files grouped by purpose
2. **Scalable** - Easy to add services
3. **Professional** - Industry standard
4. **Maintainable** - Easy to find things
5. **Nx Compatible** - Follows conventions
