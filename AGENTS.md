# AGENTS.md — SideBy

## Repository Layout

```
SideBy/
├── solution-sideby/apps/api/     ← Node.js + Express + MongoDB backend
├── solution-sideby/apps/client/  ← React 19 + Vite frontend
├── docs/                         ← RFCs, style guide, feature flags
└── .github/                      ← CI, Copilot agent definitions
```

npm workspaces root. Workspace glob: `solution-sideby/apps/*`.

---

## Commands

### Root (run from `C:\Proyectos\SideBy`)

```bash
npm install              # install all workspace deps
npm run lint:api
npm run lint:client
npm run build:api        # tsc + rewrite-dist-aliases.mjs (post-build alias rewrite)
npm run build:client     # tsc -b && vite build
npm run build            # build:api && build:client
```

### API (`solution-sideby/apps/api`)

```bash
npm run dev              # tsx watch --env-file .env src/index.ts
npm run build            # tsc + node scripts/rewrite-dist-aliases.mjs
npm run lint
npm run test             # vitest (watch)
npm run test:run         # unit tests only (excludes *.repository.test.ts and *.integration.test.ts)
npm run test:unit        # same as test:run
npm run test:integration # vitest run --config vitest.integration.config.ts (requires MongoDB)
npm run test:all         # test:unit && test:integration
npm run test:coverage
npm run seed             # tsx src/scripts/seed.ts (needs SEED_ADMIN_* env vars)
```

### Client (`solution-sideby/apps/client`)

```bash
npm run dev              # vite (port 5173)
npm run build            # tsc -b && vite build
npm run lint
npm run test:run         # all tests once
npm run test:unit        # excludes *integration*.test.{ts,tsx} files
npm run test:integration # only *integration*.test.{ts,tsx} files
npm run test:coverage
```

### Full stack (Docker, recommended)

```powershell
.\start-app.ps1          # starts API :3000, client :5173, MongoDB :27017, Mongo Express :8081, Ollama :11434
docker compose down
docker compose logs -f
```

### CI quality gates order (mirrors CI pipeline)

```
lint:api → lint:client → test:run (api) → test:run (client) → build:api → build:client
```

---

## Pre-commit / Pre-push Hooks (Husky)

**Pre-commit** (heavy — runs on every commit):
1. `detect-secrets.js` — custom secret scanner, exits 1 on findings
2. `build:client` → `build:api` → `lint:client` → `lint:api`

**Pre-push**:
1. `build:api`
2. `test:unit` on API

Client build and client tests are **skipped in pre-push** due to `@swc/core` native binding issue on Windows. Integration tests are always skipped in hooks.

---

## Architecture

### Backend — Clean Architecture (modular monolith)

Each module follows a 4-layer structure:

```
src/modules/{name}/
├── domain/          ← entities, repository interfaces (pure TS, NO frameworks)
├── application/     ← use cases, DTOs
├── infrastructure/  ← Mongoose models, repository implementations
└── presentation/    ← controllers, routes, Swagger definitions
```

Modules: `auth`, `datasets`, `insights`, `users`.

- Entry: `src/index.ts` → Express app, mounts `/api/v1`
- OpenAPI docs auto-generated at runtime via `zod-to-openapi`, available at `/api/docs`
- Path alias `@/` → `src/`

### Frontend — Feature-Based Architecture

```
src/
├── features/{name}/
│   ├── hooks/          ← business logic + API calls (smart)
│   ├── components/     ← pure UI, no useEffect, no API calls (dumb)
│   ├── pages/          ← route entry points
│   ├── store/          ← Zustand slices
│   └── types/          ← TS interfaces mirroring backend DTOs
├── shared/components/  ← generic atoms (Radix UI / shadcn style)
├── infrastructure/api/ ← Axios instance, TanStack Query client, repositories
├── router/             ← AppRouter.tsx, ProtectedRoute.tsx
└── config/features.ts  ← feature flags (reads VITE_FEATURE_* env vars)
```

State: Zustand = global UI state, React Query = server/async state.

