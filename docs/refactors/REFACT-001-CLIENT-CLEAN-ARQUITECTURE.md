# REFACT-001 - Client Clean Architecture

## 1) Objetivo

Definir una estrategia de refactor incremental para el cliente (`apps/client`) que mejore separación de capas, mantenibilidad y testabilidad, manteniendo compatibilidad funcional.

Alcance inicial de esta propuesta:

- Feature `dataset`
- Feature `auth`

---

## 2) Criterios de evaluación

Se evaluó contra:

- **Clean Architecture (adaptada a Frontend)**
  - Presentación (pages/components)
  - Aplicación (hooks/use-cases)
  - Dominio (modelos y lógica pura)
  - Infraestructura (API/repositories, IO, storage)
- **SOLID** (especialmente SRP, DIP)
- **KISS** (duplicación mínima, complejidad accidental baja)

---

## 3) Estado actual - Feature Dataset

### 3.1 Fortalezas

- Estructura por feature bien definida: `components`, `hooks`, `pages`, `services`, `types`, `utils`, `schemas`.
- Buen uso de React Query en parte de los hooks (`useDatasets`, `useDataset`, `useUpdateDataset`, `useDeleteDataset`).
- Utilidades puras con tests robustos (ej: `utils/delta.ts`).
- Cobertura de test amplia en componentes, hooks y utilidades.

### 3.2 Hallazgos de arquitectura

1. **Infraestructura mezclada en la feature**
   - `features/dataset/services/datasets.api.ts` incluye detalles de cliente HTTP e interpretación de token desde `localStorage`.
   - Esto debería estar en `src/infrastructure/api` para reducir acoplamiento.

2. **Duplicación de enfoque en hooks de lista**
   - Coexisten `useDatasets` (React Query) y `useDatasetsList` (estado manual con `useState/useEffect`).
   - Aumenta complejidad y riesgo de divergencia.

3. **Inconsistencia de organización de estado**
   - Existe carpeta `store` vacía en dataset, pero el estado de wizard vive en `hooks/useWizardState.ts` (Zustand).
   - La semántica de ubicación no es consistente.

4. **Barrel con mock de servicio en export principal**
   - `features/dataset/index.ts` exporta `datasetService.mock` como API de la feature.
   - Riesgo de uso accidental de mock fuera de test/dev.

5. **Componentes/páginas con SRP tensionado**
   - `pages/DataUploadWizard.tsx` y `components/wizard/ColumnMappingStep.simplified.tsx` concentran demasiada orquestación.

### 3.3 Evaluación resumida Dataset

- Clean Architecture: **7/10**
- SOLID: **7/10**
- KISS: **6.5/10**

---

## 4) Estado actual - Feature Auth

### 4.1 Fortalezas

- Feature compacta y entendible (`hooks`, `store`, `types`, `models`, `pages`).
- Separación básica entre UI (`LoginPage`), hook (`useGoogleAuth`) y estado (`auth.store`).
- Repositorio de infraestructura dedicado (`infrastructure/api/repositories/auth.repository.ts`).

### 4.2 Hallazgos de arquitectura

1. **Modelo de dominio duplicado/inconsistente**
   - Hay `types/auth.types.ts` y `models/user.model.ts` con forma de `User` diferente (`subscriptionStatus` solo en modelo).
   - Riesgo de drift de contrato y errores de mapeo.

2. **Store y tipos no completamente alineados**
   - `auth.types.ts` define `AuthState` con `isLoading` y `error`, pero `auth.store.ts` no lo implementa.
   - Señal de contrato incompleto o deuda de diseño.

3. **Hook con mezcla de responsabilidades**
   - `useGoogleAuth.ts` hace validación de env, llamada repositorio, parseo de error HTTP y control de estado.
   - Candidato a extraer mapper/manejador de error para mejorar SRP.

4. **UI de login con scope híbrido**
   - `LoginPage.tsx` mezcla flujo Google completo + formulario email/password (feature flag), aunque no hay caso de uso email activo.
   - Complejidad de UI superior a la necesidad funcional actual.

