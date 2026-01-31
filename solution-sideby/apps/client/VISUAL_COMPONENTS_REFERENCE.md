# SideBy-Design - Referencia Visual de Componentes

## 🎨 Sistema de Diseño

Este documento sirve como referencia para replicar los componentes visuales de SideBy-Design en otros repositorios, independientemente de su estructura de carpetas.

---

## 📦 Stack de UI

### Librerías Base
- **shadcn/ui** - Componentes primitivos basados en Radix UI
- **Tailwind CSS** - Framework de utilidades CSS
- **lucide-react** - Iconos
- **Recharts** - Gráficos y visualizaciones
- **class-variance-authority (cva)** - Gestión de variantes de componentes
- **tailwind-merge + clsx** - Utilidad para merge de clases

### Instalación Base
```bash
# Tailwind + shadcn/ui
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
npm install class-variance-authority clsx tailwind-merge

# UI Components
npm install @radix-ui/react-slot lucide-react

# Charts
npm install recharts

# React Query (state management)
npm install @tanstack/react-query
```

---

## 🎨 Sistema de Colores (CSS Variables)

### Paleta Principal

```css
/* Light Mode */
:root {
  /* Superficies */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --surface: 210 20% 98%;
  --surface-elevated: 0 0% 100%;
  --surface-muted: 220 14% 96%;
  
  /* Primarios */
  --primary: 222 47% 11%;              /* Slate oscuro */
  --primary-foreground: 210 40% 98%;
  
  /* Secundarios y Mutados */
  --secondary: 220 14% 96%;
  --muted: 220 14% 96%;
  --muted-foreground: 215 16% 47%;
  
  /* Bordes */
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  
  /* Data Visualization - CRÍTICO PARA ESTE PROYECTO */
  --data-primary: 217 91% 60%;         /* Azul brillante */
  --data-comparative: 25 95% 53%;      /* Naranja */
  --data-success: 142 76% 36%;         /* Verde */
  --data-warning: 38 92% 50%;          /* Amarillo */
  --data-neutral: 215 16% 47%;         /* Gris */
}
```

### Dark Mode
```css
.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  --surface: 223 47% 11%;
  --data-primary: 217 91% 60%;
  --data-comparative: 25 95% 53%;
}
```

---

## 🧩 Componentes de Negocio

### 1. KPI Card

**Propósito:** Mostrar una métrica clave con comparación y cambio porcentual.

**Props:**
```typescript
interface KPICardProps {
  title: string;                    // "Ventas", "Tráfico"
  currentValue: string | number;    // "$245K", "142K"
  comparativeValue: string | number; // "$198K", "118K"
  percentageChange: number;         // 23.7, -15.2
  icon: LucideIcon;                 // DollarSign, Users
  className?: string;
}
```

**Aspecto Visual:**
- Card blanco con borde sutil
- Icono en círculo con `bg-surface` (fondo gris claro)
- Valor actual grande (text-3xl font-semibold)
- Valor comparativo debajo en texto muted
- Badge de cambio porcentual:
  - Verde con TrendingUp si positivo
  - Rojo con TrendingDown si negativo
  - Gris con Minus si neutral

