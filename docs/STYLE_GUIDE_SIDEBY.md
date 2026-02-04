# SideBy Design System - Style Guide (Tailwind v4 Ready)

> 🎨 **Sistema de diseño basado en Linear/Vercel aesthetics**  
> Esta guía permite replicar exactamente los componentes y estilos de SideBy-Design en cualquier proyecto frontend React + TypeScript con Tailwind CSS v4.

---

## 📚 Índice

1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Arquitectura de Componentes](#arquitectura-de-componentes)
3. [Tokens de Diseño (Design Tokens)](#tokens-de-diseño-design-tokens)
4. [Migración a Tailwind v4](#migración-a-tailwind-v4)
5. [Componentes Base (Atoms)](#componentes-base-atoms)
6. [Componentes Compuestos (Molecules)](#componentes-compuestos-molecules)
7. [Patrones de Uso](#patrones-de-uso)
8. [Accesibilidad](#accesibilidad)
9. [Animaciones y Transiciones](#animaciones-y-transiciones)

---

## Filosofía de Diseño

### Principios Core

1. **Minimalismo Funcional**: Interfaces limpias que priorizan la legibilidad de datos.
2. **Jerarquía Visual Clara**: Uso de peso tipográfico, espaciado y color para crear capas de información.
3. **Mobile-First**: Diseño responsivo desde pantallas pequeñas hacia arriba.
4. **Accesibilidad Nativa**: WCAG AA por defecto, HTML semántico, navegación por teclado.
5. **Performance**: Animaciones sutiles (< 300ms), optimización de re-renders.

### Inspiración Visual

- **Linear**: Bordes sutiles, sombras suaves, tipografía Inter, espaciado generoso.
- **Vercel**: Paleta de grises, acentos vibrantes, tarjetas elevadas, estados hover refinados.

---

## Arquitectura de Componentes

### Estructura de Directorios

```
src/
├── components/
│   ├── ui/              # Componentes primitivos (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   └── [business]/      # Componentes de dominio
│       ├── KPICard.tsx
│       ├── RevenueChart.tsx
│       └── ...
├── lib/
│   └── utils.ts         # cn() utility
└── hooks/               # Custom hooks (lógica separada)
```

### Separación de Responsabilidades

```tsx
// ❌ MAL: Lógica mezclada en el componente
export function KPICard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/kpi").then((res) => res.json()).then(setData);
  }, []);
  return <Card>...</Card>;
}

// ✅ BIEN: Lógica en custom hook, componente puro
export function KPICard({ title, value, change }: KPICardProps) {
  return <Card>...</Card>;
}

// En otro archivo (hooks/useKPIData.ts)
export function useKPIData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/kpi").then((res) => res.json()).then(setData);
  }, []);
  return data;
}
```

---

## Tokens de Diseño (Design Tokens)

### 1. Paleta de Colores (CSS Variables)

#### Light Mode

```css
:root {
  /* Core Surfaces */
  --background: 0 0% 100%;           /* #FFFFFF */
  --foreground: 222 47% 11%;          /* #0F172A - Texto principal */
  
  --card: 0 0% 100%;                  /* #FFFFFF */
  --card-foreground: 222 47% 11%;
  
  /* Surface Variants */
  --surface: 210 20% 98%;             /* #F8FAFC - Fondos suaves */
  --surface-elevated: 0 0% 100%;      /* #FFFFFF - Elevación */
  --surface-muted: 220 14% 96%;       /* #F1F5F9 - Estados disabled */

  /* Primary - Slate Dark */
  --primary: 222 47% 11%;             /* #0F172A */
  --primary-foreground: 210 40% 98%;  /* #F8FAFC */

  /* Secondary - Light Gray */
  --secondary: 220 14% 96%;           /* #F1F5F9 */
  --secondary-foreground: 222 47% 11%;

  /* Muted */
  --muted: 220 14% 96%;               /* #F1F5F9 */
  --muted-foreground: 215 16% 47%;    /* #64748B - Texto secundario */

  /* Accent */
  --accent: 220 14% 96%;              /* #F1F5F9 */
  --accent-foreground: 222 47% 11%;

  /* Destructive */
  --destructive: 0 84% 60%;           /* #EF4444 - Rojo */
  --destructive-foreground: 0 0% 100%;

  /* Data Visualization */
  --data-primary: 217 91% 60%;        /* #3B82F6 - Azul brillante */
  --data-primary-foreground: 0 0% 100%;
  
  --data-comparative: 25 95% 53%;     /* #F97316 - Naranja */
  --data-comparative-foreground: 0 0% 100%;
  
  --data-success: 142 76% 36%;        /* #22C55E - Verde */
  --data-warning: 38 92% 50%;         /* #EAB308 - Amarillo */
  --data-neutral: 215 16% 47%;        /* #64748B - Gris */

  /* Borders & Inputs */
  --border: 220 13% 91%;              /* #E2E8F0 */
  --input: 220 13% 91%;
  --ring: 217 91% 60%;                /* #3B82F6 - Focus ring */

  --radius: 0.5rem;                   /* 8px - Border radius base */

  /* Sidebar */
  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 222 47% 11%;
  --sidebar-primary: 222 47% 11%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 220 14% 96%;
  --sidebar-accent-foreground: 222 47% 11%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 217 91% 60%;
}
```

#### Dark Mode

```css
.dark {
  --background: 224 71% 4%;           /* #020817 */
  --foreground: 213 31% 91%;          /* #E2E8F0 */

  --card: 224 71% 4%;
  --card-foreground: 213 31% 91%;

  --surface: 223 47% 11%;             /* #1E293B */
  --surface-elevated: 224 47% 8%;     /* #0F172A */
  --surface-muted: 223 47% 14%;       /* #334155 */

  --primary: 210 40% 98%;             /* #F8FAFC */
  --primary-foreground: 222 47% 11%;  /* #0F172A */

  --secondary: 223 47% 11%;
  --secondary-foreground: 213 31% 91%;

  --muted: 223 47% 11%;
  --muted-foreground: 215 20% 65%;    /* #94A3B8 */

  --accent: 223 47% 11%;
  --accent-foreground: 213 31% 91%;

  --destructive: 0 63% 31%;           /* #991B1B */
  --destructive-foreground: 210 40% 98%;

  --data-primary: 217 91% 60%;        /* Same as light - auto-contrasts */
  --data-comparative: 25 95% 53%;

  --border: 223 47% 14%;
  --input: 223 47% 14%;
  --ring: 217 91% 60%;

  --sidebar-background: 224 71% 4%;
  --sidebar-foreground: 213 31% 91%;
  --sidebar-primary: 217 91% 60%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 223 47% 11%;
  --sidebar-accent-foreground: 213 31% 91%;
  --sidebar-border: 223 47% 14%;
  --sidebar-ring: 217 91% 60%;
}
```

### 2. Tipografía

```js
// tailwind.config (v3) → @theme (v4)
fontFamily: {
  sans: [
    "Inter",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif"
  ],
}

// Font Features (OpenType)
body {
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}
```

#### Escala Tipográfica

| Elemento  | Clase Tailwind         | Tamaño  | Peso    | Uso                          |
|-----------|------------------------|---------|---------|------------------------------|
| H1        | `text-4xl font-bold`   | 36px    | 700     | Títulos principales          |
| H2        | `text-3xl font-semibold` | 30px  | 600     | Secciones de página          |
| H3        | `text-2xl font-semibold` | 24px  | 600     | Card titles                  |
| Body      | `text-base`            | 16px    | 400     | Texto general                |
| Small     | `text-sm`              | 14px    | 400/500 | Labels, metadata             |
| XSmall    | `text-xs`              | 12px    | 400/500 | Badges, tags                 |
| KPI Value | `text-3xl font-semibold tracking-tight` | 30px | 600 | Valores numéricos grandes |

### 3. Espaciado (Spacing)

Usa el sistema de espaciado de Tailwind por defecto (escala 4px):

```
0.5 → 2px    gap-0.5, p-0.5
1   → 4px    gap-1, p-1
2   → 8px    gap-2, p-2 (mínimo recomendado para padding)
3   → 12px   gap-3, p-3
4   → 16px   gap-4, p-4 (estándar para componentes)
5   → 20px   gap-5, p-5 (espaciado generoso)
6   → 24px   gap-6, p-6 (padding de Cards por defecto)
8   → 32px   gap-8, p-8
```

**Regla**: Usar múltiplos de 4px para consistencia visual. Evitar valores arbitrarios como `p-[17px]`.

### 4. Border Radius

```js
borderRadius: {
  lg: "var(--radius)",           // 8px (0.5rem)
  md: "calc(var(--radius) - 2px)", // 6px
  sm: "calc(var(--radius) - 4px)", // 4px
}
```

- **Cards, Buttons**: `rounded-lg` (8px)
- **Inputs, Badges**: `rounded-md` (6px)
- **Small Pills**: `rounded-full`

### 5. Sombras (Shadows)

```js
boxShadow: {
  subtle: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
  soft: "0 2px 8px -2px rgb(0 0 0 / 0.05), 0 4px 12px -4px rgb(0 0 0 / 0.05)",
  elevated: "0 4px 16px -4px rgb(0 0 0 / 0.08), 0 8px 24px -8px rgb(0 0 0 / 0.06)",
}
```

**Uso**:
- `shadow-subtle`: Cards en estado normal.
- `shadow-soft`: Cards en hover.
- `shadow-elevated`: Modals, dropdowns, popovers.

---

## Migración a Tailwind v4

### Cambios Clave de v3 → v4

#### 1. Configuración (CSS-first)

**Tailwind v3** usa `tailwind.config.ts`:

```ts
// tailwind.config.ts (v3)
export default {
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",
      }
    }
  }
}
```

**Tailwind v4** usa `@theme` en CSS:

```css
/* styles.css (v4) */
@import "tailwindcss";

@theme {
  --color-primary: hsl(222 47% 11%);
  --font-sans: Inter, system-ui, sans-serif;
  --radius-lg: 0.5rem;
}
```

#### 2. Variables CSS

**En v3**: Se usan variables HSL con `hsl(var(--primary))`.  
**En v4**: Se pueden usar directamente en `@theme` o mantener el patrón HSL.

**Recomendación**: Mantener variables CSS en `:root` para compatibilidad con modo oscuro:

```css
/* styles.css (v4) */
@import "tailwindcss";

@layer base {
  :root {
    --primary: 222 47% 11%;
  }
  
  .dark {
    --primary: 210 40% 98%;
  }
}

@theme {
  --color-primary: hsl(var(--primary));
}
```

#### 3. Plugins

**v3**: Se instalan como paquetes npm.  
**v4**: Muchos plugins están integrados nativamente (como `@tailwindcss/forms` → `@theme { --form-field-* }`).

**Migration Path**:

```bash
# v3
npm install tailwindcss@latest tailwindcss-animate

# v4
npm install tailwindcss@next @tailwindcss/vite@next
# tailwindcss-animate → migrar a @keyframes nativos en @layer utilities
```

#### 4. Conversión de `tailwind.config.ts` a `@theme`

```ts
// ANTES (v3 - tailwind.config.ts)
export default {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
      },
      borderRadius: {
        lg: "var(--radius)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        }
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
      }
    }
  }
}
```

```css
/* DESPUÉS (v4 - styles.css) */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-border: hsl(220 13% 91%);
  
  /* Radius */
  --radius-lg: 0.5rem;
  --radius-md: calc(0.5rem - 2px);
  --radius-sm: calc(0.5rem - 4px);
}

@layer utilities {
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.4s ease-out;
  }
}
```

---

## Componentes Base (Atoms)

### 1. Button

**Archivo**: `components/ui/button.tsx`

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

**Uso**:

```tsx
<Button variant="default">Guardar</Button>
<Button variant="outline" size="sm">Cancelar</Button>
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

### 2. Card

**Archivo**: `components/ui/card.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-lg bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border shadow-subtle",
        elevated: "border shadow-soft hover:shadow-elevated",
        ghost: "border-0 shadow-none",
        interactive: "border shadow-subtle hover:shadow-soft hover:border-border/80 cursor-pointer",
        dataPrimary: "border-l-4 border-l-data-primary border shadow-subtle",
        dataComparative: "border-l-4 border-l-data-comparative border shadow-subtle",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
```

**Uso**:

```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Dashboard</CardTitle>
    <CardDescription>Resumen de métricas clave</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### 3. Badge

**Archivo**: `components/ui/badge.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Data visualization badges
        dataPrimary: "border-transparent bg-data-primary/10 text-data-primary",
        dataComparative: "border-transparent bg-data-comparative/10 text-data-comparative",
        success: "border-transparent bg-data-success/10 text-data-success",
        warning: "border-transparent bg-data-warning/10 text-data-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps 
  extends React.HTMLAttributes<HTMLDivElement>, 
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

**Uso**:

```tsx
<Badge variant="success">+23.7%</Badge>
<Badge variant="destructive">-12.4%</Badge>
<Badge variant="dataPrimary">Dataset Actual</Badge>
```

---

## Componentes Compuestos (Molecules)

### KPICard

**Archivo**: `components/KPICard.tsx`

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  currentValue: string | number;
  comparativeValue: string | number;
  percentageChange: number;
  icon: LucideIcon;
  className?: string;
}

export function KPICard({
  title,
  currentValue,
  comparativeValue,
  percentageChange,
  icon: Icon,
  className,
}: KPICardProps) {
  const isPositive = percentageChange > 0;
  const isNegative = percentageChange < 0;
  const isNeutral = percentageChange === 0;

  const getTrendIcon = () => {
    if (isPositive) return <TrendingUp className="h-3 w-3" />;
    if (isNegative) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getBadgeVariant = (): "success" | "destructive" | "secondary" => {
    if (isPositive) return "success";
    if (isNegative) return "destructive";
    return "secondary";
  };

  return (
    <Card className={cn("animate-fade-in", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <p className="text-3xl font-semibold tracking-tight">{currentValue}</p>
              <p className="text-sm text-muted-foreground">
                vs. {comparativeValue}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <Badge variant={getBadgeVariant()} className="gap-1">
              {getTrendIcon()}
              {isPositive ? "+" : ""}
              {percentageChange}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Uso**:

```tsx
import { DollarSign, ShoppingCart, Users } from "lucide-react";

<KPICard
  title="Ventas Totales"
  currentValue="$245K"
  comparativeValue="$198K"
  percentageChange={23.7}
  icon={DollarSign}
/>

<KPICard
  title="Clientes Activos"
  currentValue="1,247"
  comparativeValue="1,156"
  percentageChange={7.9}
  icon={Users}
/>
```

### DataIndicator (Legend para gráficos)

**Archivo**: `components/DataIndicator.tsx`

```tsx
import { cn } from "@/lib/utils";

interface DataIndicatorProps {
  variant: "primary" | "comparative";
  label: string;
  className?: string;
}

export function DataIndicator({ variant, label, className }: DataIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "h-3 w-3 rounded-full",
          variant === "primary" && "bg-data-primary",
          variant === "comparative" && "bg-data-comparative"
        )}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
```

---

## Patrones de Uso

### 1. Composición con `cn()` Utility

**Archivo**: `lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Por qué**: `clsx` permite condicionales, `twMerge` resuelve conflictos de Tailwind.

```tsx
// ✅ CORRECTO
<div className={cn(
  "flex items-center",
  isActive && "bg-primary text-white",
  className // Props del padre
)} />

// ❌ EVITAR
<div className={`flex items-center ${isActive ? "bg-primary" : ""} ${className}`} />
```

### 2. Responsive Design (Mobile-First)

```tsx
// ✅ CORRECTO: De móvil a desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Móvil: 1 columna, Tablet: 2, Desktop: 4 */}
</div>

// ❌ EVITAR: Desktop-first con max-width
<div className="grid grid-cols-4 max-md:grid-cols-2 max-sm:grid-cols-1">
```

### 3. Manejo de Variantes (CVA)

Usa `class-variance-authority` para componentes con múltiples variantes:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const alertVariants = cva(
  "rounded-lg border p-4", // Base classes
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "bg-destructive/10 text-destructive border-destructive/30",
      },
      size: {
        default: "p-4",
        sm: "p-3 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    }
  }
);

interface AlertProps extends VariantProps<typeof alertVariants> {
  children: React.ReactNode;
}

export function Alert({ variant, size, children }: AlertProps) {
  return <div className={alertVariants({ variant, size })}>{children}</div>;
}
```

### 4. Animaciones Sutiles

```tsx
// Fade-in al cargar
<Card className="animate-fade-in">

// Hover lift effect
<Card className="hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200">

// Scale in (modals)
<Dialog className="animate-scale-in">
```

### 5. Estados de Loading (Skeleton)

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Mientras carga data
{isLoading ? (
  <Skeleton className="h-24 w-full rounded-lg" />
) : (
  <KPICard {...data} />
)}
```

---

## Accesibilidad

### Checklist por Componente

#### Button
- ✅ Usa `<button>` nativo (no `<div onClick>`)
- ✅ Estados focus visibles (`focus-visible:ring-2`)
- ✅ Disabled correctamente (`disabled:opacity-50 disabled:pointer-events-none`)
- ✅ Iconos con texto o `aria-label`:

```tsx
// ❌ MAL
<Button size="icon"><X /></Button>

// ✅ BIEN
<Button size="icon" aria-label="Cerrar">
  <X />
</Button>
```

#### Card
- ✅ Usar `<article>` o `<section>` si contiene contenido standalone
- ✅ Títulos jerárquicos (`<h2>`, `<h3>`, no saltar niveles)

#### Forms
- ✅ `<label>` siempre asociado con `<input>` (vía `htmlFor` o wrapping)
- ✅ Mensajes de error vinculados con `aria-describedby`
- ✅ Estados required con `required` attribute y `aria-required`

```tsx
<div>
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    required 
    aria-describedby="email-error"
  />
  {error && <p id="email-error" className="text-sm text-destructive">{error}</p>}
</div>
```

#### Navigation
- ✅ Usar `<nav>` para menús principales
- ✅ Indicar página activa con `aria-current="page"`
- ✅ Navegación por teclado (Tab, Enter, Esc)

### Contraste de Color (WCAG AA)

Todos los pares de colores cumplen ratio 4.5:1 (texto normal) y 3:1 (texto grande/íconos):

| Par                     | Ratio | Estado |
|-------------------------|-------|--------|
| `foreground/background` | 16:1  | ✅ AAA |
| `muted-foreground/background` | 7:1 | ✅ AA  |
| `primary/primary-foreground` | 12:1 | ✅ AAA |

---

## Animaciones y Transiciones

### Keyframes Definidas

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
```

### Clases de Utilidad

```css
.animate-fade-in { animation: fade-in 0.4s ease-out; }
.animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
.animate-scale-in { animation: scale-in 0.2s ease-out; }
.animate-accordion-down { animation: accordion-down 0.2s ease-out; }
.animate-accordion-up { animation: accordion-up 0.2s ease-out; }
```

### Timing Guidelines

- **Micro-interacciones (hover, focus)**: 150-200ms
- **Transiciones de contenido (fade, slide)**: 300-400ms
- **Modals, overlays**: 200-250ms
- **Accordions**: 200ms (fast collapse/expand)

```tsx
// Transición estándar
<div className="transition-colors duration-200 hover:bg-accent">

// Transición múltiple
<div className="transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
```

---

## Guía de Instalación en Nuevo Proyecto

### 1. Setup Inicial (Tailwind v4)

```bash
# Crear proyecto React + TypeScript
npm create vite@latest my-app -- --template react-ts
cd my-app

# Instalar Tailwind v4 (next)
npm install -D tailwindcss@next @tailwindcss/vite@next
npm install clsx tailwind-merge class-variance-authority
npm install lucide-react @radix-ui/react-slot
```

### 2. Configurar Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 3. Configurar Styles (v4)

```css
/* src/index.css */
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@layer base {
  :root {
    /* Copiar todas las variables del bloque de Tokens arriba */
  }
  
  .dark {
    /* Copiar todas las variables del bloque Dark Mode */
  }
}

@layer base {
  * {
    border-color: hsl(var(--border));
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-semibold tracking-tight;
  }
}

@layer utilities {
  /* Copiar animaciones y utilidades custom */
}

/* Focus, scrollbar, etc. */
```

### 4. Configurar `@theme` (opcional en v4)

Si prefieres definir tokens en CSS en lugar de variables:

```css
@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  
  --color-primary: hsl(222 47% 11%);
  --color-primary-foreground: hsl(210 40% 98%);
  
  --radius-lg: 0.5rem;
  --radius-md: calc(0.5rem - 2px);
  --radius-sm: calc(0.5rem - 4px);
  
  --shadow-subtle: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  --shadow-soft: 0 2px 8px -2px rgb(0 0 0 / 0.05);
  --shadow-elevated: 0 4px 16px -4px rgb(0 0 0 / 0.08);
}
```

### 5. Copiar `lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 6. Implementar Componentes Base

Copiar los componentes de la sección "Componentes Base" a `src/components/ui/`:

- `button.tsx`
- `card.tsx`
- `badge.tsx`
- (Agregar según necesidad: input, select, dialog, etc.)

---

## Recursos Adicionales

### Librerías Complementarias

```bash
# Iconos
npm install lucide-react

# Radix UI (primitivos accesibles)
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-popover

# Gráficos
npm install recharts

# Animaciones avanzadas
npm install framer-motion

# Forms
npm install react-hook-form zod @hookform/resolvers
```

### shadcn/ui (alternativa a copiar)

Si prefieres NO copiar componentes manualmente, usa shadcn/ui CLI:

```bash
npx shadcn@latest init

# Configurar:
# - Style: New York
# - Color: Slate
# - CSS variables: Yes

npx shadcn@latest add button card badge input select
```

**IMPORTANTE**: Los componentes generados por shadcn deben ajustarse a los tokens de SideBy (modificar colores en `index.css`).

---

## Checklist de Replicación

Al replicar SideBy-Design en otro proyecto, verifica:

- [ ] Tailwind v4 configurado (o v3 con config compatible)
- [ ] Variables CSS copiadas (`:root` y `.dark`)
- [ ] Fuente Inter instalada desde Google Fonts
- [ ] `cn()` utility en `lib/utils.ts`
- [ ] Componentes base (`button`, `card`, `badge`) creados
- [ ] Animaciones (`@keyframes`) y utilidades copiadas
- [ ] Componentes de dominio (`KPICard`, `DataIndicator`) adaptados
- [ ] Accesibilidad verificada (focus states, aria-labels)
- [ ] Responsividad mobile-first testeada (breakpoints `md:`, `lg:`)
- [ ] Dark mode funcional (toggle con clase `.dark` en `<html>`)

---

## Soporte y Mantenimiento

### Actualizaciones de Componentes

**NUNCA edites manualmente** componentes en `components/ui/` si usas shadcn. Para cambios:

1. Modifica tokens en `index.css` (colores, espaciado, etc.)
2. Regenera componente: `npx shadcn@latest add [component] --overwrite`
3. Ajusta variantes en componentes de dominio (`KPICard`, etc.)

### Migración de Proyectos Existentes

Si tu proyecto ya usa Tailwind v3:

1. **No migres aún a v4** (está en alpha/beta en 2024).
2. Usa la configuración de `tailwind.config.ts` provista arriba (compatible v3).
3. Cuando v4 sea estable (2025+), sigue la guía oficial: [tailwindcss.com/docs/upgrade-guide](https://tailwindcss.com)

---

## Conclusión

Esta guía te permite replicar **pixel-perfect** la experiencia visual y arquitectura de SideBy-Design en cualquier proyecto React + TypeScript. Prioriza:

- **Consistencia**: Usa siempre los mismos tokens (colores, espaciado, tipografía).
- **Accesibilidad**: Nunca comprometas a11y por estética.
- **Escalabilidad**: Separa lógica de UI, usa variantes con CVA, mantén componentes puros.
- **Performance**: Animaciones sutiles, lazy loading de componentes pesados (charts).

Para dudas o extensiones del sistema, referencia siempre esta guía y los componentes originales en el repo `SideBy-Design`.

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026  
**Mantenedor**: Equipo SideBy Design  
**Licencia**: MIT
