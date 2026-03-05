# Monorepo

A full-stack monorepo with Node.js API and React Native mobile app using pnpm workspaces.

## 🏗️ Architecture

- **Root**: pnpm workspace configuration with shared tooling
- **apps/api**: Node.js 20 + TypeScript + Express + Socket.io + Prisma + Redis
- **apps/mobile**: React Native 0.73 + Expo SDK 51 + TypeScript + React Navigation + Zustand + TanStack Query

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Expo CLI (for mobile development)

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd monorepo
   pnpm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/mobile/.env.example apps/mobile/.env
   ```

3. **Start services with Docker**
   ```bash
   pnpm docker:up
   ```

4. **Setup database**
   ```bash
   cd apps/api
   pnpm db:push
   pnpm db:generate
   ```

5. **Start development servers**
   ```bash
   # Start all services
   pnpm dev
   
   # Or start individually
   pnpm --filter @monorepo/api dev
   pnpm --filter @monorepo/mobile start
   ```

## 📱 Development

### API Development

```bash
cd apps/api
pnpm dev                    # Start with hot-reload
pnpm typecheck              # Type checking
pnpm lint                   # Linting
pnpm db:studio              # Open Prisma Studio
pnpm db:migrate             # Run database migrations
```

### Mobile Development

```bash
cd apps/mobile
pnpm start                  # Start Expo dev server
pnpm android                # Run on Android
pnpm ios                    # Run on iOS
pnpm web                    # Run in web browser
pnpm typecheck              # Type checking
pnpm lint                   # Linting
```

## 🐳 Docker Services

- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **API**: `localhost:3001`

## 🛠️ Available Scripts

### Root Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all projects
- `pnpm lint` - Lint all projects
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Type check all projects
- `pnpm docker:up` - Start Docker services
- `pnpm docker:down` - Stop Docker services

### API Scripts (`apps/api`)

- `pnpm dev` - Start with hot-reload using tsx
- `pnpm build` - Build for production
- `pnpm start` - Start production build
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio

### Mobile Scripts (`apps/mobile`)

- `pnpm start` - Start Expo development server
- `pnpm android` - Run on Android device/emulator
- `pnpm ios` - Run on iOS simulator
- `pnpm web` - Run in web browser
- `pnpm build` - Build for production

## 📁 Project Structure

```
monorepo/
├── apps/
│   ├── api/                 # Node.js API server
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── mobile/              # React Native app
│       ├── app/
│       ├── src/
│       ├── assets/
│       └── package.json
├── docker-compose.yml       # Docker services
├── .env.example            # Environment variables template
├── .eslintrc.js            # ESLint configuration
├── .prettierrc             # Prettier configuration
├── package.json            # Root package.json
└── pnpm-workspace.yaml     # pnpm workspace config
```

## 🔧 Technology Stack

### API (`apps/api`)
- **Runtime**: Node.js 20
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (ioredis)
- **Validation**: Zod
- **Development**: tsx for hot-reload

### Mobile (`apps/mobile`)
- **Framework**: React Native 0.73
- **Platform**: Expo SDK 51
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Routing**: Expo Router

## 🌐 API Endpoints

- `GET /health` - Health check
- `POST /api/users` - Create user
- Socket.io events for real-time communication

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific workspace
pnpm --filter @monorepo/api test
pnpm --filter @monorepo/mobile test
```

## 📝 Environment Variables

See `.env.example` files for required environment variables:
- Root `.env.example` - Shared configuration
- `apps/api/.env.example` - API-specific variables
- `apps/mobile/.env.example` - Mobile-specific variables

## 🚀 Deployment

### API Deployment

The API includes a Dockerfile for containerized deployment. The Docker Compose configuration includes the API service with hot-reload for development.

### Mobile Deployment

Build the mobile app for production:

```bash
cd apps/mobile
pnpm build
```

For app store deployment, use Expo EAS Build:

```bash
npx eas build --platform android
npx eas build --platform ios
```

## 📄 License

© 2024 Campus Connect. All rights reserved.
