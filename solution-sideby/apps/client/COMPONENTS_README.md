# Componentes UI - SideBy

## 📦 Componentes Creados

Se han replicado los siguientes componentes del repositorio de referencia (SideBy-Design) adaptados a tu arquitectura:

### Componentes UI Base (`shared/components/ui/`)

1. **Badge** - Insignias con variantes para datos y estados
2. **Button** - Botones con múltiples variantes y tamaños
3. **Card** - Tarjetas con variantes (default, elevated, ghost, interactive, dataPrimary, dataComparative)
4. **Sidebar** - Sistema completo de sidebar con SidebarProvider, SidebarMenu, SidebarMenuButton, etc.

### Componentes de Negocio (`shared/components/`)

1. **AppSidebar** - Barra lateral de navegación principal con menús mockeados

## ⚡ Cambios Importantes

### 1. Animaciones Nativas (sin tailwindcss-animate)

**ANTES** (index.css con plugin):
```css
@import "tailwindcss";
@plugin "tailwindcss-animate";
```

**AHORA** (animaciones CSS puras):
```css
@import "tailwindcss";

@layer utilities {
  @keyframes fade-in { ... }
  @keyframes slide-in-from-right { ... }
  /* ... más animaciones */
}
```

**Acción requerida:** Puedes eliminar `tailwindcss-animate` del package.json si no se usa en otros lugares:

```bash
cd solution-sideby/apps/client
npm uninstall tailwindcss-animate
```

### 2. Variables de Color Completas

Se han agregado todas las variables necesarias al `index.css`:

- Variables de sidebar (`--color-sidebar-*`)
- Variables de data visualization (`--color-data-*`, `--color-chart-*`)
- Sombras personalizadas (`--shadow-subtle`, `--shadow-soft`, `--shadow-elevated`)
- Colores semánticos completos (green, amber para success/warning)

### 3. Utilidad `cn()`

Se creó la utilidad estándar para combinar clases CSS:

```typescript
// shared/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 🎨 Uso de los Componentes

### Ejemplo: Home con Sidebar

```tsx
import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/AppSidebar";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

function Home() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <Card variant="elevated">
            <CardContent className="p-6">
              <h2>Contenido</h2>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
```

### Variantes de Card

```tsx
<Card variant="default">Base</Card>
<Card variant="elevated">Con sombra elevada en hover</Card>
<Card variant="ghost">Sin bordes</Card>
<Card variant="interactive">Clickeable</Card>
<Card variant="dataPrimary">Borde azul para datos primarios</Card>
<Card variant="dataComparative">Borde índigo para comparativas</Card>
```

### Variantes de Badge

```tsx
<Badge variant="default">Normal</Badge>
<Badge variant="secondary">Secundario</Badge>
<Badge variant="success">+23.7%</Badge>
<Badge variant="warning">Alerta</Badge>
<Badge variant="dataPrimary">Actual</Badge>
<Badge variant="dataComparative">Comparativo</Badge>
```

### Variantes de Button

```tsx
<Button variant="default">Primario</Button>
<Button variant="outline">Outlined</Button>
<Button variant="ghost">Transparente</Button>
<Button variant="destructive">Eliminar</Button>
<Button size="sm">Pequeño</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><Icon /></Button>
```

## 🔧 Funcionalidad Mockeada

Los siguientes elementos tienen implementación mock:

1. **AppSidebar - handleLogout()**: 
   ```typescript
   const handleLogout = () => {
     console.log("pendiente de implementar: logout");
     // TODO: Integrar con auth service
   };
   ```

2. **Navegación**: Los links del sidebar funcionan pero las rutas deben ser configuradas en tu Router.

## 📁 Estructura de Archivos Creados/Modificados

```
solution-sideby/apps/client/
├── src/
│   ├── index.css                          # ✅ Actualizado con animaciones y variables
│   ├── shared/
│   │   ├── utils/
│   │   │   ├── cn.ts                      # ✅ Creado
│   │   │   └── index.ts                   # ✅ Actualizado
│   │   └── components/
│   │       ├── ui/
│   │       │   ├── badge.tsx              # ✅ Creado
│   │       │   ├── button.tsx             # ✅ Actualizado
│   │       │   ├── card.tsx               # ✅ Actualizado
│   │       │   ├── sidebar.tsx            # ✅ Creado
│   │       │   └── index.ts               # ✅ Creado
│   │       ├── AppSidebar.tsx             # ✅ Creado
│   │       └── index.ts                   # ✅ Creado
│   └── features/
│       └── dashboard/
│           └── pages/
│               └── Home.tsx               # ✅ Actualizado
```

## 🎯 Próximos Pasos

1. **Eliminar tailwindcss-animate** del package.json si no se usa en otros lugares
2. **Configurar rutas** para los links del sidebar
3. **Implementar logout** real conectando con el backend
4. **Añadir más componentes UI** según necesites (Input, Select, Dialog, etc.)
5. **Crear componentes de dominio** (KPICard, RevenueChart, etc.) basándote en estos primitivos

## 🐛 Solución de Problemas

### Error: "Cannot find module '@/shared/utils'"

Asegúrate de que tu `tsconfig.json` tiene configurado el path alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Error: "Cannot find module 'clsx' or 'tailwind-merge'"

Instala las dependencias faltantes:

```bash
npm install clsx tailwind-merge class-variance-authority
npm install @radix-ui/react-slot
```

### Animaciones no funcionan

Verifica que el archivo `index.css` esté importado en tu `main.tsx`:

```tsx
import './index.css'
```

## 📚 Referencias

- [SideBy Style Guide](../../../docs/STYLE_GUIDE_SIDEBY.md)
- [Repositorio de referencia: SideBy-Design](../../SideBy-Design)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
