# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AuraLink Backend - A NestJS-based API for a club/society management system with AI-powered quiz generation capabilities.

## Tech Stack

- **Framework**: NestJS with TypeScript
- **ORM**: MikroORM with PostgreSQL driver
- **Auth**: JWT (Passport-JWT) with access/refresh tokens, bcrypt for passwords
- **API Docs**: Swagger + Scalar API Reference (available at `/reference`)
- **AI**: Zhipu AI (GLM-4.7 model) for quiz generation
- **Storage**: AWS S3 for file uploads (user avatars)

## Common Commands

```bash
# Install dependencies
pnpm install

# Development (with hot reload)
npm run start:dev

# Production build and run
npm run build
npm run start:prod

# Testing
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage
npm run test:e2e          # E2E tests

# Code quality
npm run lint              # ESLint
npm run format            # Prettier
```

## Architecture

### Module Structure

```
src/
├── app.module.ts       # Root module, MikroORM config
├── main.ts             # Bootstrap, Swagger setup, CORS
├── user/               # User CRUD, admin management, roster
├── auth/               # Login, register, token refresh, password change
├── adminlog/           # Admin action logging
├── ai/                 # AI quiz generation (Zhipu AI)
└── s3/                 # S3 file storage service
```

### Key Patterns

- **Entities**: Located in each module's `entities/` folder, use MikroORM decorators
- **DTOs**: Located in each module's `dto/` folder, use `class-validator` for validation and `class-transformer` for serialization
- **Authentication**: JWT guard (`JwtAuthGuard`) protects routes, user payload attached to `req['user']`
- **Authorization**: Role-based (`user`, `admin`, `root`), checked in controllers
- **API Documentation**: Use `@ApiTags`, `@ApiOperation`, `@ApiResponse` decorators from `@nestjs/swagger`

### User Roles

- `user`: Basic member
- `admin`: Can view user lists
- `root`: Full admin access (create/update/delete admins, manage users)

### Environment Variables

Required in `.env` or `.env.local`:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `ZHIPU_API_KEY` (optional, enables AI features)
- `S3_*` variables for file storage

## Database

MikroORM with `synchronize: true` in development. Schema is auto-generated from entities.

## API Documentation

After starting the server, access Scalar API Reference at:
`http://localhost:3000/reference`

API prefix: `/api/v1`