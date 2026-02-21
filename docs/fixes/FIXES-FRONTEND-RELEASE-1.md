# FIXES - Frontend Release 1

**Fecha:** 2026-02-21  
**Rama:** `main`  
**Scope:** `solution-sideby/apps/client`  
**Prioridad General:** Alta — bloqueos UX para primera release pública

---

## FIX-01 — Error Boundary Global + Error Page estándar

**Problema:** Los errores no capturados que hacen que la app muestre un objeto `[object Object]` o pantalla en blanco no tienen un tratamiento estándar. No existe un `ErrorBoundary` ni una ruta de error definida en el router.

**Solución:**

1. Crear un componente `ErrorBoundary` React (class component) en `src/shared/components/ErrorBoundary.tsx`.
2. Crear una página `ErrorPage` en `src/features/public/pages/ErrorPage.tsx` con:
   - Mensaje centrado: **"¡Vaya! Algo ha ocurrido de manera inesperada."**
   - Botón primario en el centro de la pantalla que redirija a `/home`.
3. Configurar `errorElement` en el router de React Router v6 (`AppRouter.tsx`) para capturar errores de rutas.
4. Envolver el `<RouterProvider>` en `App.tsx` con el `ErrorBoundary`.

**Archivos afectados:**
- `src/shared/components/ErrorBoundary.tsx` ← NUEVO
- `src/features/public/pages/ErrorPage.tsx` ← NUEVO
- `src/router/AppRouter.tsx` ← modificar: añadir `errorElement`
- `src/App.tsx` ← modificar: envolver con `ErrorBoundary`

**Regla de UX:**
- Errores globales (rompen rendering de página) → `ErrorPage` con botón a `/home`.
- Errores de componentes aislados (ej. AI Insights) → mensaje de error inline + botón de "Reintentar" (ver FIX-01b).

---

## FIX-01b — Botón de Reintentar en AI Insights

**Problema:** Cuando el widget de AI Insights falla (error de red, timeout, etc.), muestra el mensaje de error pero no hay forma de volver a intentarlo sin recargar la página.

**Solución:**

Añadir un botón de **"Reintentar"** dentro del estado de error del componente AI Insights que vuelva a ejecutar la query de React Query (`refetch`).

**Archivos afectados:**
- Buscar el componente AI Insights dentro de `src/features/dataset/components/dashboard/` o similar.
- Añadir prop/hook `onRetry` que llame al `refetch` de React Query.

---

## FIX-02 — DatasetsList: Limpieza de localStorage en el Wizard

**Problema:** El wizard guarda el estado parcial en `localStorage` al avanzar por los pasos. Esto causa que al volver al listado y crear un nuevo dataset, se precarguen datos del dataset anterior, generando inconsistencias.

**Solución:**

1. Identificar todas las claves de `localStorage` que usa el wizard (buscar con `grep localStorage` en `src/features/dataset/`).
2. Eliminar el uso de `localStorage` como mecanismo de persistencia del wizard.
3. Reemplazar por estado en memoria (Zustand store temporal o estado local del componente) que se limpie automáticamente al desmontar la página del wizard (`useEffect` cleanup o `store.reset()` en `useEffect` al montar).
4. Asegurarse de que al navegar a `/datasets/upload` el estado siempre empiece limpio.

**Archivos afectados:**
- `src/features/dataset/pages/DataUploadWizard.tsx`
- `src/features/dataset/hooks/` (hooks relacionados con el wizard)
- Cualquier store de Zustand que tenga persistencia con `persist` middleware para el wizard.

---

## FIX-02b — DatasetsList: Dataset en estado `processing` → redirigir a Wizard paso 2

**Problema:** Cuando un dataset se queda en estado `processing`, al hacer clic sobre la tarjeta (o en cualquier botón que no sea eliminar), el usuario es redirigido al dashboard del dataset, que está incompleto. Esto deja el listado en un estado inconsistente.

**Regla de negocio:** Un dataset `processing` no está listo para ver su dashboard. El usuario debe completar el alta desde el paso 2 del wizard.

**Solución:**

