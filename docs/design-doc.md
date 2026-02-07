**Project Name:** SideBy
**Description:** SaaS B2B de Benchmarking Comparativo (A/B).
**Stack:** MERN (MongoDB, Express, React, Node.js) + TypeScript.
**Architecture:** Modular Monolith (Clean Architecture) en Monorepo.

## 1. Arquitectura del Sistema

El proyecto es un **Monorepo** gestionado con NPM Workspaces.

### 1.1 Estructura de Carpetas

Plaintext

`/sideby-monorepo
├── package.json (Workspaces: "apps/*")
├── docker-compose.yml
├── .gitignore (Excluye .env)
├── apps
│   ├── api (Backend - Node.js/Express)
│   │   ├── src
│   │   │   ├── core (Entities, Domain Errors)
│   │   │   ├── application (Use Cases, Interfaces)
│   │   │   └── infrastructure (Web, Persistence, AI, Sentry)
│   │   └── .env.example
│   └── client (Frontend - React/Vite)
│       ├── src
│       │   ├── features (Auth, Datasets, Dashboard)
│       │   ├── components (Shadcn/ui)
│       │   └── lib (Axios, Utils)
│       └── .env.example`

## 2. Estrategia de Seguridad (MVP Robusto)

- **Auth:** Google OAuth2 (validación de token en backend) + Session JWT propio.
- **Secrets:** Gestión mediante variables de entorno (`.env`) validadas con **Zod** al inicio. No se suben al repo.
- **Rate Limiting:** Implementación en memoria (`express-rate-limit`) sin Redis.
- **Sanitización:** Headers seguros (Helmet) y prevención de NoSQL Injection.

## 3. Observabilidad

- **Plataforma:** **Sentry** (SaaS).
- **Backend:** Captura de excepciones + Tracing de Express/Mongo.
- **Frontend:** Captura de errores React + Web Vitals + Session Replay.

## 4. Modelo de Datos (MongoDB)

- **Users:** `email`, `googleId`, `role` (user/admin), `plan` (free/pro).
- **Datasets:** Documento flexible que contiene configuración (`mapping`) y datos crudos (`data: []`) unificados con una etiqueta `_source_group`.