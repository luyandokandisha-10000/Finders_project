# Finders

## Overview

Finders is a mobile-first job networking platform built with Expo (React Native) on the frontend and Express.js on the backend. It allows users to register, create profiles with roles (Recruiter, Job Seeker, Intern, Hustler), post content, browse job listings, and discover other users. The app features a tab-based navigation with sections for Home (feed), Discover (user search), Post (create content), Short Work (gig/freelance listings), and Jobs (full-time listings).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`) and React Compiler experiment
- **Routing**: expo-router v6 with file-based routing. Tab navigation lives in `app/(tabs)/` with screens for Home, Discover, Post, Short Work, and Jobs. Modal screens (`create-post`, `create-job`, `profile`, `auth`) are defined at the `app/` root level
- **State Management**: TanStack React Query v5 for server state. Auth state is managed via a React Context (`lib/auth-context.tsx`) that wraps query-based user fetching
- **Authentication**: Token-based auth using AsyncStorage to persist JWT-like tokens. Tokens are sent as `Authorization: Bearer <token>` headers. The `lib/query-client.ts` file handles API requests, token management, and base URL resolution from `EXPO_PUBLIC_DOMAIN` environment variable
- **Styling**: Plain React Native StyleSheet with a custom color constants file (`constants/colors.ts`) using a gold/warm theme. Only light mode colors are defined
- **Fonts**: Inter font family (400, 500, 600, 700 weights) loaded via `@expo-google-fonts/inter`
- **Key Libraries**: expo-haptics for tactile feedback, expo-image-picker, expo-location, react-native-gesture-handler, react-native-keyboard-controller

### Backend (Express.js)

- **Framework**: Express v5 running as a standalone Node.js server (`server/index.ts`)
- **API Design**: RESTful JSON API under `/api/` prefix. Key routes include:
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` — authentication
  - `GET /api/posts`, `POST /api/posts` — social feed
  - `GET /api/jobs`, `POST /api/jobs` — job listings
  - `GET /api/users` — user discovery
- **Authentication**: Custom token-based auth. Tokens are random 64-character hex strings stored in a `auth_tokens` PostgreSQL table. No JWT library is used — tokens are opaque and looked up server-side
- **Password Hashing**: SHA-256 with random salt (stored as `salt:hash` in the database). Note: this is a simple implementation, not bcrypt/argon2
- **CORS**: Dynamic origin allowlist based on Replit environment variables, plus localhost origins for development

### Database (PostgreSQL + Drizzle ORM)

- **ORM**: Drizzle ORM v0.39 with `drizzle-zod` for schema validation
- **Schema** (`shared/schema.ts`): Three main tables:
  - `users` — id (UUID), email, password, fullName, role, bio, location, skills, avatarUrl, createdAt
  - `posts` — id (UUID), userId (FK → users), content, type, likes, createdAt
  - `jobs` — id (UUID), userId (FK → users), title, company, location, description, type, salary, isShortWork, createdAt
- **Additional table**: `auth_tokens` (created dynamically in `routes.ts`) for session tokens
- **Migration**: Uses `drizzle-kit push` for schema synchronization (no migration files workflow)
- **Connection**: `pg` Pool with `DATABASE_URL` environment variable

### Shared Code

- The `shared/` directory contains schema definitions and Zod validation schemas used by both frontend and backend
- TypeScript path aliases: `@/*` maps to project root, `@shared/*` maps to `./shared/*`

### Build & Deployment

- **Development**: Two processes — `expo:dev` for the mobile/web client, `server:dev` (via tsx) for the backend
- **Production Build**: `scripts/build.js` handles Expo static web build, `server:build` uses esbuild to bundle the server. Production server serves the static build
- **Landing Page**: `server/templates/landing-page.html` — a simple HTML page shown when accessing the server directly in a browser

## External Dependencies

- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable. Required for all data storage
- **Replit Environment**: The app relies on Replit-specific env vars (`REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`, `REPLIT_INTERNAL_APP_DOMAIN`) for CORS configuration and API URL resolution
- **No external APIs**: The app is self-contained with no third-party API integrations (no OAuth providers, no email services, no cloud storage)