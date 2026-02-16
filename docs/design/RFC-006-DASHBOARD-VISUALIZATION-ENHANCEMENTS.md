# [RFC-006] Dashboard Visualization Enhancements - 3 Views Upgrade & Date Umbrella System

| Metadatos | Detalles |
| :--- | :--- |
| **Fecha / Date** | 2026-02-15 |
| **Estado / Status** | **En Progreso / In Progress** |
| **Prioridad / Priority** | Alta |
| **Esfuerzo / Effort** | 7-8 días |
| **Alcance / Scope** | `apps/client/src/features/dataset/components/dashboard` |
| **Dependencias** | RFC-005 (Dashboard UX Improvements) |
| **Versión Target** | v0.6.0 |
| **Autor / Author** | Engineering Team |

---

## 1. Contexto y Motivación / Context & Motivation

### Problema Actual / Current Problem

Las 3 vistas del dashboard (Executive, Trends, Detailed) tienen limitaciones funcionales importantes:

❌ **Executive View:**
- Gráfico principal estático (no configurable)
- No soporta "fecha paraguas" para comparar períodos diferentes
- Falta sparklines en KPI cards
- AI Insights no está bien posicionado

❌ **Trends View:**
- Solo muestra un gráfico único
- No hay grid de mini-charts por KPI
- Falta selector de time range
- No hay trend indicators

❌ **Detailed View:**
- Solo muestra tabla granular sin resumen
- No hay cálculo de Delta (absoluto/relativo)
- Falta tabla de totales sticky
- No hay row expansion
- No hay export CSV

**Problema crítico: Comparación de fechas diferentes**

```
Grupo A (2023): 01/01/2023, 01/02/2023, 01/03/2023...
Grupo B (2024): 01/01/2024, 01/02/2024, 01/03/2024...
Resultado actual: ❌ Dos líneas separadas en eje X (no comparables)
```

### Objetivos del RFC-006 / Goals

Este RFC implementa mejoras profundas en las capacidades de visualización:

1. **Date Umbrella System:** Alinear fechas por calendario para comparaciones válidas
2. **Executive View Enhancements:** Gráfico configurable + trend indicators + AI insights reposicionado  
3. **Trends View Redesign:** Grid 2×2 de charts + time range selector + trend indicators
4. **Detailed View Complete Rewrite:** Tabla totales + tabla granular con deltas + export CSV

---

## 2. Date Umbrella System (CRÍTICO)

### 2.1 Problema Detallado

**Caso de uso real:**
```typescript
// Dataset con 2 años diferentes
const dataGroupA = [
  { date: '2023-01-01', revenue: 7800 },
  { date: '2023-02-01', revenue: 6800 },
  { date: '2023-03-01', revenue: 7600 },
];

const dataGroupB = [
  { date: '2024-01-01', revenue: 10800 },
  { date: '2024-02-01', revenue: 9300 },
  { date: '2024-03-01', revenue: 9800 },
];

// Gráfico actual: ❌ Ejes X separados
// Eje X: [2023-01-01, 2023-02-01, ..., 2024-01-01, 2024-02-01]
//        ^^^^^^^^^^^^^^^^^^^^^^^^^      ^^^^^^^^^^^^^^^^^^^^^^^^^
//        Grupo A (no se compara)        Grupo B (no se compara)
```

**Solución: Fecha Paraguas**
```typescript
// Alinear por fecha calendario (ignorar año)
const alignedData = [
  {
    umbrellaDate: '01/01',  // 📅 Fecha paraguas
    groupA: { year: '2023', value: 7800 },
    groupB: { year: '2024', value: 10800 },
  },
  {
    umbrellaDate: '02/01',
    groupA: { year: '2023', value: 6800 },
    groupB: { year: '2024', value: 9300 },
  },
  // ...
];

// Gráfico resultado: ✅ Mismo eje X, dos series comparables
```

---

### 2.2 Architecture del Date Umbrella

**Archivo:** `solution-sideby/apps/client/src/features/dataset/utils/dateUmbrella.ts`