**Código de Referencia:**
```tsx
<Card>
  <CardContent className="p-5">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-semibold tracking-tight">{currentValue}</p>
        <p className="text-sm text-muted-foreground">vs. {comparativeValue}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <Badge variant={isPositive ? "success" : "destructive"}>
          {getTrendIcon()} {percentageChange}%
        </Badge>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### 2. RevenueChart (Line Chart)

**Propósito:** Gráfico de líneas comparativo entre dos datasets.

**Características:**
- Usa Recharts `<LineChart>`
- Dos líneas: una azul (`--data-primary`), otra naranja (`--data-comparative`)
- Grid con stroke `hsl(var(--border))`
- Tooltip personalizado con estilo popover
- Legend con indicadores de color
- Select dropdown para filtro de rango de fechas

**Estructura:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Tendencia de Ingresos</CardTitle>
    <div className="flex gap-4">
      <DataIndicator variant="primary" label="Dataset Actual" />
      <DataIndicator variant="comparative" label="Dataset Comparativo" />
    </div>
    <Select>...</Select>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis stroke="hsl(var(--muted-foreground))" />
        <YAxis tickFormatter={(val) => `$${val/1000}k`} />
        <Tooltip contentStyle={{ 
          backgroundColor: "hsl(var(--popover))",
          borderRadius: "8px"
        }} />
        <Line 
          type="monotone" 
          dataKey="actual" 
          stroke="hsl(var(--data-primary))"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="comparativo" 
          stroke="hsl(var(--data-comparative))"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

**Colores de Líneas:**
- Actual: `stroke="hsl(var(--data-primary))"` - Azul
- Comparativo: `stroke="hsl(var(--data-comparative))"` - Naranja

---

### 3. ComparisonTable

**Propósito:** Tabla de datos comparativos con badges de cambio porcentual.

**Estructura de Datos:**
```typescript
interface ComparisonRow {
  metric: string;      // "Ventas Totales"
  category: string;    // "Ingresos", "Marketing"
  actual: number;      // 245000
  comparative: number; // 198000
  unit: string;        // "$", "%", "h", ""
}
```

**Características Visuales:**
- Tabla con border sutil
- Headers con indicadores de color:
  - Actual: círculo azul (`bg-data-primary`)
  - Comparativo: círculo naranja (`bg-data-comparative`)
- Badges en columna de cambio (igual que KPI Card)
- Lógica especial: algunas métricas invierten el color (ej: CAC, Tiempo Respuesta - menor es mejor)

**Código Header:**
```tsx
<TableHead className="text-right">
  <span className="inline-flex items-center gap-1.5">
    <span className="h-2 w-2 rounded-full bg-data-primary" />
    Actual
  </span>
</TableHead>
```

---

### 4. AIInsights

**Propósito:** Panel de insights generados por IA con iconos y categorización.

**Características:**
- Header con icono Bot en gradiente violeta
- Insights en cards con `bg-surface` (fondo gris claro)
- Cada insight tiene:
  - Icono circular con color según tipo
  - Texto descriptivo
- Badge "Generado con IA" al final

**Tipos de Insights:**
```typescript
type InsightType = "positive" | "warning" | "insight";

// Colores por tipo:
positive:  bg-data-success/10 text-data-success
warning:   bg-data-warning/10 text-data-warning
insight:   bg-data-primary/10 text-data-primary
```

**Código de Referencia:**
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg 
                      bg-gradient-to-br from-violet-500 to-purple-600">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <CardTitle className="text-base">AI Insights</CardTitle>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    {insights.map(insight => (
      <div className="flex gap-3 rounded-lg bg-surface p-3">
        <div className={`rounded-full ${colorByType}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-muted-foreground">{insight.text}</p>
      </div>
    ))}
    <Badge variant="secondary">
      <Sparkles className="h-3 w-3" /> Generado con IA
    </Badge>
  </CardContent>
</Card>
```

---

### 5. FilterBar

**Propósito:** Barra de filtros con selects y badges de filtros activos.

**Características:**
- Múltiples `Select` components en fila
- Badges removibles para filtros activos
- Botón "Limpiar filtros" cuando hay activos
- Icono Filter al inicio

**Props de Filtros:**
```typescript
interface FilterOption {
  id: string;        // "region", "channel"
  label: string;     // "Región", "Canal"
  options: string[]; // ["Norte", "Sur", ...]
}
```

**Layout:**
```tsx
<div className="space-y-3">
  <div className="flex items-center gap-3">
    <Filter className="h-4 w-4" />
    <span>Filtros</span>
    
    {/* Selects */}
    {filterOptions.map(filter => (
      <Select className="w-[140px]">...</Select>
    ))}
    
    {/* Clear button */}
    {hasFilters && (
      <Button variant="ghost" size="sm">
        <RotateCcw /> Limpiar
      </Button>
    )}
  </div>
  
  {/* Active filters badges */}
  <div className="flex gap-2">
    {Object.entries(activeFilters).map(([key, value]) => (
      <Badge>
        {value} <X className="ml-1 h-3 w-3 cursor-pointer" />
      </Badge>
    ))}
  </div>
</div>
```

---

### 6. DashboardHeader

**Propósito:** Header de página con título y acciones.

**Props:**
```typescript
interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}
```

**Layout:**
```tsx
<div className="flex items-start justify-between border-b pb-4">
  <div className="space-y-1">
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
  </div>
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm">
      <FileText className="mr-2 h-4 w-4" /> Exportar PDF
    </Button>
    <Button variant="outline" size="sm">
      <Pencil className="mr-2 h-4 w-4" /> Editar
    </Button>
  </div>
