# Campus Vibe 🎓

A production-grade cross-platform social media platform for South African university students.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Campus Vibe Platform                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Web App   │  │ Mobile App  │  │Admin Panel  │   Clients       │
│  │  (Next.js)  │  │   (Expo)    │  │  (Next.js)  │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                         │
│         └────────────────┼────────────────┘                         │
│                          │                                          │
│                    ┌─────▼─────┐                                    │
│                    │  NestJS   │                                    │
│                    │    API    │          Backend                   │
│                    │(REST+WS)  │                                    │
│                    └─────┬─────┘                                    │
│                          │                                          │
│    ┌──────────┬──────────┼──────────┬──────────┐                   │
│    │          │          │          │          │                   │
│  ┌─▼──┐   ┌──▼──┐   ┌───▼──┐   ┌──▼──┐   ┌──▼───┐               │
│  │Psql│   │Redis│   │MinIO │   │Open │   │Vector│   Data        │
│  │ DB │   │Cache│   │  S3  │   │Srch │   │  DB  │   Layer       │
│  └────┘   └─────┘   └──────┘   └─────┘   └──────┘               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Monorepo**: Turborepo
- **Frontend Web**: Next.js 14, TypeScript, Tailwind CSS
- **Mobile**: React Native (Expo), TypeScript
- **API**: NestJS (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Cache & Real-time**: Redis
- **Search**: OpenSearch / Elasticsearch
- **Vector DB**: Pinecone / Weaviate (adapter interface)
- **Messaging**: Socket.IO
- **Media Storage**: S3-compatible (MinIO for dev)
- **CI/CD**: GitHub Actions
- **Infrastructure**: Docker, Terraform, Kubernetes

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Docker and Docker Compose

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/campus-vibe.git
   cd campus-vibe
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start infrastructure services**
   ```bash
   docker-compose up -d
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

5. **Set up the database**
   ```bash
   cd packages/database
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

6. **Start development servers**
   ```bash
   # From root directory
   pnpm dev
   ```

   This will start:
   - Web app: http://localhost:3000
   - API: http://localhost:4000
   - API Docs (Swagger): http://localhost:4000/api/docs

### Running Individual Apps

```bash
# Web app only
pnpm --filter @campus-vibe/web dev

# API only
pnpm --filter @campus-vibe/api dev

# Mobile app
pnpm --filter @campus-vibe/mobile start
```

## Project Structure

```
campus-vibe/
├── apps/
│   ├── api/              # NestJS backend API
│   ├── web/              # Next.js web application
│   └── mobile/           # React Native (Expo) mobile app
├── packages/
│   ├── database/         # Prisma schema and database client
│   ├── shared/           # Shared types and utilities
│   ├── config/           # ESLint configurations
│   ├── tsconfig/         # TypeScript configurations
│   ├── ui/               # Shared UI components
│   └── opportunities-scraper/  # Bursary/internship scraper
├── infra/
│   └── terraform/        # Infrastructure as code
├── deploy/
│   ├── staging/          # Staging deployment configs
│   └── production/       # Production deployment configs
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
├── docker-compose.yml    # Local development services
├── turbo.json            # Turborepo configuration
└── pnpm-workspace.yaml   # pnpm workspace configuration
```

## Key Features

### 🔐 Authentication & Verification
- Email/password authentication
- Institutional email verification (.ac.za domains)
- Student card upload verification
- JWT-based authentication with refresh tokens

### 📝 Content & Posts
- Create posts with text, images, and short videos
- Visibility levels: Campus, University, Province, National
- Academic post tagging
- Media upload via presigned URLs

### 📱 Feeds & Discovery
- Multi-level feeds (Campus → University → Province → National)
- Two-stage ranking pipeline:
  - Candidate generation (local, social graph, trending)
  - Personalized re-ranking with feature scoring
- A/B testing support via experiment headers

### 💬 Real-time Chat
- Direct messaging and group chats
- Socket.IO-based real-time messaging
- Online presence tracking via Redis

### 🎯 Opportunities
- Bursary and internship discovery
- Personalized matching based on profile
- Automated ingestion from external sources

### 👮 Admin & Moderation
- Content moderation queue
- User verification review
- Report management
- Admin dashboard

## API Documentation

API documentation is available via Swagger UI at:
- Local: http://localhost:4000/api/docs
- Production: https://api.campusvibe.co.za/api/docs

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login with credentials |
| GET | `/api/v1/feeds/campus` | Get campus feed |
| POST | `/api/v1/posts` | Create a new post |
| POST | `/api/v1/media/presign` | Get presigned upload URL |
| POST | `/api/v1/chats` | Create/get chat |
| GET | `/api/v1/opportunities/match` | Get matched opportunities |

## Database Schema

The platform uses PostgreSQL with Prisma ORM. Key models:

- **User**: Students with university/campus/program associations
- **University/Campus/Program**: Institution hierarchy
- **Post/Media**: Content with visibility levels
- **Follow/Like/Comment/Share**: Social interactions
- **Chat/Message**: Messaging system
- **Opportunity**: Bursaries and internships
- **Report**: Content moderation

See `packages/database/prisma/schema.prisma` for the complete schema.

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT signing
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET`: S3/MinIO config
- `OPENSEARCH_URL`: OpenSearch endpoint

## Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm e2e
```

## Deployment

### Using Docker

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Using Kubernetes

Helm charts and manifests are available in `/deploy`.

```bash
# Deploy to staging
kubectl apply -f deploy/staging/

# Deploy to production
kubectl apply -f deploy/production/
```

### Using Terraform

Infrastructure as code for AWS/Azure/GCP is in `/infra/terraform`.

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `pnpm test`
4. Run linting: `pnpm lint`
5. Commit changes: `git commit -m "feat: your feature"`
6. Push and create a PR

## License

MIT License - see LICENSE file for details.

## Support

For support, email support@campusvibe.co.za or join our Discord server.