```typescript
/**
 * Date Umbrella Utilities
 * 
 * Sistema para alinear fechas de diferentes períodos (años) en un eje común
 * para permitir comparaciones válidas "side-by-side"
 */

export type DateGranularity = 'days' | 'weeks' | 'months' | 'quarters';

export interface UmbrellaDatePoint {
  /** Fecha paraguas normalizada (ej: "01/01", "Q1", "Week 1") */
  umbrellaKey: string;
  
  /** Display label (ej: "01/01", "Enero", "Q1 2023 vs Q1 2024") */
  label: string;
  
  /** Datos del Grupo A (puede ser null si no hay datos para ese período) */
  groupA: {
    originalDate: Date;
    year: string;
    value: number;
  } | null;
  
  /** Datos del Grupo B */
  groupB: {
    originalDate: Date;
    year: string;
    value: number;
  } | null;
}

/**
 * Alinea datos de dos grupos por fecha calendario
 * 
 * @param groupAData - Datos del grupo A con fecha
 * @param groupBData - Datos del grupo B con fecha
 * @param dateField - Nombre del campo de fecha en los datos
 * @param valueField - Nombre del campo de valor (KPI) a comparar
 * @param granularity - Nivel de agrupación (days, weeks, months, quarters)
 * @param omitGaps - Si true, omite períodos donde faltan datos de ambos grupos
 * @returns Array de puntos alineados para el gráfico
 */
export function createDateUmbrella(
  groupAData: DataRow[],
  groupBData: DataRow[],
  dateField: string,
  valueField: string,
  granularity: DateGranularity = 'months',
  omitGaps: boolean = true
): UmbrellaDatePoint[] {
  // 1. Parsear fechas y agrupar por granularidad
  const groupAByKey = groupDataByGranularity(groupAData, dateField, valueField, granularity);
  const groupBByKey = groupDataByGranularity(groupBData, dateField, valueField, granularity);
  
  // 2. Obtener todas las keys (union)
  const allKeys = new Set([...Object.keys(groupAByKey), ...Object.keys(groupBByKey)]);
  
  // 3. Crear puntos alineados
  const umbrellaPoints: UmbrellaDatePoint[] = [];
  
  for (const key of Array.from(allKeys).sort()) {
    const pointA = groupAByKey[key] || null;
    const pointB = groupBByKey[key] || null;
    
    // Omitir si ambos grupos no tienen datos (según configuración)
    if (omitGaps && !pointA && !pointB) continue;
    
    umbrellaPoints.push({
      umbrellaKey: key,
      label: formatUmbrellaLabel(key, granularity, pointA, pointB),
      groupA: pointA,
      groupB: pointB,
    });
  }
  
  return umbrellaPoints;
}

/**
 * Agrupa datos por granularidad temporal
 */
function groupDataByGranularity(
  data: DataRow[],
  dateField: string,
  valueField: string,
  granularity: DateGranularity
): Record<string, { originalDate: Date; year: string; value: number }> {
  const grouped: Record<string, { originalDate: Date; year: string; value: number }> = {};
  
  for (const row of data) {
    const dateValue = row[dateField];
    if (!dateValue) continue;
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) continue;
    
    // Generar key según granularidad
    const key = generateGranularityKey(date, granularity);
    
    // Agregar datos (sumar si ya existe la key)
    if (!grouped[key]) {
      grouped[key] = {
        originalDate: date,
        year: date.getFullYear().toString(),
        value: Number(row[valueField]) || 0,
      };
    } else {
      grouped[key].value += Number(row[valueField]) || 0;
    }
  }
  
  return grouped;
}

/**
 * Genera la key de agrupación según granularidad
 */
function generateGranularityKey(date: Date, granularity: DateGranularity): string {
  const month = date.getMonth() + 1;  // 1-12
  const day = date.getDate();
  
  switch (granularity) {
    case 'days':
      // Key: "MM/DD" (ej: "01/15")
      return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    
    case 'weeks':
      // Key: "Week NN" (ej: "Week 03")
      const weekNumber = getWeekNumber(date);
      return `Week ${weekNumber.toString().padStart(2, '0')}`;
    
    case 'months':
      // Key: "MM" (ej: "03" para Marzo)
      return month.toString().padStart(2, '0');
    
    case 'quarters':
      // Key: "QN" (ej: "Q1")
      const quarter = Math.ceil(month / 3);
      return `Q${quarter}`;
    
    default:
      return month.toString().padStart(2, '0');
  }
}

/**
 * Formatea el label para el eje X del gráfico
 */
function formatUmbrellaLabel(
  key: string,
  granularity: DateGranularity,
  pointA: { year: string } | null,
  pointB: { year: string } | null
): string {
  // Label base según key
  let baseLabel = key;
  
  // Para meses, convertir a nombre
  if (granularity === 'months') {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthIndex = parseInt(key, 10) - 1;
    baseLabel = monthNames[monthIndex] || key;
  }
  
  // Para quarters, dejar como está ("Q1", "Q2", etc.)
  
  return baseLabel;
  // Nota: Los años se muestran en la leyenda del gráfico, no en el label
  // Leyenda: "Grupo A (2023)" vs "Grupo B (2024)"
}

/**
 * Obtiene el número de semana del año (ISO 8601)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
```