</div>
```

---

### 7. DataIndicator

**Propósito:** Pequeño indicador de color para legendas de gráficos.

**Variantes:**
- `primary`: círculo azul (`bg-data-primary`)
- `comparative`: círculo naranja (`bg-data-comparative`)

**Uso:**
```tsx
<div className="flex items-center gap-1.5">
  <span className="h-2 w-2 rounded-full bg-data-primary" />
  <span className="text-sm">Dataset Actual</span>
</div>
```

---

## 🎯 Patrones de Badge

### Variantes de Badge

```typescript
// badge.tsx - Variantes disponibles
variant: {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  outline: "text-foreground border",
  success: "bg-data-success/10 text-data-success",
  warning: "bg-data-warning/10 text-data-warning",
  dataPrimary: "bg-data-primary/10 text-data-primary",
  dataComparative: "bg-data-comparative/10 text-data-comparative",
}
```

### Uso en Cambios Porcentuales
```tsx
const getBadgeVariant = (change: number) => {
  if (change > 0) return "success";
  if (change < 0) return "destructive";
  return "secondary";
};

<Badge variant={getBadgeVariant(percentageChange)} className="gap-1">
  {change > 0 ? <TrendingUp /> : <TrendingDown />}
  {change > 0 ? "+" : ""}{change}%
</Badge>
```

---

## 🎨 Utilidades de Tailwind Personalizadas

### Animaciones
```css
/* En tailwind.config.ts */
animation: {
  "fade-in": "fade-in 0.4s ease-out",
  "slide-in-right": "slide-in-right 0.3s ease-out",
  "scale-in": "scale-in 0.2s ease-out",
}

/* Uso */
className="animate-fade-in"
```

### Shadows Personalizadas
```css
shadow-subtle: "0 1px 2px 0 rgb(0 0 0 / 0.03)"
shadow-soft: "0 2px 8px -2px rgb(0 0 0 / 0.05)"
shadow-elevated: "0 4px 16px -4px rgb(0 0 0 / 0.08)"
```

### Clases Custom
```css
.bg-surface           /* Fondo gris claro */
.bg-surface-elevated  /* Fondo blanco elevado */
.border-subtle        /* Border con opacidad 60% */
```

---

## 📐 Patrones de Layout

### Grid Responsivo para KPIs
```tsx
<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {kpiData.map(kpi => <KPICard {...kpi} />)}
</section>
```

### Layout Dashboard con Sidebar
```tsx
<SidebarProvider defaultOpen={true}>
  <div className="flex min-h-screen w-full">
    <AppSidebar />
    <main className="flex-1 overflow-auto">
      <div className="container max-w-7xl py-6 space-y-6">
        {/* Contenido */}
      </div>
    </main>
  </div>
</SidebarProvider>
```

### Grid Asimétrico (Insights + Tabla)
```tsx
<section className="grid gap-6 lg:grid-cols-10">
  <div className="lg:col-span-3">
    <AIInsights />
  </div>
  <div className="lg:col-span-7">
    <ComparisonTable />
  </div>
</section>
```

---

## 🔧 Función Utility cn()

**Imprescindible** para merge de clases Tailwind:

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Uso:
<Card className={cn("animate-fade-in", className)} />
```

---

## 🎯 Iconos Lucide React

### Iconos Más Usados
```typescript
import { 
  DollarSign,      // Dinero
  Users,           // Usuarios/Tráfico
  TrendingUp,      // Tendencia positiva
  TrendingDown,    // Tendencia negativa
  Minus,           // Sin cambio
  UserMinus,       // Churn
  Bot,             // IA
  Sparkles,        // Insights/Magia
  AlertTriangle,   // Warning
  Filter,          // Filtros
  FileText,        // Documentos
  Pencil,          // Editar
  X,               // Cerrar
  RotateCcw,       // Reset
  BarChart3,       // Gráficos
  Table2,          // Tablas
} from "lucide-react";
```

### Patrón de Icono en Badge
```tsx
<Badge className="gap-1">
  <Icon className="h-3 w-3" />
  Texto
</Badge>
```

---

## 🏗️ Template System del Dashboard

### Tres Vistas Diferentes

```typescript
type ViewTemplate = "executive" | "trends" | "detailed";

// executive: KPIs + 1 gráfico + insights + tabla
// trends: KPIs + múltiples gráficos (2x2 grid)
// detailed: KPIs + múltiples tablas + detalles
```