---

## Critical Gotchas

### ESM — `.js` extension is mandatory (API)

Both apps use `"type": "module"`. API imports MUST use `.js` extension even for `.ts` source files:

```ts
// correct
import { UserService } from "./user.service.js"
// wrong — will fail at runtime
import { UserService } from "./user.service"
```

### Post-build alias rewrite (API)

After `tsc`, run `node scripts/rewrite-dist-aliases.mjs` — it replaces `@/` with relative paths in compiled JS. Node.js cannot resolve TypeScript path aliases at runtime. `npm run build` does both automatically.

### Integration tests — first run downloads MongoDB binary

`mongodb-memory-server` downloads a MongoDB binary on first run (~60–120s). Tests run sequentially (`singleFork: true`) — shared DB state is intentional.

### `globalSetup` vs `setupFiles` (API integration tests)

Env vars are set in `globalSetup.integration.ts` (runs before module imports), NOT in `setupFiles`. This is required because `GoogleAuthService` reads env vars at import time.

### `ALLOW_GOOGLE_AUTH_BYPASS`

`true` enables Google OAuth bypass for local dev. **Hard-blocked when `NODE_ENV=production`** — the service throws. Never commit `ALLOW_GOOGLE_AUTH_BYPASS=true` to env files tracked by git.

### Tailwind v4 — no `tailwindcss-animate` plugin

Use native CSS animations. The old `tailwindcss-animate` pattern is gone. No `tailwind.config.ts` plugin needed.

### Docker volumes for `node_modules`

`docker-compose.yml` uses named volumes for `node_modules` to prevent host/container conflicts on Windows. Don't expect host `node_modules` to match container state.

---

## Code Conventions

| Rule | Detail |
|------|--------|
| Identifiers, commits | **English only** |
| Comments, JSDoc | **Spanish only** |
| Commit format | Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) |
| `any` type | **Forbidden** — use proper DTOs and interfaces |
| `console.log` in API | **Forbidden** — use Pino logger (`src/utils/logger.ts`) |
| Frontend imports | Use `@/` alias, never relative `../../` paths |
| UI components | Must be pure/dumb — logic goes into custom hooks |
| CHANGELOG | Must be updated on commits |

---

## Environment Variables (minimum to run locally)

### Root `.env` (Docker Compose)

```dotenv
MONGO_ROOT_USERNAME=
MONGO_ROOT_PASSWORD=
MONGO_DATABASE=
GOOGLE_CLIENT_ID=
VITE_GOOGLE_CLIENT_ID=
JWT_SECRET=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_ADMIN_NAME=
```

### API `solution-sideby/apps/api/.env`

```dotenv
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://...
JWT_SECRET=
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=
ALLOW_GOOGLE_AUTH_BYPASS=false
INSIGHTS_LLM_ENABLED=false   # set true + configure below to use Ollama
INSIGHTS_LLM_PROVIDER=ollama
INSIGHTS_LLM_BASE_URL=http://localhost:11434/v1
INSIGHTS_LLM_MODEL=gemma2:9b
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

### Client `solution-sideby/apps/client/.env`

```dotenv
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=
VITE_FEATURE_EMAIL_LOGIN=false
VITE_FEATURE_AI_ENABLED=false
VITE_FEATURE_DATASET_EDIT_ENABLED=true
```

---

## Feature Flags (client)

Defined in `src/config/features.ts`, driven by `VITE_FEATURE_*` env vars:

| Flag | Default | What it gates |
|------|---------|---------------|
| `EMAIL_LOGIN` | `false` | Email/password auth (alt to Google OAuth) |
| `AI_ENABLED` | `false` | AI prompt analysis in dataset wizard |
| `DATASET_EDIT_ENABLED` | `true` | Edit dataset metadata |

---

## Related Instruction Sources

- `.github/copilot-instructions.md` — architecture, security, and language rules (authoritative source for team conventions)
- `.github/agents/` — GitHub Copilot agent definitions per role (Backend MERN, Frontend MERN, Arquitecto, etc.)