En `DatasetCard.tsx`, modificar el comportamiento del `onClick` del área principal y del botón de dashboard:

```tsx
// Lógica de navegación según estado
const handleOpen = (id: string) => {
  if (dataset.status === 'processing') {
    // Llevar al wizard paso 2 con el dataset ID como parámetro
    navigate(`/datasets/upload?step=2&datasetId=${id}`);
  } else {
    onOpen(id);
  }
};
```

- El botón de **Eliminar** conserva su comportamiento actual.
- En `DataUploadWizard.tsx`, leer los query params `step` y `datasetId` al montar para inicializar en el paso correcto y pre-cargar el dataset existente.

**Archivos afectados:**
- `src/features/dataset/components/DatasetCard.tsx`
- `src/features/dataset/pages/DataUploadWizard.tsx`

---

## FIX-02c — DatasetDetail (Edición): Ocultar campos de dimensión y fecha al actualizar dataset `ready`

**Problema:** Cuando un dataset ya está en estado `ready` y el usuario entra a editarlo, se siguen mostrando los campos de configuración estructural (`elegir dimensión`, `elegir fecha`). Estos campos no deberían ser modificables en una actualización; podrían romper la integridad del dataset.

**Solución:**

En la vista de edición del dataset (`DatasetDetail.tsx` y sus subcomponentes de `src/features/dataset/components/edit/`), añadir una condición:

```tsx
// Si el dataset está en estado 'ready', ocultar campos estructurales
const isUpdateMode = dataset.status === 'ready';
```

- **Mostrar siempre (modo update):** Título, Descripción, KPIs, AI Insights prompt.
- **Ocultar en modo update:** `GroupConfigFields` (dimensión/fecha), selección de archivos CSV.
- El componente `GeneralInfoFields.tsx` y `KPIFieldsSection.tsx` se muestran siempre.
- El componente `GroupConfigFields.tsx` se muestra condicionalmente.
- El componente `AIConfigFields.tsx` se muestra según feature flag (comportamiento actual).

**Archivos afectados:**
- `src/features/dataset/pages/DatasetDetail.tsx`
- `src/features/dataset/components/edit/GroupConfigFields.tsx`

---

## FIX-02d — DatasetCard: Cambiar icono del botón Dashboard por gráfico

**Problema:** El botón de acción "Abrir dashboard" en `DatasetCard.tsx` usa el icono `LayoutDashboard`, que visualmente no comunica claramente "ver gráficos/análisis".

**Solución:**

Reemplazar el icono `LayoutDashboard` por `BarChart2` o `LineChart` de `lucide-react` en el botón de acción del dashboard.

```tsx
// Antes
import { LayoutDashboard } from "lucide-react";
<LayoutDashboard className="h-4 w-4" />

// Después
import { BarChart2 } from "lucide-react";
<BarChart2 className="h-4 w-4" />
```

**Archivos afectados:**
- `src/features/dataset/components/DatasetCard.tsx`

---

## FIX-02e — Wizard Paso 3: Mover AI Insights al final de la pantalla

**Problema:** En el paso 3 del wizard (ConfigurationStep), el componente de AI Insights no se encuentra al final del formulario junto con los demás campos editables, sino en una posición que no respeta el flujo visual natural.

**Solución:**

En `src/features/dataset/components/wizard/ConfigurationStep.tsx`, reordenar el layout del formulario para que quede:

1. Información general (título, descripción)
2. Configuración de KPIs
3. **Al final:** AI Insights (respetando el feature flag `FEATURES.AI_INSIGHTS_ENABLED`)

Conservar la lógica de visibilidad condicional actual basada en `features.ts`.

**Archivos afectados:**
- `src/features/dataset/components/wizard/ConfigurationStep.tsx`

---

## FIX-03 — Landing Pública: Traducción completa al español

**Problema:** La landing page (`src/features/public/pages/Landing.tsx`) presenta textos mezclados en inglés y español, generando inconsistencia de idioma para el usuario hispanohablante.

**Solución:**

Revisar y traducir al español todos los textos hardcoded en `Landing.tsx`:
- Headlines, subtítulos, CTAs (Call To Action), descripciones de features, testimonios, etc.
- Mantener consistencia con el tono del resto de la aplicación.

