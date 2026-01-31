# Copilot Instructions for SideBy

# Copilot Instructions for preventing sensitive data exposure

SECURITY RULES:

1. Before generating or reviewing any code, scan for hardcoded secrets, passwords, API keys, or credentials.
2. If you see a hardcoded secret (e.g., inside Dockerfile or docker-compose), STOP and warn me immediately.
3. Always suggest using Environment Variables (process.env, ${VAR}) instead of raw strings for credentials.
4. Verify that .env files are in .gitignore.

# Copilot Instructions for Changelog

- Every time I ask to commit changes, first analyze the staged changes (git diff --cached).
- Generate a summary in 'Conventional Commits' format.
- Remind me to update the `CHANGELOG.md` following the 'Keep a Changelog' standard before committing.
- Format for Changelog: [Added, Changed, Fixed, Removed].

## Architecture Overview

**Monorepo Structure**: This is a TypeScript monorepo using npm workspaces (not Lerna/Turborepo). The workspace root (`package.json`) manages Husky and shared tooling, while apps are under `solution-sideby/apps/`.

**Tech Stack**:

- **API** (`solution-sideby/apps/api`): Node.js + Express + TypeScript + MongoDB + Mongoose
- **Client** (`solution-sideby/apps/client`): React + TypeScript + Vite + Tailwind CSS + SWC
- **Infrastructure**: Docker Compose with MongoDB, Mongo Express, and hot-reload for both apps

### Backend Architecture (Clean Architecture/DDD)

The API follows a **modular Clean Architecture** with Domain-Driven Design:

```
src/modules/{module}/
├── application/    # Use cases, DTOs
├── domain/         # Entities, value objects, business logic
├── infrastructure/ # Database repositories, external services
└── presentation/   # Controllers, routes, request/response handling
```

**Key modules**: `auth`, `users`, `datasets`, `reports`

**Shared layer** (`src/shared/`): Cross-cutting concerns like error handling, database utilities, logger (Pino), and common presentation middlewares.

### Frontend Architecture (Clean Architecture)

```
src/
├── core/           # Business logic (entities, repositories, use-cases)
├── features/       # Feature modules (auth, dashboard) with components, hooks, pages, state
├── infrastructure/ # API clients, services, storage adapters
├── shared/         # Reusable components (layout, ui), utilities, types
└── router/         # React Router configuration
```

**Path alias**: Use `@/` instead of `../../` - configured in `vite.config.ts` and `tsconfig.json`.

## Critical Commands

### Development (Local - No Docker)

```bash
# From workspace root
npm install                           # Install all deps (root + workspaces)
npm run lint:api / npm run lint:client
npm run build:api / npm run build:client
npm run build                         # Build both apps

# From individual apps
cd solution-sideby/apps/api && npm run dev    # API on :3000
cd solution-sideby/apps/client && npm run dev # Vite on :5173
```

**Note**: API requires MongoDB running locally on `mongodb://localhost:27017/sideby`. Configure in `.env`.

### Development (Docker - Recommended)

```bash
docker compose up -d                  # Start all services
docker compose logs -f api            # Follow API logs
docker compose logs -f client         # Follow client logs
docker compose down                   # Stop all services
docker compose restart api            # Restart specific service
```

**Services**:

- API: http://localhost:3000
- Client: http://localhost:5173
- Mongo Express: http://localhost:8081 (admin/admin)
- MongoDB: localhost:27017

**Environment variables**: Root `.env` (Docker), `apps/api/.env`, `apps/client/.env`. See `.env.example` files.

### Git Hooks (Husky)

**Pre-commit**: Runs `lint-staged` to lint only staged files (auto-configured)
**Pre-push**: Runs `npm run build` to ensure both apps compile

If hooks fail, fix linting/build errors. Windows note: Uses `npm run --prefix` instead of `cd &&` for cross-platform compatibility.

## Project-Specific Conventions

### Import Styles

- **Backend**: Use `.js` extensions in imports (TypeScript + ESM): `import { connectDB } from "./config/database.js"`
- **Frontend**: Use `@/` path alias: `import Button from "@/shared/components/ui/Button"`
- **Prefer Node.js built-in prefixes**: `import path from "node:path"` (not `"path"`)

### Logging

Use **Pino** logger (`src/utils/logger.ts`) in the API, not `console.log`:

```typescript
logger.info({ data }, "Message");
logger.error({ err: error }, "Error message");
```

### Error Handling (API)

Centralized in `src/middleware/errorHandler.ts`. Use proper HTTP status codes before throwing:

```typescript
res.statusCode = 404;
throw new Error("Not found");
```

### Module Structure

When creating new features:

- **Backend**: Add to `src/modules/{module-name}/` following the 4-layer structure
- **Frontend**: Add to `src/features/{feature-name}/` with components, hooks, pages, store

### Code Quality

- **SonarQube** integration active - avoid hardcoded credentials, use environment variables
- **ESLint** configured for both apps - fix warnings before committing
- Positive conditionals preferred: `statusCode === 200 ? ... : ...` (not `!== 200`)

## Integration Points

### API ↔ MongoDB

Connection in `src/config/database.ts` using Mongoose. Connection string from `MONGO_URI` env var. Health checks and reconnection logic included.

### Client ↔ API

API base URL configured via `VITE_API_URL` environment variable. Infrastructure layer handles HTTP clients (check `src/infrastructure/api/`).

### Docker Volumes

- `api_node_modules` and `client_node_modules`: Separate volumes to avoid Windows/Linux conflicts
- Source code mounted for hot-reload: changes reflect immediately without rebuild
- MongoDB data persisted in `mongo_data` volume

## Common Tasks

**Add a new API endpoint**: Create route in module's presentation layer, implement use case in application layer
**Add a new React page**: Create in `features/{feature}/pages/`, add route in `src/router/`
**Update dependencies**: Run from individual app dirs, not root (workspaces don't hoist)
**Debug Docker issues**: Check logs with `docker compose logs {service}`, ensure `.env` files exist

## Questions?

- What patterns for state management are you using in React? (Redux, Zustand, Context?)
- Are there any existing authentication flows implemented yet?
- Should new modules follow REST or GraphQL patterns?
