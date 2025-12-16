# 🦁 Lynx Word Game Backend 🎮

> A real-time multiplayer word guessing game built with NestJS, Colyseus, and WebSockets

[![NestJS](https://img.shields.io/badge/NestJS-11.1.2-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.8.2-2D3748?logo=prisma)](https://www.prisma.io/)
[![Colyseus](https://img.shields.io/badge/Colyseus-0.15.17-FF6B6B?logo=colyseus)](https://colyseus.io/)

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Memory Management](#memory-management)
- [Contributing](#contributing)

## 🎮 About

Lynx is a real-time multiplayer word guessing game where players compete to guess words based on cue words. The backend provides a robust, scalable architecture supporting both solo and multiplayer game modes with real-time synchronization using WebSockets and Colyseus.

### Key Capabilities

- **Real-time Gameplay**: Instant synchronization using Colyseus WebSocket rooms
- **Scheduled Games**: Create and manage games with future start times
- **Email Notifications**: Automated invitations and reminders via email
- **LiveKit Integration**: Voice/video communication support
- **Role-based Access**: Admin and player roles with JWT authentication
- **Word Management**: Admin panel for managing game words and cues

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control (Admin/Player)
- Secure password hashing with bcrypt
- Token validation and refresh endpoints

### 🎯 Game Modes
- **Solo Mode**: Single-player word guessing games
- **Multiplayer Mode**: Scheduled or instant Real-time multiplayer rooms with up to 8 players

### 🎲 Game Features
- Real-time game state synchronization
- Round-based gameplay with configurable rounds
- Score tracking and leaderboards
- Inactivity timeout and automatic room disposal
- Cue word system (5 cue words per target word)

### 📧 Email System
- Game invitation emails
- Game reminder notifications
- Queue-based email processing with Bull
- Handlebars email templates

### 🎤 LiveKit Integration
- Token generation for LiveKit rooms
- Voice/video communication support

### 🛠️ Admin Features
- Word management (CRUD operations) with pagination and filtering for words
- Word status management

## 🛠️ Tech Stack

### Core Framework
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **Express** - Web application framework

### Real-time & WebSockets
- **Colyseus** - Multiplayer game server framework
- **Socket.IO** - Real-time bidirectional event-based communication
- **@colyseus/ws-transport** - WebSocket transport for Colyseus

### Database & ORM
- **PostgreSQL** - Relational database
- **Prisma** - Next-generation ORM

### Caching & Queue
- **Redis** - In-memory data structure store
- **Bull** - Redis-based queue for job processing
- **@keyv/redis** - Redis adapter for Keyv

### Authentication & Security
- **@nestjs/jwt** - JWT implementation for NestJS
- **bcrypt** - Password hashing
- **class-validator** - Validation decorators

### Email & Communication
- **@nestjs-modules/mailer** - Email module for NestJS
- **nodemailer** - Email sending
- **handlebars** - Email templating
- **LiveKit Server SDK** - Real-time communication

### Utilities
- **date-fns** - Date utility library
- **winston** - Logging library
- **@nestjs/schedule** - Task scheduling

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Run linters on staged files
- **Jest** - Testing framework

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher) - Package manager
- **PostgreSQL** (v16 or higher)
- **Redis** (v7 or higher)
- **Docker** and **Docker Compose** (optional, for containerized services)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lynx-backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start PostgreSQL and Redis** (using Docker Compose)
   ```bash
   docker-compose up -d
   ```

   Or use your own PostgreSQL and Redis instances.

5. **Set up the database**
   ```bash
   # Generate Prisma Client
   pnpm prisma generate

   # Run migrations
   pnpm prisma migrate dev

   # (Optional) Seed the database
   pnpm prisma db seed
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
APP_PORT=3000
NODE_ENV=development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lynx?connection_limit=10&pool_timeout=20"

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PORT=6379

# PostgreSQL
POSTGRES_PORT=5432

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_TOKEN_TTL=3600
JWT_REFRESH_TOKEN_TTL=604800

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@lynxgame.com

# LiveKit
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
LIVEKIT_URL=https://your-livekit-instance.com
```

> **Note**: For production, ensure all secrets are strong and unique. Never commit `.env` files to version control.

### Database Connection Pool

Configure connection pool limits in your `DATABASE_URL`:
```
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=10&pool_timeout=20"
```

## 🗄️ Database Setup

### Prisma Schema

The application uses Prisma for database management. Key models include:

- **Player** - User accounts with authentication
- **Game** - Game instances (SOLO or MULTIPLAYER)
- **ScheduledGame** - Scheduled game rooms with invitations
- **Word** - Game words with cue words

### Migrations

```bash
# Create a new migration
pnpm prisma migrate dev --name migration_name

# Apply migrations in production
pnpm prisma migrate deploy

# Reset database (development only)
pnpm prisma migrate reset
```

### Database Seeding

```bash
pnpm prisma db seed
```

## 🏃 Running the Application

### Development Mode

```bash
# Start in watch mode
pnpm start:dev

# Start with debugging
pnpm start:debug
```

The application will be available at `http://localhost:3000`

### Production Mode

```bash
# Build the application
pnpm build

# Start production server
pnpm start:prod
```

### Using PM2

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs lynx-backend
```

### Colyseus Monitor & Playground

- **Monitor**: `http://localhost:3000/monitor` (admin/admin)
- **Playground**: `http://localhost:3000/playground`

## 📡 API Endpoints

All endpoints are prefixed with `/api`

### Authentication (`/api/authentication`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/sign-up` | Register a new player | No |
| POST | `/sign-in` | Sign in and get tokens | No |
| POST | `/refresh-token` | Refresh access token | No |
| GET | `/check-token` | Validate current token | Yes |

### Scheduled Games (`/api/scheduled-games`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create a scheduled game room | Yes |
| GET | `/:gameId` | Get scheduled game details | No |

### Games (`/api/games`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create a new game | Yes |
| GET | `/` | Get all games | Yes |
| GET | `/:id` | Get game by ID | Yes |
| DELETE | `/:id` | Delete a game | Yes |

### Words (`/api/words`) - Admin Only

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create a new word | Yes (Admin) |
| GET | `/` | Get all words (paginated) | Yes (Admin) |
| GET | `/:id` | Get word by ID | Yes (Admin) |
| PATCH | `/:id` | Update a word | Yes (Admin) |
| DELETE | `/:id` | Delete a word | Yes (Admin) |

### LiveKit (`/api/live-kit`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/token` | Get LiveKit access token | No |

### WebSocket Endpoints

- **Solo Room**: `ws://localhost:3000/solo`
- **Multiplayer Room**: `ws://localhost:3000/multiplayer`

## 🏗️ Architecture

### Key Components

#### Colyseus Rooms
- **SoloRoom**: Handles solo game sessions
- **MultiplayerRoom**: Manages multiplayer game sessions with real-time synchronization

#### Authentication Flow
1. User signs up/signs in
2. Server generates JWT access token and refresh token
3. Client stores tokens and includes access token in requests
4. Access token expires → client uses refresh token to get new access token

#### Game Flow
1. Player creates a scheduled game (INSTANT or FUTURE)
2. Invitations sent via email (if FUTURE)
3. Players join Colyseus room
4. Game starts with countdown
5. Rounds progress with cue words
6. Players submit guesses
7. Scores calculated and displayed
8. Game ends or restarts

## 💻 Development

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Format code
pnpm format

# Lint code
pnpm lint
```

### Git Hooks

Husky is configured with pre-commit and commit-msg hooks:
- **pre-commit**: Runs lint-staged (ESLint + Prettier)
- **commit-msg**: Validates commit messages with commitlint

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure strong JWT secrets
- [ ] Set up proper CORS origins
- [ ] Configure database connection pool
- [ ] Set up Redis for caching and queues
- [ ] Configure email service credentials
- [ ] Set up LiveKit instance
- [ ] Configure PM2 or similar process manager
- [ ] Set up logging and monitoring
- [ ] Configure SSL/TLS certificates

### PM2 Configuration

The project includes `ecosystem.config.js` for PM2:

```bash
pm2 start ecosystem.config.js --env production
```

### Docker Deployment

Use the provided `compose.yml` for PostgreSQL and Redis:

```bash
docker-compose up -d
```

## 🧠 Memory Management

The application includes comprehensive memory leak fixes. See [docs/MEMORY_LEAK_FIXES.md](docs/MEMORY_LEAK_FIXES.md) for details.

### Key Fixes
- ✅ Proper cleanup of Colyseus room timeouts and intervals
- ✅ Prisma connection pool management
- ✅ WebSocket gateway cleanup
- ✅ Graceful shutdown handling

### Monitoring

Monitor memory usage:
```bash
# PM2 monitoring
pm2 monit

# System memory
free -h
```

---

<div align="center">

**Happy Lynx Solving! 🎯**

</div>