**Archivos afectados:**
- `src/features/public/pages/Landing.tsx`

---

## FIX-03b — Landing Pública: Color del elemento Grupo B → naranja `data-comparative`

**Problema:** El elemento destacado en lila del "Grupo B" en la landing no utiliza el color corporativo correcto para datos comparativos. El color definido en el sistema de diseño para `data-comparative` (Grupo B) es **naranja**.

**Solución:**

Localizar el elemento del Grupo B en `Landing.tsx` que usa un color lila/violeta y reemplazarlo por la variable CSS `var(--color-data-comparative)` o el equivalente en Tailwind (consultar `STYLE_GUIDE_SIDEBY.md` para la clase exacta).

**Referencias:**
- Ver `docs/STYLE_GUIDE_SIDEBY.md` para la paleta de colores oficial.
- Variable CSS: `--color-data-comparative` (naranja).

**Archivos afectados:**
- `src/features/public/pages/Landing.tsx`
- Posiblemente `src/index.css` si la variable no está definida.

---

## FIX-03c — Landing Pública: Añadir páginas de Privacy, Terms y Contact

**Problema:** La landing referencia o debería referenciar páginas legales y de contacto que no existen aún en el router ni como componentes.

**Solución:**

### Páginas a crear

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/privacy` | `PrivacyPage.tsx` | Política de Privacidad estándar RGPD |
| `/terms` | `TermsPage.tsx` | Términos y Condiciones de uso |
| `/contact` | `ContactPage.tsx` | Formulario de contacto con EmailJS |

### Especificación de cada página

#### `PrivacyPage.tsx`
- Política de privacidad conforme al RGPD y legislación española.
- Responsable del tratamiento: SideBy, 2026.
- Mencionar: datos recogidos, finalidad, derechos del usuario (acceso, rectificación, supresión), cookies.

#### `TermsPage.tsx`
- Términos y Condiciones de uso estándar SaaS.
- Incluir: objeto del servicio, licencia de uso, limitación de responsabilidad, propiedad intelectual, ley aplicable (España).

#### `ContactPage.tsx`
- Formulario de contacto con los campos: **Nombre**, **Email**, **Asunto**, **Mensaje**.
- Envío mediante **EmailJS** (sin backend requerido).
  - Instalar: `npm install @emailjs/browser`
  - Variables de entorno necesarias (añadir a `.env.example`):
    ```
    VITE_EMAILJS_SERVICE_ID=
    VITE_EMAILJS_TEMPLATE_ID=
    VITE_EMAILJS_PUBLIC_KEY=
    ```
  - Email de destino: `maribel.quiros.formacion@gmail.com`
- Añadir información estática de contacto:
  - **Proyecto:** SideBy
  - **Año:** 2026
  - **Email:** maribel.quiros.formacion@gmail.com
- Validación de formulario con `react-hook-form` + `zod` (ya usados en el proyecto).
- Toast de confirmación al enviar correctamente.

### Ubicación de archivos
```
src/features/public/pages/
  ├── Landing.tsx          (existente)
  ├── ErrorPage.tsx        (nuevo, FIX-01)
  ├── PrivacyPage.tsx      (nuevo)
  ├── TermsPage.tsx        (nuevo)
  └── ContactPage.tsx      (nuevo)