### 4.3 Evaluación resumida Auth

- Clean Architecture: **7.5/10**
- SOLID: **7/10**
- KISS: **7/10**

---

## 5) Principios de refactor (no disruptivo)

1. **No big-bang**: cambios pequeños por PR, con pruebas antes/después.
2. **Mantener API pública de hooks** cuando sea posible.
3. **Mover infraestructura hacia `src/infrastructure`**, no hacia componentes.
4. **Eliminar duplicación funcional** antes de agregar nuevas capacidades.
5. **Preferir funciones puras y adaptadores** para bajar acoplamiento.

---

## 6) Plan incremental propuesto

### Fase A - Higiene estructural mínima (bajo riesgo)

1. Dataset: unificar en React Query y deprecación de `useDatasetsList`.
2. Dataset: mover `useWizardState.ts` a `store/wizard.store.ts` (manteniendo re-export para compatibilidad).
3. Dataset: remover export de mock desde `features/dataset/index.ts`.
4. Auth: alinear tipos `User` (modelo único o mapper explícito de API -> dominio).

### Fase B - Separación de infraestructura

1. Dataset: extraer cliente API y token resolver a `src/infrastructure/api`.
2. Dataset/Auth: compartir política de interceptores y manejo de errores HTTP.
3. Dataset/Auth: estandarizar shape de errores de hooks para UI.

### Fase C - SRP en capa de aplicación/presentación

1. Dataset: dividir `DataUploadWizard` en hook de orquestación + componente presentacional.
2. Dataset: dividir `ColumnMappingStep.simplified` en subcomponentes de fecha/métricas/dimensiones.
3. Auth: extraer mapper de errores de `useGoogleAuth` y simplificar `LoginPage` por feature flag activa.

### Fase D - Gobernanza

1. Definir checklist de arquitectura por PR (Clean/SOLID/KISS).
2. Agregar reglas de lint/review para evitar imports de infraestructura desde componentes cuando no corresponde.
3. Documentar convenciones de ubicación (`store` vs `hooks`) para todo `apps/client`.

---

## 7) Entregables esperados

- Menor acoplamiento a detalles de transporte/storage.
- Menos duplicación de hooks y estados.
- Contratos de tipos consistentes en Auth.
- Componentes/páginas más pequeñas, testeables y previsibles.

---

## 8) Riesgos y mitigación

- **Riesgo**: romper importaciones existentes al mover archivos.
  - **Mitigación**: usar re-exports temporales y migración gradual.
- **Riesgo**: cambios de comportamiento en cache/queries.
  - **Mitigación**: cubrir flujos críticos con tests de hooks y smoke tests UI.
- **Riesgo**: deuda de mocks legacy.
  - **Mitigación**: aislar mocks en rutas de test y evitar barrel público.

---

## 9) Conclusión

La base actual del cliente es buena y ya tiene varias prácticas correctas (feature-based, utilidades puras, tests, React Query).

El mayor valor ahora no está en reescribir, sino en **consolidar límites de capas**, **eliminar duplicación** y **reducir responsabilidades por archivo**.

Esta propuesta prioriza impacto alto con riesgo bajo, respetando evolución incremental.

---

## 10) Plan operativo (modo tareas)

> Usar esta sección como tablero de seguimiento. Marcar cada tarea al completarla.

### 10.1 Leyenda de estado

- [ ] Pendiente
- [~] En progreso
- [x] Completada
- [!] Bloqueada

### 10.2 Estado global por fase

| Fase | Estado | Owner | Inicio | Fin | Notas |
|------|--------|-------|--------|-----|-------|
| A - Higiene estructural | [ ] |  |  |  |  |
| B - Separación infraestructura | [ ] |  |  |  |  |
| C - SRP aplicación/presentación | [ ] |  |  |  |  |
| D - Gobernanza | [ ] |  |  |  |  |
| E - Auditoría OWASP (Client + API) | [ ] |  |  |  |  |

### 10.3 Backlog ejecutable por fases

#### Fase A - Higiene estructural mínima (bajo riesgo)