---

### 2.3 Integración con TrendChart

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/TrendChart.tsx`

```typescript
/**
 * TrendChart con soporte de Date Umbrella
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group.js';
import { createDateUmbrella, type DateGranularity } from '../../utils/dateUmbrella.js';
import type { DataRow } from '../../types/api.types.js';

interface TrendChartProps {
  data: DataRow[];
  dateField: string;
  kpiField: string;
  kpiLabel: string;
  groupALabel: string;
  groupBLabel: string;
  groupAColor: string;
  groupBColor: string;
  format: 'number' | 'currency' | 'percentage';
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  dateField,
  kpiField,
  kpiLabel,
  groupALabel,
  groupBLabel,
  groupAColor,
  groupBColor,
  format,
}) => {
  const [granularity, setGranularity] = React.useState<DateGranularity>('months');
  
  // Separar datos por grupo
  const groupAData = data.filter((row) => row._group === 'A');
  const groupBData = data.filter((row) => row._group === 'B');
  
  // ✅ Crear Date Umbrella
  const umbrellaData = React.useMemo(() => {
    return createDateUmbrella(
      groupAData,
      groupBData,
      dateField,
      kpiField,
      granularity,
      true  // omitGaps = true
    );
  }, [groupAData, groupBData, dateField, kpiField, granularity]);
  
  // Transformar a formato de Recharts
  const chartData = umbrellaData.map((point) => ({
    umbrellaKey: point.label,  // Eje X
    [groupALabel]: point.groupA?.value ?? null,  // Serie A
    [groupBLabel]: point.groupB?.value ?? null,  // Serie B
  }));
  
  // Determinar años para la leyenda
  const yearA = umbrellaData[0]?.groupA?.year || '';
  const yearB = umbrellaData[0]?.groupB?.year || '';
  
  return (
    <div className="space-y-4">
      {/* Header con selector de granularidad */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{kpiLabel}</h3>
        
        <ToggleGroup
          type="single"
          value={granularity}
          onValueChange={(value) => value && setGranularity(value as DateGranularity)}
        >
          <ToggleGroupItem value="days">Días</ToggleGroupItem>
          <ToggleGroupItem value="weeks">Semanas</ToggleGroupItem>
          <ToggleGroupItem value="months">Meses</ToggleGroupItem>
          <ToggleGroupItem value="quarters">Trimestres</ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="umbrellaKey" />
          <YAxis />
          <Tooltip formatter={(value) => formatValue(value as number, format)} />
          <Legend 
            formatter={(value) => {
              if (value === groupALabel) return `${groupALabel} (${yearA})`;
              if (value === groupBLabel) return `${groupBLabel} (${yearB})`;
              return value;
            }}
          />
          <Line
            type="monotone"
            dataKey={groupALabel}
            stroke={groupAColor}
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls={false}  // No conectar si hay gaps
          />
          <Line
            type="monotone"
            dataKey={groupBLabel}
            stroke={groupBColor}
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

