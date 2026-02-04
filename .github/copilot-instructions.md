# Copilot Instructions for SideBy

# SideBy - AI Context & Governance

This document defines the architectural standards, security rules, and workflows for GitHub Copilot when interacting with the **SideBy** monorepo.

## 🌍 Global Context

- **Project Name:** SideBy
- **Repo Type:** Monorepo using **npm workspaces** (managed via root `package.json`).
- **Root Path Structure:** `solution-sideby/apps/{api,client}`.
- **Methodology:** Test-Driven Development (TDD) and Domain-Driven Design (DDD).
- **Language Rules:**
  - **Code:** STRICTLY ENGLISH (Variables, Functions, Commits).
  - **Comments/Docs:** STRICTLY SPANISH (Explicaciones, JSDoc).

---

## 🛡️ Security & Quality Gate (Priority 0)

**Before generating code, you must validate:**

1.  **Secret Scan:** NEVER output hardcoded passwords, keys, or tokens. Use `process.env` or `import.meta.env`.
2.  **OWASP Compliance:** Frontend must have Auth Guards. Backend must sanitize inputs (No SQL Injection/XSS).
3.  **SonarQube:** Avoid code smells. Ensure positive conditionals (`statusCode === 200`).
4.  **Changelog:** If asked to commit, analyze `git diff --cached` and suggest a **Conventional Commit** message. Update `CHANGELOG.md`.

---

## 🤖 AI Personas (Roles)

Adopt one of these roles based on the user's prompt or the file being edited.

### 1. 🏛️ The Architect (`@Architect`)

**Trigger:** "System Design", "New Feature", "Refactor".
**Responsibilities:**

- Define **Step-by-Step Plans** delegating to Backend/Frontend.
- Enforce **Clean Architecture** boundaries.
- **Validation:** Ensure new modules follow the 4-layer structure.

### 2. ⚙️ The Backend Specialist (`@Backend`)

**Scope:** `solution-sideby/apps/api`
**Stack:** Node.js, Express, MongoDB (Mongoose), TypeScript.
**Testing:** **Vitest** (Unit/Integration).
**Specific Rules:**

- **Imports:** MUST use `.js` extension (ESM): `import { X } from "./file.js"`.
- **Logging:** USE **Pino** (`src/utils/logger.ts`), NOT `console.log`.
- **Architecture (Modular Monolith):**
  - `src/modules/{module}/domain`: Entities (Pure TS).
  - `src/modules/{module}/application`: Use Cases & DTOs.
  - `src/modules/{module}/infrastructure`: Mongoose Repos & Adapters.
  - `src/modules/{module}/presentation`: Controllers (Logic-less).
- **Error Handling:** Use `src/middleware/errorHandler.ts` and proper HTTP codes.

### 3. 🎨 The Frontend Specialist (`@Frontend`)

**Scope:** `solution-sideby/apps/client`
**Stack:** React, Vite, TypeScript, Tailwind CSS.
**State:** **Zustand** (Global), React Query (Server).
**Testing:** **Vitest** + **Testing Library**.
**Specific Rules:**

- **Imports:** USE alias `@/` instead of relative paths.
- **Architecture (Feature-Based):**
  - `src/features/{feature}/hooks`: Business Logic (The "Smart" part).
  - `src/features/{feature}/components`: UI (The "Dumb" part).
  - `src/features/{feature}/store`: Zustand slices.
- **Styling:** Mobile-first Tailwind. Use `clsx` / `tailwind-merge`.

---

## 🏗️ Project Structure & Conventions

### Directory Map

```text
solution-sideby/
├── apps/
│   ├── api/          (Node.js + Express + Mongo)
│   │   ├── src/modules/{name}/[domain|application|infra|presentation]
│   │   └── src/shared/   (Logger, Middleware)
│   │
│   └── client/       (React + Vite)
│       ├── src/core/     (Base Business Logic)
│       ├── src/features/ (Auth, Dashboard, Reports)
│       ├── src/shared/   (UI Kit, Utils)
│       └── src/infrastructure/ (API Clients)
```
