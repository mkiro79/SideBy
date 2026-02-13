# 🚀 Prompt para el Agente Frontend - Phase 1: React Query Migration (Día 1 - Mañana)

---

## 📋 Contexto

Vas a implementar la **migración a TanStack Query v5** para el manejo de server state en el frontend de SideBy. Esta migración es **prerequisito obligatorio** para RFC-004 (Dashboard Template System).

**RFC de Referencia:** `docs/design/RFC-React-Query-Migration.md`

**Objetivo:** Reemplazar los hooks manuales basados en `useState` + `useEffect` por React Query, eliminando ~300 líneas de boilerplate y añadiendo cache automático, optimistic updates e invalidación inteligente.

---

## ✅ Tareas del Día 1 - Mañana (Phase 1: Setup Foundation)

### Task 1.1: Instalación de Dependencias

```bash
cd C:\Proyectos\SideBy\solution-sideby\apps\client
npm install @tanstack/react-query@^5.0.0 @tanstack/react-query-devtools@^5.0.0
```

**Criterio de éxito:** `package.json` debe incluir ambas dependencias en versión ^5.0.0

---

### Task 1.2: Crear QueryClient Configuration

**Archivo a crear:** `solution-sideby/apps/client/src/infrastructure/api/queryClient.ts`

```typescript
/**
 * TanStack Query Client Configuration
 * 
 * Configuración centralizada para el manejo de server state.
 * Define políticas de cache, retry y revalidación para toda la app.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente de React Query configurado con políticas de SideBy
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache válido por 5 minutos
      staleTime: 5 * 60 * 1000,
      
      // Guardar en cache por 10 minutos después de que quede stale
      gcTime: 10 * 60 * 1000,
      
      // Reintentar 1 vez en caso de error
      retry: 1,
      
      // Revalidar al volver a la ventana
      refetchOnWindowFocus: true,
      
      // No revalidar al reconectar (evita requests excesivos)
      refetchOnReconnect: false,
    },
    mutations: {
      // No reintentar mutations (operaciones write)
      retry: 0,
    },
  },
});
```

**Criterio de éxito:** Archivo creado con configuración correcta, sin errores de TypeScript

---

### Task 1.3: Integrar QueryClientProvider en App.tsx

**Archivo a modificar:** `solution-sideby/apps/client/src/App.tsx`

**Modificaciones requeridas:**

1. Importar `QueryClientProvider` y `ReactQueryDevtools`
2. Importar `queryClient` del archivo creado
3. Wrappear todo el contenido con `QueryClientProvider`
4. Añadir DevTools condicionalmente (solo en desarrollo)

**Estructura esperada:**

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/infrastructure/api/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Contenido existente del App */}
      
      {/* DevTools solo en desarrollo */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

export default App;
```

**Criterio de éxito:** 
- App renderiza correctamente
- DevTools aparecen en esquina inferior derecha en modo desarrollo
- No hay errores en consola

---

### Task 1.4: Crear Test Utils para React Query

**Archivo a crear:** `solution-sideby/apps/client/src/test/utils/react-query.tsx`

```typescript
/**
 * Test utilities para React Query
 * 
 * Proporciona helpers para wrappear componentes y hooks
 * con QueryClientProvider en tests.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

/**
 * Crea un QueryClient para tests con configuración apropiada
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // No retry en tests
        gcTime: Infinity, // No garbage collection en tests
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Silenciar errores esperados en tests
    },
  });
}

/**
 * Wrapper para tests de componentes que usan React Query
 */
export function createQueryClientWrapper() {
  const testQueryClient = createTestQueryClient();
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Criterio de éxito:** Archivo creado, exporta ambas funciones sin errores

---

### Task 1.5: Verificar Setup con Test Simple

**Archivo a crear:** `solution-sideby/apps/client/src/infrastructure/api/__tests__/queryClient.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { queryClient } from '../queryClient';

describe('QueryClient Configuration', () => {
  it('debe tener configuración correcta para queries', () => {
    const config = queryClient.getDefaultOptions().queries;
    
    expect(config?.staleTime).toBe(5 * 60 * 1000); // 5 minutos
    expect(config?.retry).toBe(1);
    expect(config?.refetchOnWindowFocus).toBe(true);
  });

  it('debe tener configuración correcta para mutations', () => {
    const config = queryClient.getDefaultOptions().mutations;
    
    expect(config?.retry).toBe(0);
  });
});
```

**Comando para ejecutar:**
```bash
npm test -- queryClient.test.ts
```

**Criterio de éxito:** Test pasa sin errores

---

## 🎯 Checklist del Día 1 - Mañana

- [ ] Dependencias instaladas (`@tanstack/react-query` + devtools)
- [ ] `queryClient.ts` creado con configuración correcta
- [ ] `App.tsx` modificado con `QueryClientProvider` wrapper
- [ ] DevTools visibles en desarrollo (esquina inferior derecha)
- [ ] Test utils creados (`createTestQueryClient`, `createQueryClientWrapper`)
- [ ] Test de configuración pasa correctamente
- [ ] No hay errores de TypeScript en el proyecto
- [ ] No hay errores en consola del navegador
- [ ] DevTools muestran "No queries found" (esperado, aún no hay queries)

---

## 📍 Estado Esperado al Finalizar

✅ **Infraestructura completa de React Query lista**  
✅ **Tests utilities configurados**  
✅ **App funciona igual que antes (sin cambios en comportamiento)**  
✅ **Listo para migrar hooks en Día 1 - Tarde**

---

## 🚨 Notas Importantes

1. **NO modifiques hooks existentes todavía** (useDatasets, useDataset) - eso es para la tarde
2. **NO cambies componentes existentes** - solo setup de infraestructura
3. **Mantén compatibilidad hacia atrás** - el app debe funcionar igual
4. **Usa alias `@/`** para imports (convención del proyecto)
5. **Comenta en español** según convenciones del proyecto
6. **Ejecuta tests después de cada cambio** para validar

---

## ❓ Si Encuentras Problemas

**Problema:** "Module not found @tanstack/react-query"  
**Solución:** Verifica que ejecutaste npm install en el directorio correcto (`apps/client`)

**Problema:** "Cannot find module '@/infrastructure/api/queryClient'"  
**Solución:** Verifica que el path alias `@` esté configurado en `vite.config.ts` y `tsconfig.json`

**Problema:** DevTools no aparecen  
**Solución:** Verifica que `import.meta.env.DEV` sea true (estás en modo desarrollo)

---

## ✨ Siguiente Paso

Una vez completado este setup, reporta **"Phase 1 completada"** y continúa con el siguiente prompt:  
📄 **`docs/design/prompts/PHASE-2-REACT-QUERY-QUERIES.md`**

---

**¿Listo para comenzar? Ejecuta las tareas en orden y reporta cuando termines cada una. ¡Éxito! 🚀**
