# WorkFlow — Architecture Document

## Overview

WorkFlow is a Jira-inspired project management platform built as a monorepo with separate frontend and backend applications.

## Technology Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Frontend       | Angular 18, Angular Material, RxJS, Signals |
| Backend        | NestJS, TypeScript                |
| Database       | SQLite (via Prisma ORM)           |
| Authentication | JWT + bcrypt                      |
| Dev Tools      | ESLint, Prettier                  |

## Project Structure

```
workflow/
├── apps/
│   ├── web/          # Angular SPA
│   └── api/          # NestJS REST API
├── prisma/
│   ├── schema.prisma # Database schema
│   ├── migrations/   # Prisma migrations
│   └── seed.ts       # Seed data
├── docs/             # Documentation
├── storage/          # File storage (avatars, attachments — future)
├── .env.example      # Environment template
├── package.json      # Root package.json (workspace scripts)
└── README.md
```

## Architecture Decisions

### Monorepo with Separate Apps

Frontend and backend live in `apps/web` and `apps/api` respectively. They share the root `node_modules` but maintain independent build pipelines. This keeps the codebase navigable while allowing independent deployment later.

### SQLite → PostgreSQL Migration Path

Prisma ORM abstracts the database layer. The schema uses only Prisma-native types (no raw SQL). Switching to PostgreSQL later requires only changing `provider` in `schema.prisma` and the `DATABASE_URL`.

### REST API Design

All API endpoints live under `/api/*`. The backend follows the NestJS modular pattern:

```
Controller  →  Service  →  Prisma Client  →  SQLite
```

Controllers handle HTTP concerns (request/response). Services contain business logic. Prisma handles data access.

### Authentication Flow

1. User registers or logs in via `/api/auth/*`
2. Server returns a signed JWT
3. Frontend stores the token and attaches it to subsequent requests via an HTTP interceptor
4. Backend validates the token using an AuthGuard on protected routes

### Frontend Architecture

Angular standalone components with lazy-loaded routes. The app shell consists of:
- Top toolbar (branding, search placeholder, user menu)
- Collapsible sidebar (navigation)
- Main content area (routed views)

State is managed via Angular services with RxJS BehaviorSubjects and Signals.

## Phase Roadmap

| Phase | Scope                                      |
| ----- | ------------------------------------------ |
| 1     | Auth, Dashboard, Project CRUD, Members     |
| 2     | Issues, Board, Backlog                     |
| 3     | Sprints, Epics                             |
| 4     | Search, Filters, Reports                   |
| 5     | Real-time, Notifications, File Attachments |

## Database Entity Relationships (Phase 1)

```
User ──┬── OrganizationMember ──── Organization
       │
       └── ProjectMember ──── Project ──── Organization
```

- A User belongs to Organizations through OrganizationMember
- A User belongs to Projects through ProjectMember
- A Project belongs to an Organization
- A Project has a Lead (User)

## API Endpoints (Phase 1)

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Get JWT
- `POST /api/auth/logout` — Invalidate session (client-side)
- `GET  /api/auth/me` — Current user profile

### Projects
- `GET    /api/projects` — List projects
- `POST   /api/projects` — Create project
- `GET    /api/projects/:id` — Get project details
- `PATCH  /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Archive/delete project

### Project Members
- `GET    /api/projects/:id/members` — List members
- `POST   /api/projects/:id/members` — Add member
- `DELETE /api/projects/:id/members/:userId` — Remove member

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Human-readable message"
  }
}
```

## Security Considerations

- Passwords hashed with bcrypt (cost factor 10)
- JWT tokens with configurable expiry
- Input validation on all endpoints via class-validator
- No password hashes in API responses
- CORS configured for frontend origin only