### Selector de Template
```tsx
<Select value={viewTemplate} onValueChange={setViewTemplate}>
  <SelectTrigger className="w-[240px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="executive">
      <FileText className="h-4 w-4" />
      📊 Resumen Ejecutivo
    </SelectItem>
    <SelectItem value="trends">
      <BarChart3 className="h-4 w-4" />
      📈 Análisis de Tendencias
    </SelectItem>
    <SelectItem value="detailed">
      <Table2 className="h-4 w-4" />
      🔢 Tabla Detallada
    </SelectItem>
  </SelectContent>
</Select>
```

---

## 🎨 Design Tokens Resumen

```typescript
// Espaciados típicos
space-y-6    // Entre secciones principales
space-y-4    // Entre elementos de grupo
space-y-2    // Entre líneas relacionadas
gap-4        // Grid de KPIs
gap-6        // Grid de secciones

// Tamaños de texto
text-2xl font-semibold tracking-tight  // Títulos de página
text-lg font-semibold                  // Títulos de card
text-3xl font-semibold tracking-tight  // Valores KPI
text-sm text-muted-foreground          // Labels y secundarios

// Radios
rounded-lg   // Cards y containers
rounded-full // Badges y círculos

// Padding
p-5          // KPI Card content
p-4          // Card header/content estándar
p-3          // Insight items
```

---

## ✅ Checklist de Implementación

Para replicar estos componentes en otro repo:

1. **Setup base:**
   - [ ] Instalar Tailwind + shadcn/ui
   - [ ] Configurar `tailwind.config.ts` con colores custom
   - [ ] Agregar CSS variables al `index.css`
   - [ ] Crear función `cn()` en utils

2. **Componentes primitivos shadcn:**
   - [ ] `npx shadcn@latest add card`
   - [ ] `npx shadcn@latest add badge`
   - [ ] `npx shadcn@latest add button`
   - [ ] `npx shadcn@latest add select`
   - [ ] `npx shadcn@latest add table`

3. **Librerías adicionales:**
   - [ ] Instalar lucide-react
   - [ ] Instalar recharts (si necesitas gráficos)

4. **Componentes de negocio:**
   - [ ] KPICard
   - [ ] ComparisonTable
   - [ ] AIInsights
   - [ ] FilterBar
   - [ ] RevenueChart (opcional)

5. **Variantes de Badge custom:**
   - [ ] Modificar `badge.tsx` para agregar variantes `success`, `warning`, `dataPrimary`, `dataComparative`

---

## � Tabs Component

**Propósito:** Sistema de pestañas para organizar contenido en secciones.

**Instalación:**
```bash
npx shadcn@latest add tabs
```

**Estructura Básica:**
```tsx
<Tabs defaultValue="settings" className="space-y-6">
  <TabsList className="grid w-full grid-cols-2 max-w-md">
    <TabsTrigger value="settings" className="flex items-center gap-2">
      <SettingsIcon className="h-4 w-4" />
      Settings
    </TabsTrigger>
    <TabsTrigger value="profile" className="flex items-center gap-2">
      <User className="h-4 w-4" />
      Perfil
    </TabsTrigger>
  </TabsList>

  <TabsContent value="settings" className="space-y-6">
    {/* Contenido del tab */}
  </TabsContent>
  
  <TabsContent value="profile" className="space-y-6">
    {/* Contenido del tab */}
  </TabsContent>
</Tabs>
```

**Características:**
- TabsList: contenedor de los botones de pestañas
- TabsTrigger: botón individual (puede tener iconos)
- TabsContent: contenido de cada pestaña
- Grid responsive: `grid-cols-2` o más según necesidades

---

## 📝 Textarea Component

**Propósito:** Input de texto multilinea para prompts, descripciones, etc.

**Instalación:**
```bash
npx shadcn@latest add textarea
```

**Uso:**
```tsx
<Textarea
  value={defaultPrompt}
  onChange={(e) => setDefaultPrompt(e.target.value)}
  className="min-h-[200px] resize-y font-mono text-sm"
  placeholder="Escribe el prompt por defecto para la IA..."
/>
```

**Props Comunes:**
- `min-h-[Xpx]`: altura mínima
- `resize-y`: permite redimensionar verticalmente
- `font-mono`: fuente monospace (para código/prompts)

---

## 🎨 Color Picker Pattern