function formatValue(value: number, format: 'number' | 'currency' | 'percentage'): string {
  if (value === null || value === undefined) return 'N/A';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
    case 'percentage':
      return `${value.toFixed(2)}%`;
    default:
      return new Intl.NumberFormat('es-ES').format(value);
  }
}
```

---

## 3. Dashboard Layout Structure

### 3.1 Header Layout (Todas las Vistas)

**Prioridad:** Este layout es consistente en Executive, Trends y Detailed views.

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  [←] Dataset Name [ready]          [Exportar PDF] [Recargar]  ┃ ← Header Superior
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Visualización: [Análisis de Tendencias ▼ ━━━━━━━━━━━━━━━]   ┃ ← Template Selector
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔍 Filtros                                                    ┃
┃  [Month ▼] [Country ▼] [Product ▼]                           ┃ ← Filters Bar
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Especificaciones:**

1. **Header Superior:**
   - **Izquierda:** Botón volver + Título + Badge de estado
   - **Derecha:** Botón "Exportar PDF" (RFC-007) + Botón "Recargar"
   - Altura: `py-8` (32px padding vertical)

2. **Template Selector (Nueva sección):**
   - Label: "**Visualización:**" (text-sm font-medium text-muted-foreground)
   - Selector width: `w-[280px]` (amplio para mostrar descripción completa)
   - Muestra: Icono + Nombre + Descripción
   - **Ubicación:** Línea propia entre header y filtros
   - **Justificación:** Evita saturar el header superior y da prominencia visual

3. **Filters Bar:**
   - Multi-select dropdowns (RFC-005)
   - Chips de filtros activos
   - Botón "Limpiar filtros"

---

## 4. Executive View Enhancements

### 4.1 Layout de Contenido

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📊 KPI Cards (sin sparklines)                                 ┃
┃  [Revenue ↗️] [Traffic ↗️] [ROI ↗️] [Churn ↘️]                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📈 Gráfico Principal (Configurable)                           ┃
┃  [Revenue ▼]  [Month ▼]  [Days|Weeks|Months|Quarters]        ┃
┃  [Chart Area with Date Umbrella]                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📊 Comparación Visual Global (Barras Horizontales - FIXED)   ┃
┃  [All KPIs with horizontal bars]                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📋 Tabla Comparativa                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🤖 AI Insights (si habilitado)                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 4.2 KPICard ~~con Sparklines~~ (DESCARTADO)

**⚠️ DECISIÓN DE DISEÑO (2026-02-16):**

La funcionalidad de **sparklines en KPICard fue descartada** durante la implementación por:
- Complejidad adicional innecesaria para el MVP
- Los mini-charts en Trends View ya proveen visualización de tendencias
- El badge con trend indicator es suficiente para el Executive View
- Posible feature para v0.7.0+ si hay demanda

**Implementación actual (sin sparklines):**

```typescript
/**
 * KPICard - Versión simplificada sin sparklines
 * 
 * Muestra:
 * - Título del KPI
 * - Valor actual vs comparativo
 * - Badge con trend indicator (TrendingUp/Down icons)
 * - Cambio porcentual con color semántico
 */

