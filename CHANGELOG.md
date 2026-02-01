# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added

- **Documentacion API con Swagger/OpenAPI**
  - Instalacion de dependencias: `@asteasolutions/zod-to-openapi`, `swagger-ui-express` y `@types/swagger-ui-express`
  - Integracion automatica de esquemas Zod con especificacion OpenAPI 3.0
  - Creacion de DTOs en `auth.dto.ts` con schemas Zod extendidos para OpenAPI (LoginWithGoogleSchema, AuthResponseSchema, ErrorResponseSchema)
  - Configuracion de OpenAPI Registry con esquema de seguridad JWT (bearerAuth)
  - Funcion generadora de especificacion OpenAPI 3.0 con metadata del proyecto
  - Documentacion completa del endpoint POST /api/auth/google en `auth.swagger.ts` con request/response schemas
  - Swagger UI expuesto en `/api/docs` con interfaz interactiva para probar endpoints
  - Especificacion OpenAPI JSON disponible en `/api/docs.json`

- **Infraestructura Docker completa** para desarrollo local con Docker Compose
  - Servicio MongoDB 7.0 con persistencia de datos y health checks
  - Servicio Mongo Express para administración de base de datos (disponible en puerto 8081)
  - Servicio API con hot-reload automático al modificar archivos TypeScript
  - Servicio Client (Vite) con hot-reload automático para desarrollo frontend
  - Volúmenes nombrados independientes para node_modules de API y Client (evita conflictos Windows/Linux)
  - Variables de entorno configurables mediante archivos `.env` con valores por defecto seguros
  - Dockerfiles multi-etapa para API y Client (development, builder, production)
  - Archivos `.dockerignore` optimizados para reducir contexto de build

- **Versionado de API (v1)** implementado desde el inicio
  - Endpoints versionados en `/api/v1/auth/*` con estructura escalable
  - Agregador centralizado de rutas versionadas en `v1/routes.ts`
  - Preparado para versionado futuro (v2, v3) sin breaking changes

### Removed

- **Rutas legacy sin versionar** eliminadas antes de producción
  - Eliminado endpoint `/api/auth/*` (sin versión)
  - Mantenido únicamente `/api/v1/auth/*` para evitar deuda técnica

- **Tests de integración** separados de tests unitarios
  - Configuración Vitest específica (`vitest.integration.config.ts`) para tests de integración
  - `globalSetup.integration.ts` para configurar variables de entorno antes de imports
  - `setup.integration.ts` preparado para mocks globales y custom matchers
  - MongoMemoryServer para base de datos en memoria durante tests
  - Scripts npm separados: `test:unit`, `test:integration`, `test:all`
  - Exclusión automática de tests de integración en `test:run` y pre-push hook

- **Tests de integración para Google OAuth** 
  - Tests completos del endpoint POST /api/auth/google
  - Validación de request (400 para tokens inválidos o vacíos)
  - Validación de autenticación (401 para tokens expirados o malformados)
  - Verificación de formato de respuesta y manejo de errores
  - Tests de integración con MongoDB usando MongoMemoryServer

- **Hooks de Git con Husky** para control de calidad automatizado
  - Pre-commit: ejecuta `lint-staged` para validar solo archivos modificados
  - Pre-push: ejecuta `npm run build` para verificar compilación exitosa antes de push
  - Comandos compatibles con Windows usando `npm run --prefix` en lugar de `cd &&`
  - Configuración de `lint-staged` para ejecutar linters de forma selectiva

- **Sistema de detección de secretos** en pre-commit hook (Hard Block)
  - Script `.husky/detect-secrets.js` que escanea archivos staged antes de commit
  - Detecta passwords, API keys, tokens (Bearer, GitHub, OpenAI, Google), MongoDB URIs con credenciales
  - Validación especial para Dockerfile/docker-compose: bloquea `ENV VAR=value`, permite `ENV VAR=${VAR}`
  - Excepciones para código seguro: `process.env.*`, `${VAR}`, placeholders `<YOUR_KEY>`
  - Commit bloqueado con mensajes en rojo y soluciones sugeridas si detecta secretos
  - Previene exposición accidental de credenciales en repositorio Git

- **Cliente React** (solution-sideby/apps/client)
  - Aplicación React 19.2 con TypeScript en modo estricto
  - Vite 7.3 como bundler y dev server con SWC para compilación ultra-rápida
  - Tailwind CSS 4.1 con configuración PostCSS y autoprefixer
  - Path aliases (@/) configurados en tsconfig y vite.config para imports limpios
  - ESLint 9 con plugins para React Hooks y React Refresh
  - Estructura de carpetas siguiendo Clean Architecture (core, features, infrastructure, shared)