**Propósito:** Selector de color con preview y input de texto.

**Características:**
- Input type="color" nativo
- Input de texto con hex value
- Preview cuadrado del color

**Código:**
```tsx
<div className="flex items-center gap-3">
  <Input
    id="primaryColor"
    type="color"
    value={primaryColor}
    onChange={(e) => setPrimaryColor(e.target.value)}
    className="w-16 h-10 p-1 cursor-pointer"
  />
  <Input
    type="text"
    value={primaryColor}
    onChange={(e) => setPrimaryColor(e.target.value)}
    className="flex-1 font-mono"
    placeholder="#3B82F6"
  />
  <div
    className="w-10 h-10 rounded-md border"
    style={{ backgroundColor: primaryColor }}
  />
</div>
```

**Layout:**
- Color picker: `w-16 h-10`
- Text input: `flex-1 font-mono`
- Preview box: `w-10 h-10 rounded-md border`

---

## 📁 File Upload Pattern (con preview)

**Propósito:** Upload de archivos con preview de imagen.

**Características:**
- Input type="file" oculto
- Preview de imagen con botón de eliminar
- Estado placeholder cuando no hay archivo

**Código:**
```tsx
<div className="flex items-start gap-6">
  <div className="flex-shrink-0">
    {logoPreview ? (
      <div className="relative">
        <img
          src={logoPreview}
          alt="Logo preview"
          className="w-24 h-24 object-contain border rounded-lg bg-muted p-2"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive 
                     text-destructive-foreground hover:bg-destructive/90"
          onClick={() => {
            setLogoFile(null);
            setLogoPreview(null);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    ) : (
      <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center 
                      justify-center bg-muted/50">
        <Image className="h-8 w-8 text-muted-foreground/50" />
      </div>
    )}
  </div>
  <div className="flex-1 space-y-2">
    <Label htmlFor="logo">Subir Logo</Label>
    <Input
      id="logo"
      type="file"
      accept="image/*"
      onChange={handleLogoChange}
      className="cursor-pointer"
    />
    <p className="text-xs text-muted-foreground">
      Formatos soportados: PNG, JPG, SVG. Tamaño máximo: 2MB.
    </p>
  </div>
</div>
```

**Lógica de Preview:**
```typescript
const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};
```

---

## 🚨 Danger Zone Card Pattern

**Propósito:** Card roja para acciones destructivas/irreversibles.

**Características:**
- Border rojo: `border-destructive/50`
- Título rojo con icono
- Background del contenido: `bg-destructive/5`

**Código:**
```tsx
<Card className="border-destructive/50">
  <CardHeader>
    <div className="flex items-center gap-2">
      <Trash2 className="h-5 w-5 text-destructive" />
      <CardTitle className="text-lg text-destructive">Zona de Peligro</CardTitle>
    </div>
    <CardDescription>
      Acciones irreversibles relacionadas con tu cuenta.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between p-4 rounded-lg 
                    border border-destructive/30 bg-destructive/5">
      <div>
        <p className="font-medium">Eliminar cuenta</p>
        <p className="text-sm text-muted-foreground">
          Esta acción eliminará permanentemente tu cuenta y todos tus datos.
        </p>
      </div>
      <Button variant="destructive">
        <Trash2 className="h-4 w-4 mr-2" />
        Eliminar cuenta
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 💎 Dialog/Modal Component

**Propósito:** Modal para confirmaciones y formularios.

**Instalación:**
```bash
npx shadcn@latest add dialog
```

**Estructura Completa:**
```tsx
<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <DialogTrigger asChild>
    <Button variant="destructive">
      <Trash2 className="h-4 w-4 mr-2" />
      Eliminar cuenta
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>¿Estás seguro?</DialogTitle>
      <DialogDescription>
        Esta acción no se puede deshacer. Se eliminarán permanentemente tu cuenta,
        todos tus datasets y configuraciones.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
        Cancelar
      </Button>
      <Button variant="destructive" onClick={handleDeleteAccount}>
        Sí, eliminar mi cuenta
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Props Clave:**
- `open`: booleano para control externo
- `onOpenChange`: callback para cambios de estado
- `DialogTrigger asChild`: integra el trigger con un componente hijo

---

## ✅ Badge de Verificación

**Propósito:** Badge con check verde para indicar verificación.

