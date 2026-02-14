# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added - RFC-003 Part 1: Dataset Creation API & Frontend Integration (2026-02-13)

- **Backend: Datasets Module (2-Phase Flow)**
  - POST `/api/v1/datasets` endpoint para upload de archivos CSV
  - PATCH `/api/v1/datasets/:id` endpoint para configuración de mapping
  - GET `/api/v1/datasets/:id` endpoint para obtener dataset completo
  - GET `/api/v1/datasets` endpoint para listar datasets del usuario
  - DELETE `/api/v1/datasets/:id` endpoint para eliminar datasets
  - MongoDatasetRepository con persistencia completa en MongoDB
  - Validación de DTOs con Zod (UploadFilesDTO, UpdateMappingDTO)
  - Soporte para datos en formato Long Format con `_source_group` tag
  - Configuración de `schemaMapping`, `dashboardLayout`, y `sourceConfig`

- **Frontend: Dataset Creation Wizard (2-Phase)**
  - Hook `useDatasetUpload` para POST (Fase 1: Upload archivos)
  - Hook `useDatasetMapping` para PATCH (Fase 2: Configuración de mapping)
  - Hook `useDataset` para GET (Cargar dataset completo)
  - Hook `useDatasetsList` para listar datasets del usuario
  - Servicio `datasets.api.ts` con cliente axios y interceptores de autenticación
  - Componente `DataUploadWizard` refactorizado para flujo 2-phase
  - Componente `KPICard` para mostrar métricas comparativas con cambio porcentual
  - Componente `DatasetTable` para tabla de datos con badges de grupo
  - Página `DatasetDashboard` para visualizar datasets creados con KPIs destacados
  - Integración completa con backend: Upload → Mapping → Dashboard

- **Testing: Unit Tests for Dataset Hooks**
  - Tests para `useDatasetUpload` hook (upload de archivos, manejo de errores)
  - Tests para `useDatasetMapping` hook (actualización de mapping, validación)
  - Tests para `useDataset` hook (carga de dataset por ID, reload)
  - Tests para `useDatasetsList` hook (lista de datasets, recargas)
  - Tests para `datasets.api.ts` service (construcción de requests, manejo de responses)
  - Mock completo de axios con `isAxiosError` y `interceptors` para evitar errores en tests

- **Docker: Environment Variables for API**
  - Variables de entorno agregadas a docker-compose.yml para API service
  - `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `LOG_LEVEL`
  - `ALLOW_GOOGLE_AUTH_BYPASS` para desarrollo local sin Google OAuth
  - Script `dev:docker` en package.json para hot-reload sin `--env-file`

- **Documentation: React Query Migration Proposal**
  - Nueva propuesta en ROADMAP.md para migrar server state a TanStack Query

- **Frontend: React Query Phase-3 - Mutations with Optimistic Updates (2026-02-14)**
  - Hook `useUpdateDataset` para actualizaciones con optimistic UI feedback
    - Deep merge de objetos anidados (meta, sourceConfig, schemaMapping, dashboardLayout)
    - Rollback automático en errores con restoration de estado previo
    - Invalidación de cache post-éxito para sincronización con servidor
    - 4 tests comprehensivos: update, optimistic, rollback, nested merge
  - Hook `useDeleteDataset` para eliminaciones con removal optimista
    - Actualización inmediata de lista con filter + decrement total
    - Limpieza de cache de detalle (removeQueries)
    - Rollback automático restaurando lista completa
    - 5 tests comprehensivos: delete, optimistic, rollback, specific, detail cache
  - Migración de `useDatasets` para usar `useDeleteDataset` en lugar de API manual
  - Migración completa de `useDataset` a React Query con enabled flag
  - Mejora de `createQueryClientWrapper` para pre-población de cache en tests
  - Actualización de tipos: DatasetSummary con campos completos del backend
  - Componente `DatasetCard` actualizado para usar DatasetSummary con status badges
  - Tests: 9 tests de mutations + 5 tests de queries = 14 tests nuevos, todos pasando
  - Lint clean (0 errores), Build exitoso (3.40s, 246KB)
  - Total: 198/204 tests pasando
  - Justificación técnica: cache inteligente, invalidación automática, deduplicación
  - Alcance de migración: todos los hooks de datasets + auth (opcional)
  - Tareas de implementación detalladas con ejemplos de código

- **Frontend: React Query Phase-4 - UI Components Update (2026-02-14)**
  - Componente `DatasetsList` actualizado para usar React Query directo
    - Separación de hooks: useDatasets (query) + useDeleteDataset (mutation)
    - Navegación con useNavigate() directa (sin wrappers)
    - Error state con botón "Reintentar" usando refetch()
    - Pasa prop isDeleting a DatasetCard para feedback visual
  - Componente `DatasetCard` con optimistic delete feedback
    - Nuevo prop isDeleting para mostrar loading state
    - Botón delete deshabilitado durante operación
    - Spinner Loader2 durante eliminación (optimistic update)
    - AlertDialogAction con estado "Eliminando..." y spinner
  - Hook `useDatasets` simplificado a "thin hook" pattern
    - Eliminadas funciones de navegación innecesarias (openDataset, createNewDataset, refreshDatasets)
    - Retorna interfaz estándar de useQuery: data, isLoading, error, refetch
    - Extrae automáticamente array de datasets del response API
    - Reducción de ~80 líneas de código (37% menos boilerplate)
  - Tests actualizados de useDatasets a nueva interfaz
    - 4 tests: carga correcta, manejo errores, cache, refetch manual
    - Eliminados tests de navegación (ya no aplican)
    - Todos los tests pasando (4/4) ✓
  - Beneficios implementados:
    - Optimistic updates: delete desaparece instantáneamente
    - Rollback automático si falla operación
    - Feedback visual con spinners durante operaciones
    - Cache automático para navegación instantánea
    - Error recovery con botón "Reintentar"
  - Bug Fixes (post-implementación):
    - Navegación "Crear Nuevo": Corregido route /datasets/new → /datasets/upload
    - Delete functionality: Fixed cache structure mismatch
      - Problema: useDatasets retornaba array, pero useDeleteDataset esperaba {data, total}
      - Solución: useDatasets retorna response completo, DatasetsList extrae array
      - Resultado: Optimistic updates funcionando correctamente con rollback
  - Validación: Lint clean (0 errores), Build exitoso (3.43s, 246.58KB)
  - Tests: 197/203 pasando (1 fallo pre-existente no relacionado - wizard-integration)
  - BREAKING CHANGE: useDatasets ya no retorna funciones de navegación (openDataset, createNewDataset, refreshDatasets)

### Fixed

- **MongoDB Path Conflict in Dataset Update**
  - Refactorizado `MongoDatasetRepository.update()` para evitar conflicto de paths
  - Convertir objeto `meta: { name, description }` a dot notation (`meta.name`, `meta.description`)
  - Previene error: "Updating the path 'meta.updatedAt' would create a conflict at 'meta'"
  - Implementación de conversión dinámica de nested fields a dot notation antes de `$set`

- **Frontend Test Fixes**
  - Agregado `datasetId: null` en `ColumnMappingStep.new.test.tsx` para cumplir con `WizardState` type
  - Corregido reference de `nextButton` a `uploadButton` en `wizard-integration.test.tsx` (Step 1)
  - Enhanced axios mock con `isAxiosError` function y `interceptors.request/response.use` en `datasets.api.test.ts`

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