- [ ] **A1. Deprecar `useDatasetsList` y unificar en React Query**
   - Resultado esperado: solo un camino oficial para listar datasets.
   - Verificación: tests de hooks/páginas en verde.

- [ ] **A2. Mover `useWizardState.ts` a `store/wizard.store.ts` con re-export**
   - Resultado esperado: convención de ubicación consistente (`store` para Zustand).
   - Verificación: imports existentes siguen funcionando.

- [ ] **A3. Remover export de mock en `features/dataset/index.ts`**
   - Resultado esperado: evitar uso accidental de mocks en runtime real.
   - Verificación: build y tests sin imports rotos.

- [ ] **A4. Alinear modelo `User` en Auth (tipo único o mapper explícito)**
   - Resultado esperado: contrato consistente entre API, store y dominio.
   - Verificación: tests de auth + compilación TypeScript.

#### Fase B - Separación de infraestructura

- [ ] **B1. Extraer cliente API de Dataset a `src/infrastructure/api`**
   - Resultado esperado: feature sin detalles de transporte/token parsing.
   - Verificación: endpoints dataset funcionan igual.

- [ ] **B2. Unificar interceptores y política de auth headers (Dataset/Auth)**
   - Resultado esperado: una estrategia común de requests autenticadas.
   - Verificación: login + consumo de endpoints protegidos.

- [ ] **B3. Estandarizar shape de errores para hooks UI**
   - Resultado esperado: manejo de errores uniforme en componentes.
   - Verificación: tests de error-handling en hooks.

#### Fase C - SRP en capa de aplicación/presentación

- [ ] **C1. Extraer hook de orquestación de `DataUploadWizard`**
   - Resultado esperado: page más delgada, lógica reutilizable/testeable.
   - Verificación: flujo wizard completo sin regresiones.

- [ ] **C2. Dividir `ColumnMappingStep.simplified` en subcomponentes**
   - Resultado esperado: menor complejidad por archivo, mejor testabilidad.
   - Verificación: tests existentes y nuevos por subcomponente.

- [ ] **C3. Extraer mapper de errores en `useGoogleAuth` y simplificar `LoginPage`**
   - Resultado esperado: hooks y pages con responsabilidad más clara.
   - Verificación: login Google funcional + tests auth en verde.

#### Fase D - Gobernanza

- [ ] **D1. Definir checklist de arquitectura por PR (Clean/SOLID/KISS)**
   - Resultado esperado: criterios repetibles en reviews.

- [ ] **D2. Agregar reglas de lint/review para límites de capas**
   - Resultado esperado: prevenir imports no permitidos entre capas.

- [ ] **D3. Documentar convención `store` vs `hooks` en cliente**
   - Resultado esperado: onboarding y decisiones consistentes.

#### Fase E - Auditoría OWASP (Client + API)

- [ ] **E1. Definir baseline de seguridad y alcance de auditoría**
   - Resultado esperado: alcance explícito para monorepo (Frontend + API).
   - Verificación: documento con OWASP Top 10 + OWASP API Top 10 aplicable.

- [ ] **E2. Ejecutar análisis SAST + dependencias (SCA)**
   - Resultado esperado: hallazgos de código y CVEs priorizados por severidad.
   - Verificación: reporte con estado de vulnerabilidades (critical/high/medium/low).

- [ ] **E3. Ejecutar DAST básico contra endpoints críticos**
   - Resultado esperado: validación de autenticación, autorización, rate limit y errores.
   - Verificación: evidencia de pruebas sobre login, datasets y endpoints protegidos.

- [ ] **E4. Hardening de configuración en Client/API**
   - Resultado esperado: medidas base aplicadas (CORS, headers, sanitización, guards, env).
   - Verificación: checklist técnico completado y revisado.

- [ ] **E5. Cierre de hallazgos críticos/altos y aceptación de riesgo residual**
   - Resultado esperado: sin vulnerabilidades críticas/altas abiertas para MVP.
   - Verificación: acta de cierre con mitigaciones y riesgos aceptados.

### 10.4 Definition of Done (DoD) por fase