```

### Actualizar Router
En `AppRouter.tsx`, añadir las rutas públicas (fuera de `ProtectedRoute`):
```tsx
{ path: '/privacy', element: <PrivacyPage /> },
{ path: '/terms',   element: <TermsPage /> },
{ path: '/contact', element: <ContactPage /> },
```

### Actualizar Footer de Landing
Añadir links en el footer de `Landing.tsx`:
```tsx
<Link to="/privacy">Política de Privacidad</Link>
<Link to="/terms">Términos de Uso</Link>
<Link to="/contact">Contacto</Link>
```

**Dependencias nuevas:**
- `@emailjs/browser` (ContactPage)

**Archivos afectados:**
- `src/features/public/pages/PrivacyPage.tsx` ← NUEVO
- `src/features/public/pages/TermsPage.tsx` ← NUEVO
- `src/features/public/pages/ContactPage.tsx` ← NUEVO
- `src/router/AppRouter.tsx` ← añadir rutas
- `src/features/public/index.ts` ← exportar nuevas páginas
- `Landing.tsx` ← añadir links en footer
- `.env.example` ← añadir variables EmailJS

---

## FIX-04 — Menú Lateral: Responsive / comportamiento móvil (Acordeón / Drawer)

**Problema:** El sidebar (`AppSidebar.tsx`) usa el componente `<Sidebar>` de shadcn/ui. En resoluciones móviles, el sidebar no se colapsa: ocupa espacio fijo y rompe el layout en pantallas pequeñas.

**Solución:**

El componente `<Sidebar>` de shadcn/ui ya incluye soporte para el comportamiento responsive mediante el hook `useSidebar()` y el componente `<SidebarTrigger>`. La solución es:

1. **Añadir `<SidebarTrigger>`** en el layout principal (`Home`, `DatasetsList`, etc.) o en el `<SidebarHeader>` para el botón de toggle en móvil.
2. Asegurarse de que el `<SidebarProvider>` envuelve correctamente el layout con el `defaultOpen` adecuado según el viewport.
3. El sidebar ya tiene la variante `"sidebar"` con soporte de `collapsible="offcanvas"` — activar esta prop en el componente `<Sidebar>`.

```tsx
// En AppSidebar.tsx
<Sidebar collapsible="offcanvas">  {/* Activa comportamiento drawer en móvil */}
  ...
</Sidebar>
```

4. En el layout de páginas protegidas, añadir un botón hamburguesa visible solo en móvil (`<SidebarTrigger className="md:hidden" />`).
5. **Conservar toda la funcionalidad:** Los items de menú, el logout, y la detección de ruta activa no cambian.

**Archivos afectados:**
- `src/shared/components/AppSidebar.tsx`
- Layout de páginas protegidas (buscar dónde se usa `<SidebarProvider>` y `<AppSidebar>`)
- Posiblemente `src/features/home/pages/Home.tsx` y `src/features/dataset/pages/DatasetsList.tsx`

---

## Resumen de Prioridades

| Fix | Descripción | Prioridad | Esfuerzo Estimado |
|-----|-------------|-----------|-------------------|
| FIX-01 | Error Boundary + Error Page global | 🔴 Crítica | S |
| FIX-01b | Botón Reintentar en AI Insights | 🟡 Media | XS |
| FIX-02 | Eliminar localStorage del Wizard | 🔴 Crítica | M |
| FIX-02b | Dataset `processing` → redirigir a Wizard paso 2 | 🔴 Crítica | S |
| FIX-02c | Ocultar campos estructura en edición `ready` | 🟡 Media | S |
| FIX-02d | Icono dashboard → gráfico en DatasetCard | 🟢 Baja | XS |
| FIX-02e | AI Insights al final del Wizard paso 3 | 🟡 Media | XS |
| FIX-03 | Traducir Landing al español | 🟡 Media | M |
| FIX-03b | Color Grupo B → naranja `data-comparative` | 🟢 Baja | XS |
| FIX-03c | Páginas Privacy, Terms, Contact + EmailJS | 🟡 Media | L |
| FIX-04 | Sidebar responsive (accordeón/drawer en móvil) | 🟡 Media | M |

**Leyenda esfuerzo:** XS < 1h | S 1-2h | M 2-4h | L 4-8h

---

## Orden de Implementación Sugerido

```
1. FIX-02d  → cambio trivial, ship rápido
2. FIX-01   → error boundary primero (seguridad de red)
3. FIX-01b  → botón retry AI Insights
4. FIX-02   → limpiar localStorage wizard
5. FIX-02b  → redirección processing → wizard paso 2
6. FIX-02c  → ocultar campos en edición ready
7. FIX-02e  → reordenar AI Insights en wizard paso 3
8. FIX-04   → sidebar responsive
9. FIX-03   → traducción landing
10. FIX-03b → color data-comparative
11. FIX-03c → páginas legales + contacto con EmailJS
```