- **API Node.js** (solution-sideby/apps/api)
  - Servidor Express con TypeScript y arquitectura modular Clean Architecture/DDD
  - MongoDB como base de datos con Mongoose para modelado de datos
  - Logger Pino configurado para logs estructurados en desarrollo y producción
  - Manejo centralizado de errores con sanitización de mensajes en producción
  - Health check endpoint disponible
  - Módulos organizados por dominio (auth, users, datasets, reports) con capas application/domain/infrastructure/presentation
  - Capa shared con utilidades transversales (errores, database, logger, storage)

- **Documentación para AI Agents** en `.github/copilot-instructions.md`
  - Guía completa de arquitectura del monorepo y convenciones del proyecto
  - Comandos críticos para desarrollo con Docker y sin Docker
  - Configuración de Git hooks explicada
  - Patrones de importación (extensiones .js en backend, alias @/ en frontend, prefijo node:)
  - Estrategias de logging, manejo de errores y estructura modular
  - Puntos de integración entre servicios (API ↔ MongoDB, Client ↔ API)
  - Troubleshooting común y tareas frecuentes

- **Configuración de workspace npm** en raíz del monorepo
  - Gestión centralizada de Husky y lint-staged
  - Scripts para lint y build de ambas aplicaciones desde la raíz
  - Estructura de workspaces apuntando a `solution-sideby/apps/*`

### Changed

- **Credenciales de admin seed** movidas del docker-compose.yml a variables de entorno
  - Variables `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_GOOGLE_ID`, `SEED_ADMIN_NAME` en `.env`
  - Eliminadas credenciales hardcodeadas del docker-compose.yml por seguridad
  - `.env.example` actualizado con nuevas variables de admin seed

- **Credenciales de MongoDB y Mongo Express** extraídas a variables de entorno con valores por defecto
  - Sintaxis `${VAR:-default}` en docker-compose.yml para fallback automático
  - Archivos `.env.example` actualizados con plantillas sin credenciales hardcodeadas

- **Importación de módulos Node.js** actualizada con prefijo `node:` (node:path, node:fs, etc.)
  - Cambio aplicado en vite.config.ts y otros archivos de configuración backend

- **Condiciones positivas preferidas** en lugar de condiciones negadas
  - Refactorizado en errorHandler.ts: `statusCode === 200 ? 500 : res.statusCode`

### Fixed

- **Variables de entorno en tests de integración** configuradas con globalSetup
  - `globalSetup.integration.ts` ejecuta ANTES de importar módulos (crítico para constructores que leen env vars)
  - `setupFiles` ahora solo para mocks globales y custom matchers (no env vars)
  - Resuelve error "GOOGLE_CLIENT_ID is not defined" al importar GoogleAuthService

- **Folder dist excluido de análisis ESLint** en la API para evitar warnings de archivos compilados

- **Logging con Pino** implementado correctamente en lugar de `console.log`
  - Uso de `logger.info()`, `logger.error()`, `logger.warn()` con contexto estructurado

- **Errores sanitizados en producción** para prevenir exposición de detalles internos
  - Stack traces y mensajes sensibles ocultos cuando `NODE_ENV=production`

- **Conexión a MongoDB requerida** para que la API no arranque sin base de datos disponible
  - Health checks configurados en Docker Compose con dependencias entre servicios

- **Formato de configuración ESLint** corregido a flat config format en Client
  - Actualizado para compatibilidad con ESLint 9
admin seed** removidas de docker-compose.yml y movidas a `.env`
  - Archivos `.env.example` actualizados con variables de admin sin valores por defecto
  - Previene exposición accidental de credenciales en repositorio Git

- **Credenciales de 
- **Importaciones de rutas** corregidas en Client para usar path aliases correctamente

### Security

- **Credenciales de MongoDB removidas** de código fuente y movidas a variables de entorno
  - Archivos `.env.example` sin valores sensibles (contraseñas vacías como plantilla)
  - Valores por defecto solo para desarrollo local (admin/admin123) mediante fallback

---

## Notas de Versión

Esta es la primera iteración del proyecto que incluye la infraestructura base completa. Los próximos releases incluirán:

- Implementación de módulos de autenticación y autorización
- Endpoints REST para gestión de datasets y reportes
- Interfaz de usuario React con componentes de dashboard
- Testing automatizado (unit, integration, e2e)
- CI/CD pipeline con GitHub Actions

---

**Convenciones de Commits Usados:**
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `chore:` - Tareas de mantenimiento (build, deps, config)
- `docs:` - Cambios solo en documentación

**Pull Requests Merged:**
- PR #4: feature_main_explore_husky_add_more_instructions (secret detection & security)
- PR #3: feature_main_creacion_docker_husky
- PR #2: copilot/sub-pr-1
- PR #1: feature_main_structure_initial
