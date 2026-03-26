# Finders

## Overview

Finders is a mobile-first employment and recruiting social media app built with Expo (React Native) on the frontend and Express.js on the backend. Users can register with a role (Recruiter, Job Seeker, Intern, or Hustler), build a profile with photo/phone, post content with images, interact with posts (like/reply/share), discover people and jobs, send direct messages, and receive notifications when others hire, like, or reply. The color scheme is gold (#D4A017) on black (#1A1A1A).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, new architecture (`newArchEnabled: true`) and React Compiler
- **Routing**: expo-router v6 file-based routing. Five-tab navigation in `app/(tabs)/`: Home (feed), Discover (people/jobs/short work), Messages, Notifications, Profile. Modal screens at `app/` root: `create-post`, `create-job`, `auth`. Deep-link screens: `app/user/[id].tsx` (other user profile), `app/conversation/[id].tsx` (chat)
- **State Management**: TanStack React Query v5 for server state. Auth state via React Context (`lib/auth-context.tsx`)
- **Authentication**: Token-based auth using AsyncStorage to persist tokens. `Authorization: Bearer <token>` header on all authenticated requests
- **Styling**: React Native StyleSheet with gold (#D4A017) + black (#1A1A1A) theme. Inter font family (400/500/600/700)
- **Key Libraries**: expo-haptics, expo-image (for display), expo-image-picker (for photo upload), expo-blur (iOS tab bar blur), react-native-reanimated (like button animation)
- **Metro Config**: `metro.config.js` excludes `.local/` from file watching (prevents watcher crashes on temp files) and resolves `semver` from react-native-worklets for web builds

### Backend (Express.js)

- **Framework**: Express v5, `server/index.ts`
- **API Routes**:
  - Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
  - Profile: `PUT /api/profile`, `GET /api/profile/:id`
  - Posts: `GET /api/posts` (supports `?userId=` filter), `POST /api/posts`
  - Post interactions: `POST /api/posts/:id/like`, `GET /api/posts/:id/replies`, `POST /api/posts/:id/replies`
  - Jobs: `GET /api/jobs` (supports `?shortWork=true/false`), `POST /api/jobs`
  - Users: `GET /api/users`, `POST /api/users/:id/hire`
  - Conversations: `GET /api/conversations`, `POST /api/conversations`, `GET /api/conversations/:id`, `GET /api/conversations/:id/messages`, `POST /api/conversations/:id/messages`
  - Notifications: `GET /api/notifications`, `POST /api/notifications/read`, `GET /api/notifications/count`
- **Authentication**: Custom 64-char hex tokens in `auth_tokens` table. SHA-256 + salt password hashing
- **CORS**: Dynamic allowlist from Replit env vars, allows `Content-Type` + `Authorization` headers
- **Auth Guard**: `RootLayoutNav` uses `useAuth()` + `useSegments()` + `useEffect` — avoids race conditions

### Database (PostgreSQL + Drizzle ORM)

- **Schema** (`shared/schema.ts`): 9 tables:
  - `users` — id, email, password, fullName, role, bio, location, skills, avatarUrl, **phone**, createdAt
  - `posts` — id, userId, content, type, likes, **imageUrl**, createdAt
  - `jobs` — id, userId, title, company, location, description, type, salary, isShortWork, createdAt
  - `auth_tokens` — id, userId, token, createdAt
  - `post_likes` — id, postId, userId, createdAt
  - `post_replies` — id, postId, userId, content, createdAt
  - `conversations` — id, createdAt
  - `conversation_participants` — id, conversationId, userId
  - `messages` — id, conversationId, senderId, content, createdAt
  - `notifications` — id, userId, type, actorId, postId, message, read, createdAt

### Key Features

- **Social Feed**: Posts with images, like (with animation + notification), reply (modal with thread), share (native Share API), clickable user avatars → profile view
- **Profile Tab**: Avatar photo upload (base64), phone number, role selection (4 role cards), bio/location/skills/name editing
- **Discover Tab**: Filter chips for People / Jobs / Short Work. Search bar. Clickable user cards → profile view. Job cards with salary/location
- **Messages Tab**: Conversation list with last message preview. Tapping opens full chat with inverted FlatList and auto-poll every 5s
- **Notifications Tab**: Like/reply/hire/message notifications. Auto-marks-read after 2s. Unread indicator dot
- **User Profile View** (`/user/:id`): Avatar, role badge, bio, skills chips, phone/email, recent posts, Message + Hire buttons
- **Hire Flow**: `POST /api/users/:id/hire` sends a "hire" type notification to the target user
- **Image Upload**: Base64 encoded via expo-image-picker, stored directly in DB (avatarUrl, imageUrl fields)

### Build & Deployment

- **Development**: Two workflows — `Start Frontend` (port 8081, Expo dev server) and `Start Backend` (port 5000, Express)
- **Production**: `scripts/build.js` for Expo static web build; esbuild bundles server
- **Landing Page**: `server/templates/landing-page.html`

## External Dependencies

- **PostgreSQL**: Primary DB via `DATABASE_URL`
- **Replit Environment**: `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS` for CORS/API URL resolution
- **No external APIs**: Self-contained, no OAuth/email/cloud storage