#### DoD Fase A

- [ ] Build de client en verde.
- [ ] Tests unitarios de client en verde.
- [ ] Sin cambios funcionales visibles para usuario final.

#### DoD Fase B

- [ ] Endpoints de auth/dataset verificados manualmente.
- [ ] Sin lógica de transporte/storage dentro de componentes.
- [ ] Contratos de error unificados y documentados.

#### DoD Fase C

- [ ] Archivos críticos reducen complejidad (menos responsabilidades mezcladas).
- [ ] Flujos principales (`login`, `wizard`, `dashboard`) sin regresiones.
- [ ] Tests de regresión actualizados/pasando.

#### DoD Fase D

- [ ] Checklist de PR disponible y aplicado.
- [ ] Reglas de lint/review activas en repositorio.
- [ ] Documentación actualizada para el equipo.

#### DoD Fase E

- [ ] Auditoría OWASP ejecutada para `apps/client` y `apps/api`.
- [ ] Sin hallazgos críticos/altos abiertos en alcance MVP.
- [ ] Evidencia de SAST/SCA/DAST adjunta en registro de avances.
- [ ] Plan de remediación para hallazgos medios/bajos documentado.

### 10.5 Registro de avances

| Fecha | Fase/Tarea | Estado | Cambio aplicado | Evidencia (tests/build) |
|-------|------------|--------|------------------|--------------------------|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 10.6 Plan token-eficiente (recomendado)

Para minimizar costo/tiempo en IA:

1. Ejecutar por **micro-PRs** (1 tarea = 1 PR).
2. Leer solo archivos impactados + dependencias directas.
3. Correr primero tests focalizados y luego suite completa.
4. Evitar refactors “ya que estamos” fuera de fase.
5. Cerrar cada PR con evidencia de build/tests antes de seguir.

### 10.7 Plantilla accionable de evidencia (copy/paste)

Usar esta plantilla en cada micro-PR o tarea completada.

#### Plantilla rápida para `10.5 Registro de avances`

| Fecha | Fase/Tarea | Estado | Cambio aplicado | Evidencia (tests/build) |
|-------|------------|--------|------------------|--------------------------|
| YYYY-MM-DD | A1 - Deprecar `useDatasetsList` | [x] | Migración a `useDatasets` (React Query) y limpieza de imports | `npm run test:unit` ✅ / `npm run build:client` ✅ |

#### Plantilla detallada por tarea

```markdown
### Evidencia - {FASE}-{TAREA}

- Fecha: YYYY-MM-DD
- Owner: {nombre}
- Estado: [ ] / [~] / [x] / [!]
- PR: #{numero} ({link opcional})

#### Cambios aplicados

- Archivo(s):
   - path/archivo-1.ts
   - path/archivo-2.tsx
- Resumen técnico:
   - ...

#### Verificación técnica

- Comandos ejecutados:
   - `npm run test:unit`
   - `npm run build:client`
- Resultado:
   - Tests: ✅ / ❌
   - Build: ✅ / ❌

#### Riesgos / Notas

- Riesgo residual:
   - ...
- Siguiente paso recomendado:
   - ...
```

#### Plantilla específica para Fase E (OWASP)

```markdown
### Evidencia Seguridad - E{n}

- Fecha: YYYY-MM-DD
- Owner: {nombre}
- Alcance: `apps/client` | `apps/api` | ambos

#### Herramientas y ejecución

- SAST:
   - Herramienta: ...
   - Comando: `...`
   - Resultado: Critical {n} / High {n} / Medium {n} / Low {n}

- SCA (dependencias):
   - Herramienta: ...
   - Comando: `...`
   - Resultado: Critical {n} / High {n} / Medium {n} / Low {n}

- DAST (si aplica):
   - Herramienta: ...
   - Alcance: endpoints críticos evaluados
   - Resultado: hallazgos {n}

#### Decisión de cierre

- Hallazgos críticos/altos abiertos: Sí/No
- ¿Cumple DoD Fase E para MVP?: Sí/No
- Riesgo aceptado (si aplica): ...
```
