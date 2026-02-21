# SideBy

[![CI/CD](https://github.com/mkiro79/SideBy/actions/workflows/release-ci-cd.yml/badge.svg?branch=main)](https://github.com/mkiro79/SideBy/actions/workflows/release-ci-cd.yml)
[![Último release](https://img.shields.io/github/v/release/mkiro79/SideBy)](https://github.com/mkiro79/SideBy/releases)

Plataforma web para comparar datasets entre periodos y convertir datos en decisiones rápidas mediante visualización analítica y soporte de insights automáticos.

## a) Descripción general del proyecto

SideBy es un SaaS orientado a benchmarking comparativo (A/B) que permite:

- Subir dos fuentes de datos (por ejemplo, periodo actual vs periodo anterior).
- Normalizar y mapear columnas con un wizard guiado.
- Construir dashboards comparativos con métricas, tablas y filtros.
- Obtener insights de negocio con motor de reglas y soporte opcional de LLM (Ollama).

El repositorio está organizado como **monorepo** con dos aplicaciones principales:

- `apps/api`: backend REST con Express + MongoDB.
- `apps/client`: frontend React + Vite.

Repositorio público: https://github.com/mkiro79/SideBy

## b) Stack tecnológico utilizado

### Backend (`solution-sideby/apps/api`)

- Node.js + TypeScript (ESM)
- Express
- MongoDB + Mongoose
- Zod (validaciones)
- Pino (logging)
- Vitest + Supertest (testing)
- Swagger/OpenAPI (`/api/docs`)

### Frontend (`solution-sideby/apps/client`)

- React 19 + TypeScript
- Vite
- React Router
- Zustand (estado global)
- TanStack React Query (estado servidor)
- Tailwind CSS
- Vitest + Testing Library

### Infraestructura y DevOps

- Docker + Docker Compose
- Mongo Express (administración Mongo)
- Ollama (LLM local opcional para insights)
- GitHub Actions (`.github/workflows/release-ci-cd.yml`)

## c) Instalación y ejecución

### Prerrequisitos

- Node.js 22+
- npm 10+
- Docker Desktop
- PowerShell 5.1+ (Windows)

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/mkiro79/SideBy.git
cd SideBy
npm install
```

### 2. Configurar variables de entorno

Crear/copiar:

- `.env` desde `.env.example` (raíz)
- `solution-sideby/apps/api/.env` desde `solution-sideby/apps/api/.env.example`
- `solution-sideby/apps/client/.env` desde `solution-sideby/apps/client/.env.example`

Variables clave mínimas:

- Mongo: `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`, `MONGO_DATABASE`
- Auth: `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID`
- JWT/seed admin (API): `JWT_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`

### 3. Ejecutar con Docker (recomendado)

```powershell
.\start-app.ps1
```

Este script levanta:

- Client: `http://localhost:5173`
- API: `http://localhost:3000`
- Mongo Express: `http://localhost:8081`
- Ollama: `http://localhost:11434`

Además ejecuta seed de usuario admin en la API si la configuración está disponible.

### 4. Ejecutar tests

Suite completa:

```powershell
.\run-tests.ps1
```

Por aplicación:

```bash
# API
npm run test:run --prefix solution-sideby/apps/api

# Client
npm run test:run --prefix solution-sideby/apps/client
```

### 5. Lint y build

```bash
npm run lint:api
npm run lint:client
npm run build:api
npm run build:client
```

## d) Estructura del proyecto

```text
SideBy/
├── .github/
│   └── workflows/
│       └── release-ci-cd.yml
├── docs/
├── solution-sideby/
│   └── apps/
│       ├── api/
│       │   └── src/
│       │       ├── modules/
│       │       │   ├── auth/
│       │       │   ├── datasets/
│       │       │   ├── insights/
│       │       │   └── users/
│       │       ├── middleware/
│       │       ├── infrastructure/
│       │       ├── scripts/
│       │       └── v1/
│       └── client/
│           └── src/
│               ├── features/
│               │   ├── auth/
│               │   ├── dashboard/
│               │   ├── dataset/
│               │   ├── home/
│               │   └── public/
│               ├── infrastructure/
│               ├── router/
│               └── shared/
├── docker-compose.yml
├── start-app.ps1
└── run-tests.ps1
```

## e) Funcionalidades principales

### 1. Autenticación y acceso

- Login con Google OAuth.
- Gestión de sesión JWT.
- Protección de rutas privadas en frontend.

### 2. Gestión de datasets

- Subida de archivos y preparación para comparación.
- Wizard de mapeo de columnas (dimensión/KPIs/formatos).
- Configuración final de dataset y persistencia.

### 3. Dashboard comparativo

- Vista analítica por dataset.
- Filtros categóricos (incluyendo selección múltiple).
- KPIs y tablas para análisis de variaciones entre grupos.

### 4. Insights automáticos

- Endpoint de insights por dataset.
- Motor de reglas para resumen y anomalías.
- Integración opcional con LLM (Ollama/OpenAI-compatible) con fallback.

### 5. Calidad y entrega

- CI/CD para `main` y `release/**`.
- Job `Quality Gates`: lint + tests + build (API/Client).
- Flujo manual para crear ramas `release/x.y.z` desde GitHub Actions.

## Endpoints de referencia

- `GET /health`
- `GET /api`
- `GET /api/docs`
- `GET /api/docs.json`
- Base API v1: `/api/v1`

## Documentación complementaria

- `docs/UsesCases.md`
- `docs/design-doc.md`
- `docs/ROADMAP.md`
- `SCRIPTS.md`

## Licencia

Este proyecto está bajo **licencia propietaria**.

- Se permite únicamente visualización/evaluación del repositorio.
- No se permite uso comercial, copia, redistribución ni creación de derivados sin autorización escrita.
- Para permisos o licencia comercial, consultar el archivo `LICENSE`.

## Notas operativas

- El proyecto usa versionado semántico y changelog en `CHANGELOG.md`.
- Para detener infraestructura Docker:

```bash
docker compose down
```

- Para ver logs en tiempo real:

```bash
docker compose logs -f
```