**Código:**
```tsx
<Badge variant="secondary" className="flex items-center gap-1 shrink-0">
  <CheckCircle2 className="h-3 w-3 text-data-success" />
  Google
</Badge>
```

**Uso Común:**
- Email verificado
- Autenticación OAuth
- Estado completado

---

## 👑 Subscription Card Pattern

**Propósito:** Card para mostrar plan de suscripción con CTA.

**Características:**
- Icono circular con background según tipo de plan
- Información del plan (nombre + descripción)
- Botón de acción (upgrade o gestionar)

**Código:**
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center gap-2">
      <CreditCard className="h-5 w-5 text-muted-foreground" />
      <CardTitle className="text-lg">Suscripción</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-3">
        {user.subscription === "premium" ? (
          <>
            <div className="p-2 rounded-full bg-primary/10">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Plan Premium</p>
              <p className="text-sm text-muted-foreground">
                Acceso completo a todas las funcionalidades
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="p-2 rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Plan Freemium</p>
              <p className="text-sm text-muted-foreground">
                Funcionalidades limitadas
              </p>
            </div>
          </>
        )}
      </div>
      {user.subscription === "freemium" ? (
        <Button>
          <Crown className="h-4 w-4 mr-2" />
          Actualizar a Premium
        </Button>
      ) : (
        <Button variant="outline">Gestionar suscripción</Button>
      )}
    </div>
  </CardContent>
</Card>
```

**Iconos por Tipo:**
- Premium: `Crown` con `bg-primary/10`
- Freemium: `User` con `bg-muted`

---

## 📊 Invoices Table Pattern

**Propósito:** Tabla de facturas con badges y acciones.

**Características:**
- Badge de estado "Pagada" con color success
- Botón de descarga en columna de acciones
- Formato de fecha y moneda

**Código:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Factura</TableHead>
      <TableHead>Fecha</TableHead>
      <TableHead>Importe</TableHead>
      <TableHead>Estado</TableHead>
      <TableHead className="text-right">Acciones</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {mockInvoices.map((invoice) => (
      <TableRow key={invoice.id}>
        <TableCell className="font-medium">{invoice.id}</TableCell>
        <TableCell>{invoice.date}</TableCell>
        <TableCell>${invoice.amount.toFixed(2)}</TableCell>
        <TableCell>
          <Badge variant="secondary" className="bg-data-success/10 text-data-success">
            {invoice.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 🎯 Settings Page - Layout Pattern

**Propósito:** Layout completo de página de configuración.

**Características:**
- Tabs para separar categorías (Settings vs Profile)
- Cards con iconos en headers
- Separación visual con Separator
- Botones de acción al final de cada sección

**Estructura:**
```tsx
<main className="flex-1 p-6 lg:p-8">
  <div className="max-w-4xl mx-auto space-y-6">
    {/* Header */}
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
      <p className="text-muted-foreground">
        Gestiona las preferencias de tu cuenta y personaliza la aplicación.
      </p>
    </div>

    {/* Tabs */}
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList>...</TabsList>
      
      <TabsContent value="settings" className="space-y-6">
        {/* Multiple Cards */}
        <Card>...</Card>
        <Card>...</Card>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <Button>Guardar cambios</Button>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</main>
```

**Max Width:**
- Contenedor: `max-w-4xl mx-auto`
- Esto mantiene el contenido centrado y legible

---

## 🔧 Componentes shadcn Adicionales para Settings

```bash
# Tabs
npx shadcn@latest add tabs

# Dialog
npx shadcn@latest add dialog

# Textarea
npx shadcn@latest add textarea

# Separator
npx shadcn@latest add separator

# Label (si no lo tenías)
npx shadcn@latest add label
```

---

## 📚 Referencias

- **shadcn/ui docs:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com
- **Lucide Icons:** https://lucide.dev
- **Recharts:** https://recharts.org

---

## 💡 Notas Finales

- Todos los componentes usan **TypeScript estricto** con interfaces
- El sistema de colores está basado en **CSS variables HSL**
- Los badges de cambio porcentual son **bidireccionales** (positivo/negativo varía según contexto)
- Las animaciones son **sutiles** (`fade-in` en cards)
- El diseño está inspirado en **Linear/Vercel** (minimalista, espacios amplios, borders sutiles)
- Para páginas de settings, usar **max-w-4xl** para mejor legibilidad
- Los Danger Zone cards usan variantes **destructive** con opacidades (`/50`, `/30`, `/5`)