interface KPICardProps {
  title: string;
  currentValue: string | number;
  comparativeValue: string | number;
  percentageChange: number;
  icon: LucideIcon;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  groupAValue,
  groupBValue,
  groupALabel,
  groupBLabel,
  format,
  trend,
}) => {
  const delta = groupBValue - groupAValue;
  const deltaPercent = groupAValue !== 0 ? (delta / groupAValue) * 100 : 0;
  
  const isPositive = deltaPercent > 0;
  const isNegative = deltaPercent < 0;
  
  // Para métricas "inversas" como Churn, invertir colores
  const isInverseMetric = label.toLowerCase().includes('churn');
  const colorClass = isInverseMetric
    ? isNegative ? 'text-green-600' : 'text-red-600'
    : isPositive ? 'text-green-600' : 'text-red-600';
  
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
            <TrendIcon className={`h-4 w-4 ${colorClass}`} />
          </div>
          
          {/* Valores principales */}
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {formatValue(groupBValue, format)}
            </div>
            <div className="text-xs text-muted-foreground">
              vs {formatValue(groupAValue, format)}
            </div>
          </div>
          
          {/* Delta */}
          <div className={`text-sm font-medium ${colorClass}`}>
            {deltaPercent > 0 ? '+' : ''}
            {deltaPercent.toFixed(1)}%
          </div>
          
          {/* Sparklines descartados para MVP */}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 4.3 ConfigurableChart ✅ (IMPLEMENTADO)

**✅ Estado:** Completo con tests (10/10 passing)

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/ConfigurableChart.tsx`

```typescript
/**
 * ConfigurableChart - Gráfico configurable con selector de KPI y Dimensión
 * 
 * Permite al usuario seleccionar:
 * - Qué KPI visualizar
 * - Por qué dimensión (temporal o categórica)
 * 
 * Renderiza dinámicamente:
 * - TrendChart si dimensión es temporal (dateField)
 * - CategoryChart si dimensión es categórica
 */

interface ConfigurableChartProps {
  data: DataRow[];
  kpis: KPIResult[];
  dateField?: string;
  dimensions: string[];
  groupALabel: string;
  groupBLabel: string;
  groupAColor: string;
  groupBColor: string;
}

export const ConfigurableChart: React.FC<ConfigurableChartProps> = ({
  data,
  kpis,
  dateField,
  dimensions,
  ...labels
}) => {
  const [selectedKPI, setSelectedKPI] = React.useState(kpis[0]?.name || '');
  const [selectedDimension, setSelectedDimension] = React.useState<string>(dateField || dimensions[0] || '');
  
  // Determinar si la dimensión seleccionada es temporal
  const isTemporalDimension = dateField && selectedDimension === dateField;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Mostrar KPI:</span>
            <Select value={selectedKPI} onValueChange={setSelectedKPI}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kpis.map((kpi) => (
                  <SelectItem key={kpi.name} value={kpi.name}>
                    {kpi.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Por Dimensión:</span>
            <Select value={selectedDimension} onValueChange={setSelectedDimension}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateField && (
                  <SelectItem value={dateField}>
                    📅 {dateField} (Temporal)
                  </SelectItem>
                )}
                {dataset.schemaMapping.categoricalFields.map((field) => (
                  <SelectItem key={field} value={field}>
                    📂 {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isTemporalDimension ? (
          <TrendChart
            data={dataset.data}
            dateField={selectedDimension}
            kpiField={selectedKPI}
            // ... props
          />
        ) : (
          <CategoryChart
            data={dataset.data}
            categoryField={selectedDimension}
            kpiField={selectedKPI}
            // ... props
          />
        )}
      </CardContent>
    </Card>
  );
};
```

---

## 4. Trends View Redesign

### 4.1 Layout: Grid 2×2 de Mini-Charts

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Grid de 4 Gráficos (2×2)                                      ┃
┃  ┌─────────────────────────┬─────────────────────────┐        ┃
┃  │ Revenue Trend ↗️ +34%   │ Traffic Trend ↗️ +28%   │        ┃
┃  │ [Mini Line Chart]       │ [Mini Line Chart]       │        ┃
┃  └─────────────────────────┴─────────────────────────┘        ┃
┃  ┌─────────────────────────┬─────────────────────────┐        ┃
┃  │ ROI Trend ↗️ +21%       │ Churn Trend ↘️ -38%     │        ┃
┃  │ [Mini Line Chart]       │ [Mini Line Chart]       │        ┃
┃  └─────────────────────────┴─────────────────────────┘        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🤖 AI Insights                                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 4.2 MiniTrendChart Component

```typescript
/**
 * Mini chart card para grid 2×2
 */

interface MiniTrendChartProps {
  kpi: KPICalculation;
  data: DataRow[];
  dateField: string;
  groupALabel: string;
  groupBLabel: string;
  groupAColor: string;
  groupBColor: string;
}

export const MiniTrendChart: React.FC<MiniTrendChartProps> = ({
  kpi,
  data,
  dateField,
  ...props
}) => {
  const deltaPercent = kpi.groupA !== 0 ? ((kpi.groupB - kpi.groupA) / kpi.groupA) * 100 : 0;
  const isPositive = deltaPercent > 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-medium">{kpi.label}</h4>
            <p className="text-2xl font-bold mt-1">
              {formatValue(kpi.groupB, kpi.format)}
            </p>
          </div>
          <Badge variant={isPositive ? 'default' : 'destructive'}>
            {isPositive ? '↗️' : '↘️'} {deltaPercent.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={prepareChartData(data, dateField, kpi.name)}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey={props.groupALabel} stroke={props.groupAColor} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey={props.groupBLabel} stroke={props.groupBColor} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
```

---

## 5. Detailed View Complete Rewrite

### 5.1 Dual Table Architecture

#### Tabla 1: Totales (Sticky Top)

```typescript
/**
 * SummaryTable - Resumen de KPIs globales (sticky)
 */

interface SummaryTableProps {
  kpis: KPICalculation[];
  groupALabel: string;
  groupBLabel: string;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ kpis, groupALabel, groupBLabel }) => {
  return (
    <Card className="sticky top-20 z-10">  {/* ✅ Sticky */}
      <CardHeader>
        <h3 className="text-lg font-semibold">📊 Resumen General (Totales)</h3>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KPI</TableHead>
              <TableHead className="text-right">{groupALabel}</TableHead>
              <TableHead className="text-right">{groupBLabel}</TableHead>
              <TableHead className="text-right">Delta Abs</TableHead>
              <TableHead className="text-right">Delta %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpis.map((kpi) => {
              const deltaAbs = kpi.groupB - kpi.groupA;
              const deltaPercent = kpi.groupA !== 0 ? (deltaAbs / kpi.groupA) * 100 : 0;
              const isPositive = deltaPercent > 0;
              
              return (
                <TableRow key={kpi.name}>
                  <TableCell className="font-medium">{kpi.label}</TableCell>
                  <TableCell className="text-right">{formatValue(kpi.groupA, kpi.format)}</TableCell>
                  <TableCell className="text-right">{formatValue(kpi.groupB, kpi.format)}</TableCell>
                  <TableCell className="text-right">
                    <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                      {deltaAbs > 0 ? '+' : ''}{formatValue(deltaAbs, kpi.format)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                        {deltaPercent > 0 ? '+' : ''}{deltaPercent.toFixed(1)}%
                      </span>
                      {isPositive ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
```

#### Tabla 2: Granular (Scrollable)

```typescript
/**
 * GranularTable - Tabla detallada con todas las dimensiones + Deltas
 */

interface GranularTableProps {
  data: DataRow[];
  dimensions: string[];  // ['Producto', 'Region']
  kpis: KPICalculation[];
  groupALabel: string;
  groupBLabel: string;
}

interface GranularRow {
  dimensionValues: Record<string, string>;  // { Producto: 'Balón', Region: 'Norte' }
  kpiValues: Record<string, {
    groupA: number;
    groupB: number;
    deltaAbs: number;
    deltaPercent: number;
  }>;
}

export const GranularTable: React.FC<GranularTableProps> = ({
  data,
  dimensions,
  kpis,
  groupALabel,
  groupBLabel,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  
  // Procesar datos en estructura granular
  const granularRows = React.useMemo(() => {
    return processGranularData(data, dimensions, kpis);
  }, [data, dimensions, kpis]);
  
  // Filtrar por búsqueda
  const filteredRows = React.useMemo(() => {
    if (!searchTerm) return granularRows;
    return granularRows.filter((row) =>
      Object.values(row.dimensionValues).some((val) =>
        val.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [granularRows, searchTerm]);
  
  // Ordenar
  const sortedRows = React.useMemo(() => {
    if (!sortColumn) return filteredRows;
    // ... sorting logic
    return filteredRows;
  }, [filteredRows, sortColumn, sortDirection]);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">📋 Detalle por Dimensiones</h3>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />
            
            {/* Export CSV */}
            <Button variant="outline" size="sm" onClick={() => exportToCSV(sortedRows)}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>  {/* Expand icon */}
                {dimensions.map((dim) => (
                  <TableHead key={dim} className="cursor-pointer" onClick={() => handleSort(dim)}>
                    {dim} {sortColumn === dim && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                ))}
                {kpis.map((kpi) => (
                  <React.Fragment key={kpi.name}>
                    <TableHead className="text-right">{kpi.label} A/B</TableHead>
                    <TableHead className="text-right">Δ {kpi.label}</TableHead>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row, index) => {
                const rowKey = generateRowKey(row.dimensionValues);
                const isExpanded = expandedRows.has(rowKey);
                
                return (
                  <React.Fragment key={rowKey}>
                    <TableRow className={isExpanded ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleRowExpansion(rowKey)}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      
                      {/* Dimensiones */}
                      {dimensions.map((dim) => (
                        <TableCell key={dim}>{row.dimensionValues[dim]}</TableCell>
                      ))}
                      
                      {/* KPIs */}
                      {kpis.map((kpi) => {
                        const kpiData = row.kpiValues[kpi.name];
                        return (
                          <React.Fragment key={kpi.name}>
                            <TableCell className="text-right text-xs">
                              {formatValue(kpiData.groupA, kpi.format)} →{' '}
                              {formatValue(kpiData.groupB, kpi.format)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={kpiData.deltaPercent > 0 ? 'text-green-600' : 'text-red-600'}>
                                {kpiData.deltaPercent > 0 ? '+' : ''}
                                {formatValue(kpiData.deltaAbs, kpi.format)} ({kpiData.deltaPercent.toFixed(1)}%)
                              </span>
                            </TableCell>
                          </React.Fragment>
                        );
                      })}
                    </TableRow>
                    
                    {/* Expanded Row Content */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={2 + dimensions.length + (kpis.length * 2)} className="bg-muted/30 p-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">📊 Desglose Detallado</h4>
                            {/* ... detalles adicionales */}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {sortedRows.length} filas
          </p>
          {/* ... pagination controls */}
        </div>
      </CardContent>
    </Card>
  );
};

function processGranularData(
  data: DataRow[],
  dimensions: string[],
  kpis: KPICalculation[]
): GranularRow[] {
  // Agrupar datos por combinación única de dimensiones
  const grouped = new Map<string, { groupA: DataRow[]; groupB: DataRow[] }>();
  
  for (const row of data) {
    const key = dimensions.map((dim) => row[dim]).join('|');
    
    if (!grouped.has(key)) {
      grouped.set(key, { groupA: [], groupB: [] });
    }
    
    if (row._group === 'A') {
      grouped.get(key)!.groupA.push(row);
    } else {
      grouped.get(key)!.groupB.push(row);
    }
  }
  
  // Calcular KPIs para cada grupo de dimensiones
  const granularRows: GranularRow[] = [];
  
  for (const [key, { groupA, groupB }] of grouped.entries()) {
    const dimensionValues: Record<string, string> = {};
    const keyParts = key.split('|');
    dimensions.forEach((dim, i) => {
      dimensionValues[dim] = keyParts[i];
    });
    
    const kpiValues: Record<string, any> = {};
    
    for (const kpi of kpis) {
      const groupASum = groupA.reduce((sum, row) => sum + (Number(row[kpi.name]) || 0), 0);
      const groupBSum = groupB.reduce((sum, row) => sum + (Number(row[kpi.name]) || 0), 0);
      const deltaAbs = groupBSum - groupASum;
      const deltaPercent = groupASum !== 0 ? (deltaAbs / groupASum) * 100 : 0;
      
      kpiValues[kpi.name] = {
        groupA: groupASum,
        groupB: groupBSum,
        deltaAbs,
        deltaPercent,
      };
    }
    
    granularRows.push({ dimensionValues, kpiValues });
  }
  
  return granularRows;
}

function exportToCSV(rows: GranularRow[]): void {
  // CSV export logic
  const csv = convertToCSV(rows);
  downloadFile(csv, 'detailed-comparison.csv', 'text/csv');
}
```

---

## 6. Implementación / Implementation Plan

### Phase 1: Date Umbrella System ✅ (2 días - COMPLETO)

- [x] Crear `dateUmbrella.ts` utility
- [x] Implementar `createDateUmbrella` function
- [x] Implementar `groupDataByGranularity`
- [x] Implementar granularidad Days/Weeks/Months/Quarters
- [ ] Tests unitarios exhaustivos ⚠️ (Pendiente: cobertura completa)
- [x] Documentación con ejemplos

### Phase 2: Executive View ✅ (2 días - COMPLETO)

- [x] ~~KPICard con sparklines integration~~ **DESCARTADO** (ver sección 4.2)
- [x] ConfigurableChart component (10/10 tests passing)
- [x] TrendChart con Date Umbrella
- [x] CategoryChart para dimensiones no-temporales (10/10 tests)
- [x] CategoryChart con chart type selector (bar/line/area)
- [x] Reordenar layout (AI Insights al final)
- [x] Tests

### Phase 3: Trends View ✅ (1.5 días - COMPLETO)

- [x] MiniTrendChart component (16/16 tests passing)
- [x] Grid 2×2 layout (TrendsGrid)
- [x] Integración con Date Umbrella
- [x] DimensionGrid (categórico 2×2) nuevo (9/9 tests)
- [x] DimensionGrid con chart type selector (bar/line/area)
- [x] Trend indicators (badges unificados con lucide icons)
- [ ] Export individual de gráficos (PNG) ⚠️ (v0.7.0+)
- [x] Tests

### Phase 4: Detailed View ✅ (2 días - COMPLETO)

- [x] SummaryTable sticky component
- [x] GranularTable con sorting ↑↓
- [x] Row expansion logic (ChevronDown/ChevronRight)
- [x] CSV export functionality
- [x] **Pagination** (20 filas/página con controles de navegación)
- [x] Search/filter inline
- [x] Tests (35/35 passing, incluye paginación)

### Phase 5: Integration & Testing (0.5 días - PENDIENTE)

- [ ] E2E tests de las 3 vistas
- [ ] Performance profiling
- [ ] Mobile responsiveness
- [ ] Accessibility audit

---

## Estado Actual del RFC-006 (2026-02-16)

**Progreso Global: ~90% Completo**

✅ **Completado:**
- Phase 1: Date Umbrella System (100%)
- Phase 2: Executive View (100% - sparklines descartado)
- Phase 3: Trends View (100%)
- Phase 4: Detailed View (100% - paginación + tests)

❌ **Pendiente:**
- Tests unitarios de dateUmbrella (baja prioridad)
- Phase 5 completa (v0.7.0+)

**Extras Implementados:**
- Chart type selectors (bar/line/area) en DimensionGrid y CategoryChart
- Badge styling unificado (lucide icons)
- Layout del header reorganizado (RFC-006 Sección 3.1)

**Total de commits en esta feature branch:** 24

---

## 7. Dependencies

### New Libraries

```json
{
  "dependencies": {
    "recharts": "^2.10.0"          // Ya existe, verificar versión
  }
}
```

---

## 8. Testing Strategy

### Date Umbrella Tests

```typescript
describe('createDateUmbrella', () => {
  it('should align dates by calendar month ignoring year', () => {
    const groupA = [
      { date: '2023-01-15', revenue: 100 },
      { date: '2023-02-15', revenue: 200 },
    ];
    
    const groupB = [
      { date: '2024-01-15', revenue: 150 },
      { date: '2024-02-15', revenue: 250 },
    ];
    
    const result = createDateUmbrella(groupA, groupB, 'date', 'revenue', 'months', true);
    
    expect(result).toHaveLength(2);
    expect(result[0].umbrellaKey).toBe('01');  // Enero
    expect(result[0].groupA?.value).toBe(100);
    expect(result[0].groupB?.value).toBe(150);
    expect(result[1].umbrellaKey).toBe('02');  // Febrero
  });
  
  it('should omit gaps when both groups have no data', () => {
    const groupA = [{ date: '2023-01-15', revenue: 100 }];
    const groupB = [{ date: '2024-03-15', revenue: 300 }];
    
    const result = createDateUmbrella(groupA, groupB, 'date', 'revenue', 'months', true);
    
    // Febrero no debe aparecer (gap)
    expect(result).toHaveLength(2);
    expect(result[0].umbrellaKey).toBe('01');
    expect(result[1].umbrellaKey).toBe('03');
  });
  
  it('should support weeks granularity', () => {
    // ... test con semanas
  });
  
  it('should support quarters granularity', () => {
    // ... test con trimestres
  });
});
```

---

## 9. Performance Considerations (Implementado)

### ✅ Implementado en v0.6.0

- **Memoization:** 
  - ✅ Todos los cálculos de Date Umbrella memoizados con `React.useMemo`
  - ✅ GranularTable: 3 hooks de memoization (granularRows, filteredRows, sortedRows)
  - ✅ TrendChart y MiniTrendChart con memoization de aggregated data

- **Pagination (Alternative to Virtualization):**
  - ✅ GranularTable implementa paginación con 20 filas/página
  - ✅ Auto-reset a página 1 en cambios de filtro/ordenamiento
  - ✅ Controles de navegación: First, Previous, Next, Last
  - **Trade-off:** Más simple que virtualización, adecuado para <1000 filas

### ⚠️ Pendiente para v0.7.0+ (Nice-to-Have)

- **Virtualization:** 
  - ❌ NO implementado (pagination usado en su lugar)
  - Considerar react-window/react-virtual solo si datasets >1000 filas

- **Lazy Loading:** 
  - ❌ Charts cargan inmediatamente (no lazy loading)
  - Performance actual es aceptable, prioridad baja

- **Debounced Search:** 
  - ❌ Búsqueda con onChange directo (sin debounce 300ms)
  - Funciona bien con memoization, mejora futura para UX

### 📊 Performance Actual

- **Build size:** 472 kB (gzipped)
- **Bundle time:** ~6.25s
- **Tests:** 35/35 passing para GranularTable
- **Render:** <100ms para datasets típicos (<500 filas)
- **Memory:** Acceptable con memoization estratégica

---

## 10. Future Enhancements (v0.7.0+)

- [ ] **Interactive Charts:** Zoom, pan, brush selection
- [ ] **Custom Time Ranges:** "Últimos 90 días", "Este trimestre"
- [ ] **Comparison Modes:** "% vs Absolute" toggle
- [ ] **Chart Types:** Pie, Scatter, Heatmap
- [ ] **Drill-down:** Click en gráfico → filtrar tabla automáticamente

---

**Última actualización:** 2026-02-16  
**Próximo Review:** Después de completar Phase 5
