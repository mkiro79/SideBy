# [RFC-011] ADD-SENTRY-TO-OBSERVABILITY

| Metadatos | Detalles |
| :--- | :--- |
| **Fecha / Date** | 2026-02-21 |
| **Estado / Status** | **Propuesto / Backlog Post-MVP** |
| **Prioridad / Priority** | Alta |
| **Esfuerzo / Effort** | 2-3 días (MVP de observabilidad) |
| **Alcance / Scope** | Backend + Frontend (`apps/api`, `apps/client`) |
| **Dependencias** | CI/CD release activo, variables de entorno en Railway |
| **Versión Target** | v1.1.0 |
| **Autor / Author** | SideBy Engineering |

---

## 1. Contexto y Motivación

Actualmente SideBy dispone de:

- Logs estructurados en backend con Pino.
- Middleware global de errores en API.
- Healthcheck (`/health`) y trazas básicas en logs de Railway.

Limitaciones actuales:

- No hay agregación centralizada de errores frontend.
- No existe tracking de excepciones backend con contexto enriquecido.
- No hay correlación clara de incidencias por release/version.
- Tiempos de diagnóstico en producción dependen solo de logs.

**Objetivo:** añadir Sentry para mejorar trazabilidad, diagnóstico y tiempo de respuesta ante errores en producción.

---

## 2. Objetivos

1. Capturar errores no controlados en **Frontend** y **Backend**.
2. Adjuntar contexto útil (ruta, usuario, versión release, entorno).
3. Permitir segmentar incidencias por release desplegada en Railway.
4. Mantener privacidad: no exponer secretos ni PII sensible.
5. Integrarse sin romper arquitectura actual ni flujo de CI/CD.

---

## 3. Alcance

### Incluido

- Inicialización de Sentry en `apps/client`.
- Inicialización de Sentry en `apps/api`.
- Captura de excepciones en middleware global de errores (backend).
- Captura de errores React globales (boundary + router).
- Variables de entorno y guía de configuración para Railway.
- Documentación operativa para troubleshooting.

### No incluido (por ahora)

- Performance tracing avanzado (APM completo).
- Session Replay en frontend.
- Alertas automáticas complejas por canal (Slack/PagerDuty).
- Dashboard de métricas custom (Prometheus/Grafana).

---

## 4. Arquitectura Propuesta

```text
Frontend (React) ──► Sentry SaaS
Backend (Express) ─► Sentry SaaS
        │
        └─► Railway Logs (Pino JSON)
```

### 4.1 Frontend

- SDK: `@sentry/react` (+ integración con React Router).
- Inicialización en bootstrap de app.
- Enriquecer eventos con:
  - `environment`
  - `release` (tag de versión)
  - `feature flags` relevantes (sin secretos)

### 4.2 Backend

- SDK: `@sentry/node`.
- Inicialización temprana en arranque de servidor.
- Captura de errores en `errorHandler` antes de responder.
- Añadir tags de contexto:
  - `route`
  - `method`
  - `statusCode`
  - `release`

### 4.3 Correlación por release

- Usar versión de release (`vX.Y.Z`) como `SENTRY_RELEASE`.
- Cada despliegue en Railway debe propagar esa variable.
- Beneficio: identificar rápidamente en qué versión se introdujo un error.

---

## 5. Variables de Entorno

### Frontend (`apps/client`)

- `VITE_SENTRY_DSN`
- `VITE_ENV`
- `VITE_APP_VERSION`

### Backend (`apps/api`)

- `SENTRY_DSN`
- `NODE_ENV`
- `SENTRY_RELEASE`

> Regla: no hardcodear DSNs ni secretos en código.

---

## 6. Especificaciones TDD (Red Phase)

### Backend

1. Debe capturar excepción no controlada y reportarla a Sentry una vez.
2. Debe incluir `statusCode`, `method` y `url` como contexto.
3. No debe exponer stack trace al cliente en producción.
4. Si Sentry falla, la API debe responder igualmente (fallo no bloqueante).

### Frontend

1. Debe inicializar Sentry solo si existe `VITE_SENTRY_DSN`.
2. Debe reportar errores no capturados en componentes/rutas.
3. Debe incluir `environment` y `release` en cada evento.
4. Sin DSN, la app debe seguir funcionando sin errores.

---

## 7. Plan de Implementación (Green Phase)

1. **[BE] Configuración base**
   - Archivo: `apps/api/src/infrastructure/observability/sentry.ts`
   - Inicializar SDK y exponer helper de captura.

2. **[BE] Integración con error handler**
   - Archivo: `apps/api/src/middleware/errorHandler.ts`
   - Capturar error con contexto HTTP antes del `res.status(...).json(...)`.

3. **[BE] Bootstrap de servidor**
   - Archivo: `apps/api/src/index.ts`
   - Inicializar observabilidad al iniciar la app.

4. **[FE] Configuración base**
   - Archivo: `apps/client/src/infrastructure/observability/sentry.ts`
   - Inicializar `@sentry/react` condicionado a env.

5. **[FE] Integración en App entrypoint**
   - Archivo: `apps/client/src/main.tsx` o `apps/client/src/App.tsx`
   - Montar integración global y boundary principal.

6. **[Docs] Operación en Railway**
   - Archivos: `README.md` + `docs/github/ReleaseConventions.md`
   - Incluir setup de variables y flujo de validación post-deploy.

---

## 8. Criterios de Aceptación

- [ ] Error 500 en API visible en Sentry con ruta y método.
- [ ] Error en UI visible en Sentry con release y entorno.
- [ ] Aplicación sigue operativa si Sentry no está disponible.
- [ ] Configuración en Railway documentada y reproducible.
- [ ] Tests unitarios de integración mínima en verde.

---

## 9. Riesgos y Mitigaciones

1. **Riesgo:** ruido excesivo de eventos.
   - **Mitigación:** muestreo y filtros por severidad/entorno.

2. **Riesgo:** envío accidental de datos sensibles.
   - **Mitigación:** sanitizar payloads y excluir PII en contexto.

3. **Riesgo:** dependencia externa (SaaS).
   - **Mitigación:** integración no bloqueante + fallback a logs de Railway.

---

## 10. Rollout Recomendado

1. Activar primero en `staging`.
2. Validar eventos manuales controlados (frontend y backend).
3. Activar en `production` con muestreo conservador.
4. Revisar señales durante 1 semana y ajustar filtros.

---

## 11. Decisión

**Aprobado para siguiente iteración post-MVP** como mejora clave de operabilidad para despliegues en Railway.
