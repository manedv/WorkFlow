# WorkFlow

A modern project management platform inspired by professional tools like Jira. Built with Angular, NestJS, and SQLite.

## Technology Stack

| Layer          | Technology                                     |
| -------------- | ---------------------------------------------- |
| Frontend       | Angular 18, Angular Material 18, RxJS, Signals |
| Backend        | NestJS 10, TypeScript                          |
| Database       | SQLite (via Prisma ORM)                        |
| Authentication | JWT + bcrypt                                   |
| Dev Tools      | ESLint, Prettier, Concurrently                 |

## Prerequisites (Windows)

- **Node.js** v20+ — [Download](https://nodejs.org/)
- **npm** v10+ (comes with Node.js)
- **Git** — [Download](https://git-scm.com/)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd WorkFlow

# Install root dependencies
npm install

# Install backend dependencies
npm install --prefix apps/api

# Install frontend dependencies
npm install --prefix apps/web
```

## Environment Setup

Copy the example environment file (a default `.env` is included for development):

```bash
copy .env.example .env
```

Default values work out of the box for local development.

## Database Setup

### Run Migrations

```bash
npm run db:migrate
```

This creates the SQLite database (`prisma/dev.db`) and applies all migrations.

### Seed the Database

```bash
npm run db:seed
```

This creates:
- **Organization**: WorkFlow Demo Organization
- **Users**: admin, developer, tester (see credentials below)
- **Project**: RemoteDesk (key: RD) with all users as members

### Reset Database (if needed)

```bash
npm run db:reset
npm run db:seed
```

## Running the Application

### Start Both Frontend and Backend

```bash
npm run dev
```

This starts:
- **API** at http://localhost:3000/api (NestJS with watch mode)
- **Frontend** at http://localhost:4200 (Angular dev server with API proxy)

### Start Individually

```bash
# Backend only
npm run dev:api

# Frontend only
npm run dev:web
```

## Demo Credentials

| User      | Email                      | Password       |
| --------- | -------------------------- | -------------- |
| Admin     | admin@workflow.local       | admin123       |
| Developer | developer@workflow.local   | developer123   |
| Tester    | tester@workflow.local      | tester123      |

> These are development-only credentials. Do not use in production.

## Available Commands

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start API and frontend concurrently      |
| `npm run dev:api`    | Start NestJS in watch mode               |
| `npm run dev:web`    | Start Angular dev server                 |
| `npm run build`      | Build both API and frontend              |
| `npm run test`       | Run backend tests                        |
| `npm run lint`       | Run ESLint on backend                    |
| `npm run format`     | Format code with Prettier                |
| `npm run db:migrate` | Run Prisma migrations                    |
| `npm run db:seed`    | Seed the database                        |
| `npm run db:studio`  | Open Prisma Studio (database browser)    |
| `npm run db:reset`   | Reset database and re-run migrations     |

## Project Structure

```
WorkFlow/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   └── src/
│   │       ├── auth/           # Authentication (JWT, login, register)
│   │       ├── users/          # User management
│   │       ├── organizations/  # Organization endpoints
│   │       ├── projects/       # Project CRUD + member management
│   │       ├── issues/         # Issue CRUD, status, activity, bulk ops
│   │       ├── sprints/        # Sprint management & backlog
│   │       ├── comments/       # Issue comments
│   │       ├── notifications/  # In-app notifications
│   │       ├── attachments/    # File upload/download
│   │       ├── prisma/         # Prisma service module
│   │       ├── common/         # Filters, decorators
│   │       ├── app.module.ts
│   │       └── main.ts
│   │
│   └── web/                    # Angular Frontend
│       └── src/app/
│           ├── core/           # Services, guards, interceptors
│           ├── features/
│           │   ├── auth/       # Login & register pages
│           │   ├── dashboard/  # Dashboard view
│           │   ├── projects/   # Project list, overview, settings
│           │   ├── issues/     # Board, issue detail, comments, activity
│           │   ├── sprints/    # Backlog & sprint management
│           │   ├── notifications/ # Notification panel
│           │   ├── settings/   # User settings page
│           │   └── placeholder/ # Future feature placeholder
│           ├── layout/         # App shell (toolbar + sidebar + notifications)
│           ├── shared/         # Confirm dialog, shared components
│           └── app.routes.ts   # Route definitions
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration history
│   └── seed.ts                 # Seed data script
│
├── storage/                    # File uploads storage
├── .env                        # Environment variables
├── .env.example                # Environment template
└── package.json                # Root scripts
```

## API Endpoints

### Authentication
| Method | Endpoint             | Description         | Auth |
| ------ | -------------------- | ------------------- | ---- |
| POST   | /api/auth/register   | Create account      | No   |
| POST   | /api/auth/login      | Get JWT token       | No   |
| POST   | /api/auth/logout     | Log out             | No   |
| GET    | /api/auth/me         | Current user        | Yes  |

### Projects
| Method | Endpoint                              | Description      | Auth |
| ------ | ------------------------------------- | ---------------- | ---- |
| GET    | /api/projects                         | List projects    | Yes  |
| POST   | /api/projects                         | Create project   | Yes  |
| GET    | /api/projects/:id                     | Get project      | Yes  |
| PATCH  | /api/projects/:id                     | Update project   | Yes  |
| DELETE | /api/projects/:id                     | Archive project  | Yes  |

### Project Members
| Method | Endpoint                                    | Description    | Auth |
| ------ | ------------------------------------------- | -------------- | ---- |
| GET    | /api/projects/:id/members                   | List members   | Yes  |
| POST   | /api/projects/:id/members                   | Add member     | Yes  |
| DELETE | /api/projects/:id/members/:userId           | Remove member  | Yes  |

### Other
| Method | Endpoint              | Description    | Auth |
| ------ | --------------------- | -------------- | ---- |
| GET    | /api/users            | List users     | Yes  |
| GET    | /api/organizations    | My orgs        | Yes  |

### Issues
| Method | Endpoint                              | Description              | Auth |
| ------ | ------------------------------------- | ------------------------ | ---- |
| GET    | /api/projects/:projectId/issues       | List project issues      | Yes  |
| POST   | /api/projects/:projectId/issues       | Create issue             | Yes  |
| GET    | /api/projects/:projectId/statuses     | Get project statuses     | Yes  |
| POST   | /api/projects/:projectId/statuses     | Create custom status     | Yes  |
| PATCH  | /api/projects/:projectId/statuses/reorder | Reorder statuses     | Yes  |
| PATCH  | /api/projects/:projectId/statuses/:id | Update status            | Yes  |
| DELETE | /api/projects/:projectId/statuses/:id | Delete status            | Yes  |
| GET    | /api/projects/:projectId/issues/counts| Issue counts by status   | Yes  |
| GET    | /api/issues/:id                       | Get issue detail         | Yes  |
| GET    | /api/issues/:id/activity              | Get issue activity log   | Yes  |
| PATCH  | /api/issues/:id                       | Update issue             | Yes  |
| DELETE | /api/issues/:id                       | Delete issue             | Yes  |
| PATCH  | /api/issues/:id/status                | Change issue status      | Yes  |
| PATCH  | /api/issues/:id/assignee              | Change assignee          | Yes  |
| PATCH  | /api/issues/:id/priority              | Change priority          | Yes  |
| PATCH  | /api/issues/reorder                   | Reorder issues in column | Yes  |
| PATCH  | /api/issues/bulk                      | Bulk update issues       | Yes  |

### Sprints
| Method | Endpoint                              | Description              | Auth |
| ------ | ------------------------------------- | ------------------------ | ---- |
| GET    | /api/projects/:projectId/sprints      | List project sprints     | Yes  |
| POST   | /api/projects/:projectId/sprints      | Create sprint            | Yes  |
| GET    | /api/projects/:projectId/backlog      | Get backlog issues       | Yes  |
| GET    | /api/sprints/:id                      | Get sprint with issues   | Yes  |
| PATCH  | /api/sprints/:id                      | Update sprint            | Yes  |
| POST   | /api/sprints/:id/start                | Start sprint             | Yes  |
| POST   | /api/sprints/:id/complete             | Complete sprint          | Yes  |
| DELETE | /api/sprints/:id                      | Delete sprint            | Yes  |
| POST   | /api/sprints/:id/issues/:issueId      | Add issue to sprint      | Yes  |
| DELETE | /api/sprints/:id/issues/:issueId      | Remove issue from sprint | Yes  |

### Comments
| Method | Endpoint                              | Description              | Auth |
| ------ | ------------------------------------- | ------------------------ | ---- |
| GET    | /api/issues/:issueId/comments         | List issue comments      | Yes  |
| POST   | /api/issues/:issueId/comments         | Add comment              | Yes  |
| PATCH  | /api/comments/:id                     | Edit comment             | Yes  |
| DELETE | /api/comments/:id                     | Delete comment           | Yes  |

### Notifications
| Method | Endpoint                              | Description              | Auth |
| ------ | ------------------------------------- | ------------------------ | ---- |
| GET    | /api/notifications                    | List notifications       | Yes  |
| GET    | /api/notifications/count              | Unread count             | Yes  |
| PATCH  | /api/notifications/:id/read           | Mark as read             | Yes  |
| PATCH  | /api/notifications/read-all           | Mark all as read         | Yes  |

### Attachments
| Method | Endpoint                              | Description              | Auth |
| ------ | ------------------------------------- | ------------------------ | ---- |
| GET    | /api/issues/:issueId/attachments      | List issue attachments   | Yes  |
| POST   | /api/issues/:issueId/attachments      | Upload file              | Yes  |
| DELETE | /api/attachments/:id                  | Delete attachment        | Yes  |

## Phase 1 Features

- User registration and login with JWT authentication
- Protected routes with auth guards
- Dashboard with project statistics
- Project creation, editing, and archiving
- Project member management (add, remove, role assignment)
- Professional app shell with collapsible sidebar
- Responsive Angular Material UI
- Toast notifications for user feedback
- Confirmation dialogs for destructive actions

## Phase 2 Features

- **Issue Tracking** — Create, view, edit, and delete issues
- **Issue Types** — Task, Bug, Story, Epic, Sub-task
- **Priorities** — Low, Medium, High, Urgent
- **Statuses** — Todo, In Progress, In Review, Testing, Done (per project)
- **Issue Keys** — Auto-generated project-scoped keys (e.g., RD-1, RD-2)
- **Kanban Board** — Drag-and-drop board at `/projects/:id/board` with CDK Drag and Drop
- **Optimistic Updates** — Board drag updates UI immediately, rolls back on API failure
- **Issue Detail Page** — Full issue view at `/issues/:id` with inline editing
- **Inline Editing** — Edit summary, description, status, priority, assignee, story points, due date
- **Board Filters** — Filter by assignee, priority, and issue type
- **Activity Tracking** — Database records for issue created, updated, status/assignee/priority changes
- **Project Overview** — Issue counts by status, issue list, link to board
- **Backend Tests** — 8 tests covering creation, key generation, updates, project isolation

### Issue Data Model

| Field         | Type     | Description                          |
| ------------- | -------- | ------------------------------------ |
| issueKey      | String   | Unique key like RD-1                 |
| type          | String   | TASK, BUG, STORY, EPIC, SUB_TASK     |
| summary       | String   | Short title (required)               |
| description   | String?  | Detailed description                 |
| status        | Relation | Linked to project-scoped Status      |
| priority      | String   | LOW, MEDIUM, HIGH, URGENT            |
| reporter      | Relation | User who created the issue           |
| assignee      | Relation | User assigned to the issue           |
| storyPoints   | Int?     | Estimation points                    |
| dueDate       | DateTime?| Target completion date               |
| parentIssue   | Relation | Parent issue (for sub-tasks)         |

## Phase 3 Features

- **Sprint Management** — Create, start, and complete sprints with drag-and-drop backlog planning
- **Backlog View** — Drag issues between backlog and sprints at `/projects/:id/backlog`
- **Comments** — Add, edit, and delete comments on issues with author controls
- **Activity Timeline** — Visual activity history on each issue (created, updated, status/assignee/priority changes, comments, attachments)
- **Notifications** — In-app notification bell with unread count, auto-triggered on comments and assignments
- **Attachments** — File upload (up to 10MB) and delete on issues, stored in `/storage/uploads/`
- **Custom Statuses** — Create, rename, reorder, and delete project statuses (admin only)
- **Column Reordering** — Reorder issues within board columns via API
- **Bulk Operations** — Batch update status, priority, assignee, or sprint for multiple issues
- **Role-Based Permissions** — Admin-only operations for status CRUD and destructive actions; comment authors can edit/delete their own

### Sprint States

| State     | Description                     |
| --------- | ------------------------------- |
| PLANNING  | Default — issues being planned  |
| ACTIVE    | Sprint in progress (one at a time) |
| COMPLETED | Sprint finished, issues released |

## Known Limitations

- No real-time updates / WebSocket push
- No JQL / advanced full-text search
- No velocity/burndown charts
- No email notifications (in-app only)
- No threaded/nested comments
- User profile editing not yet implemented
- No password change flow
- No email verification
- SQLite for development only (migrate to PostgreSQL for production)

## Recommended Phase 4 Work

1. **Real-time Updates** — WebSocket for live board updates
2. **Advanced Search** — Full-text search / JQL-like query
3. **Burndown Charts** — Sprint velocity and progress tracking
4. **Email Notifications** — Email digests for assignments and mentions
5. **Custom Fields** — User-defined fields on issues
6. **Workflow Automation** — Rules engine for auto-transitions
7. **Audit Log** — Organization-level activity audit
