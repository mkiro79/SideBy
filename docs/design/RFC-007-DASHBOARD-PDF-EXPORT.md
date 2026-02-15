# [RFC-007] Dashboard PDF Export System - Interactive Reports

| Metadatos | Detalles |
| :--- | :--- |
| **Fecha / Date** | 2026-02-15 |
| **Estado / Status** | **Propuesto / Proposed** |
| **Prioridad / Priority** | Media |
| **Esfuerzo / Effort** | 3-4 días |
| **Alcance / Scope** | `apps/client/src/features/dataset/components/dashboard` |
| **Dependencias** | RFC-006 (Visualization Enhancements) |
| **Versión Target** | v0.7.0 |
| **Autor / Author** | Engineering Team |

---

## 1. Contexto y Motivación / Context & Motivation

### Problema Actual / Current Problem

Los usuarios no pueden exportar reportes del dashboard para:
- Compartir con stakeholders fuera de la plataforma
- Presentar en reuniones sin acceso al sistema
- Archivar snapshots de resultados
- Generar informes oficiales con marca corporativa

### Objetivos del RFC-007 / Goals

Implementar un sistema de exportación a PDF que:

1. **Mantiene Interactividad:** PDFs con links funcionales (no solo imágenes)
2. **Configurable:** El usuario elige qué secciones exportar
3. **Contexto Completo:** Incluye metadata (dataset, filtros, fecha generación)
4. **Responsive Layout:** Optimizado para A4 print
5. **Brand Consistency:** Aplica branding corporativo

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ ExportPDFButton (UI Trigger)                                │
│  ├─ useExportPDF (Hook with logic)                          │
│  ├─ PDFExportModal (Section selector)                       │
│  └─ generatePDF() → react-pdf/renderer                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ PDF Document Structure (@react-pdf/renderer)                │
│  ├─ Header (Logo + Title + Date)                            │
│  ├─ Metadata Section (Dataset, Filters, Period)             │
│  ├─ KPI Summary (Cards con valores)                         │
│  ├─ Chart Section (Rendered as Image)                       │
│  ├─ Table Section (Interactive with links)                  │
│  └─ Footer (Page numbers + Generated timestamp)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technical Implementation

### 3.1 Library Selection

**Opción Recomendada: `@react-pdf/renderer`**

**Ventajas:**
- ✅ Genera PDFs con links interactivos nativamente
- ✅ Componentes React familiares
- ✅ Soporte para tablas complejas
- ✅ No requiere backend para generación
- ✅ Control total de layout

**Alternativa Descartada: `jsPDF + html2canvas`**
- ❌ Genera PDFs como imagen (sin interactividad)
- ❌ Calidad de texto degradada
- ❌ Problemas con fonts custom

**Instalación:**
```bash
npm install @react-pdf/renderer --workspace=solution-sideby/apps/client
```

---

### 3.2 Component Structure

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/ExportPDFButton.tsx`

```typescript
/**
 * Botón trigger para exportar PDF
 */

import React from 'react';
import { Button } from '@/shared/components/ui/button.js';
import { Download } from 'lucide-react';
import { PDFExportModal } from './PDFExportModal.js';

interface ExportPDFButtonProps {
  dataset: Dataset;
  filters: DashboardFilters;
  kpis: KPICalculation[];
  chartData: DataRow[];
}

export const ExportPDFButton: React.FC<ExportPDFButtonProps> = (props) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  return (
    <>
      <Button variant="outline" onClick={() => setIsModalOpen(true)}>
        <Download className="h-4 w-4 mr-2" />
        Exportar PDF
      </Button>
      
      <PDFExportModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        {...props}
      />
    </>
  );
};
```

---

**Archivo:** `PDFExportModal.tsx`

```typescript
/**
 * Modal para configurar qué secciones exportar
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog.js';
import { Checkbox } from '@/shared/components/ui/checkbox.js';
import { Button } from '@/shared/components/ui/button.js';
import { Label } from '@/shared/components/ui/label.js';
import { useExportPDF } from '../../hooks/useExportPDF.js';

interface PDFExportModalProps {
  open: boolean;
  onClose: () => void;
  dataset: Dataset;
  filters: DashboardFilters;
  kpis: KPICalculation[];
  chartData: DataRow[];
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({
  open,
  onClose,
  ...data
}) => {
  const [sections, setSections] = React.useState({
    metadata: true,
    kpiSummary: true,
    charts: true,
    table: true,
    aiInsights: false,  // Opcional
  });
  
  const { generatePDF, isGenerating } = useExportPDF();
  
  const handleExport = async () => {
    await generatePDF({
      ...data,
      sections,
    });
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>📄 Exportar Dashboard a PDF</DialogTitle>
          <DialogDescription>
            Selecciona las secciones que deseas incluir en el reporte
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="metadata"
              checked={sections.metadata}
              onCheckedChange={(checked) =>
                setSections({ ...sections, metadata: !!checked })
              }
            />
            <Label htmlFor="metadata" className="cursor-pointer">
              Metadata (Dataset, Filtros, Período)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="kpiSummary"
              checked={sections.kpiSummary}
              onCheckedChange={(checked) =>
                setSections({ ...sections, kpiSummary: !!checked })
              }
            />
            <Label htmlFor="kpiSummary" className="cursor-pointer">
              Resumen de KPIs
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="charts"
              checked={sections.charts}
              onCheckedChange={(checked) =>
                setSections({ ...sections, charts: !!checked })
              }
            />
            <Label htmlFor="charts" className="cursor-pointer">
              Gráficos
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="table"
              checked={sections.table}
              onCheckedChange={(checked) =>
                setSections({ ...sections, table: !!checked })
              }
            />
            <Label htmlFor="table" className="cursor-pointer">
              Tabla Comparativa
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="aiInsights"
              checked={sections.aiInsights}
              onCheckedChange={(checked) =>
                setSections({ ...sections, aiInsights: !!checked })
              }
            />
            <Label htmlFor="aiInsights" className="cursor-pointer">
              AI Insights (si disponible)
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isGenerating}>
            {isGenerating ? 'Generando...' : 'Generar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

### 3.3 PDF Generation Hook

**Archivo:** `solution-sideby/apps/client/src/features/dataset/hooks/useExportPDF.ts`

```typescript
/**
 * Hook para generar PDF con react-pdf/renderer
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { DashboardPDFDocument } from '../components/dashboard/DashboardPDFDocument.js';
import type { Dataset, DashboardFilters, KPICalculation, DataRow } from '../types/api.types.js';

interface ExportPDFOptions {
  dataset: Dataset;
  filters: DashboardFilters;
  kpis: KPICalculation[];
  chartData: DataRow[];
  sections: {
    metadata: boolean;
    kpiSummary: boolean;
    charts: boolean;
    table: boolean;
    aiInsights: boolean;
  };
}

export function useExportPDF() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  const generatePDF = async (options: ExportPDFOptions) => {
    setIsGenerating(true);
    
    try {
      // 1. Generar blob del PDF
      const blob = await pdf(
        <DashboardPDFDocument {...options} />
      ).toBlob();
      
      // 2. Descargar archivo
      const filename = `dashboard-${options.dataset.meta.name}-${new Date().toISOString().split('T')[0]}.pdf`;
      saveAs(blob, filename);
      
      // 3. Toast de éxito
      console.log('PDF generado correctamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      // Toast de error
    } finally {
      setIsGenerating(false);
    }
  };
  
  return { generatePDF, isGenerating };
}
```

---

### 3.4 PDF Document Component (React PDF)

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/dashboard/DashboardPDFDocument.tsx`

```typescript
/**
 * Documento PDF completo usando @react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Image,
} from '@react-pdf/renderer';
import type { Dataset, DashboardFilters, KPICalculation, DataRow } from '../../types/api.types.js';

// Estilos PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '2pt solid #e5e7eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metadataLabel: {
    width: 120,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  metadataValue: {
    flex: 1,
    color: '#111827',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '23%',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    border: '1pt solid #e5e7eb',
  },
  kpiLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  kpiDelta: {
    fontSize: 10,
    marginTop: 4,
  },
  table: {
    display: 'table' as any,
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f9fafb',
    fontWeight: 'bold',
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    textAlign: 'center',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 9,
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 10,
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'underline',
  },
});

interface DashboardPDFDocumentProps {
  dataset: Dataset;
  filters: DashboardFilters;
  kpis: KPICalculation[];
  chartData: DataRow[];
  sections: {
    metadata: boolean;
    kpiSummary: boolean;
    charts: boolean;
    table: boolean;
    aiInsights: boolean;
  };
}

export const DashboardPDFDocument: React.FC<DashboardPDFDocumentProps> = ({
  dataset,
  filters,
  kpis,
  chartData,
  sections,
}) => {
  const generationDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  // Aplicar filtros al chartData para generar tabla filtrada
  const filteredTableData = applyFiltersToData(chartData, filters);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>📊 Dashboard Report</Text>
            <Text style={styles.subtitle}>{dataset.meta.name}</Text>
          </View>
          <View>
            {/* Logo (si está disponible) */}
            {/* <Image src="/logo.png" style={{ width: 60, height: 60 }} /> */}
          </View>
        </View>
        
        {/* ===== METADATA SECTION ===== */}
        {sections.metadata && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Información del Reporte</Text>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Dataset:</Text>
              <Text style={styles.metadataValue}>{dataset.meta.name}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Generado:</Text>
              <Text style={styles.metadataValue}>{generationDate}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Grupos Comparados:</Text>
              <Text style={styles.metadataValue}>
                {dataset.sourceConfig.groupA.label} vs {dataset.sourceConfig.groupB.label}
              </Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Filtros Aplicados:</Text>
              <Text style={styles.metadataValue}>
                {Object.keys(filters.categorical).length > 0
                  ? Object.entries(filters.categorical)
                      .map(([key, values]) => `${key}: ${values.join(', ')}`)
                      .join(' | ')
                  : 'Ninguno'}
              </Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Link a Dashboard:</Text>
              <Link
                src={`https://sideby.app/datasets/${dataset._id}/dashboard`}
                style={styles.link}
              >
                Ver Dashboard Interactivo ↗️
              </Link>
            </View>
          </View>
        )}
        
        {/* ===== KPI SUMMARY ===== */}
        {sections.kpiSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Resumen de KPIs</Text>
            <View style={styles.kpiGrid}>
              {kpis.map((kpi) => {
                const deltaPercent =
                  kpi.groupA !== 0 ? ((kpi.groupB - kpi.groupA) / kpi.groupA) * 100 : 0;
                const isPositive = deltaPercent > 0;
                
                return (
                  <View key={kpi.name} style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>{kpi.label}</Text>
                    <Text style={styles.kpiValue}>
                      {formatValue(kpi.groupB, kpi.format)}
                    </Text>
                    <Text
                      style={[
                        styles.kpiDelta,
                        { color: isPositive ? '#16a34a' : '#dc2626' },
                      ]}
                    >
                      {isPositive ? '↗️' : '↘️'} {deltaPercent.toFixed(1)}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        
        {/* ===== CHARTS ===== */}
        {sections.charts && (
          <View style={styles.section} break>
            <Text style={styles.sectionTitle}>📈 Gráficos</Text>
            <Text style={{ fontSize: 9, color: '#6b7280', fontStyle: 'italic' }}>
              Nota: Los gráficos se exportan como imágenes estáticas. Para gráficos
              interactivos, visita el dashboard online.
            </Text>
            {/* Aquí se renderizarían las imágenes de los charts */}
            {/* Se puede usar html2canvas para capturar los charts antes de generar el PDF */}
          </View>
        )}
        
        {/* ===== TABLE ===== */}
        {sections.table && (
          <View style={styles.section} break>
            <Text style={styles.sectionTitle}>📋 Tabla Comparativa</Text>
            <View style={styles.table}>
              {/* Header */}
              <View style={styles.tableRow}>
                <Text style={styles.tableHeaderCell}>Dimensión</Text>
                {kpis.map((kpi) => (
                  <React.Fragment key={kpi.name}>
                    <Text style={styles.tableHeaderCell}>{kpi.label} (A)</Text>
                    <Text style={styles.tableHeaderCell}>{kpi.label} (B)</Text>
                    <Text style={styles.tableHeaderCell}>Δ %</Text>
                  </React.Fragment>
                ))}
              </View>
              
              {/* Rows (primeras 20 filas para no saturar) */}
              {filteredTableData.slice(0, 20).map((row, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { textAlign: 'left' }]}>
                    {row.dimensionValue}
                  </Text>
                  {kpis.map((kpi) => {
                    const groupAValue = row[`${kpi.name}_groupA`] || 0;
                    const groupBValue = row[`${kpi.name}_groupB`] || 0;
                    const delta = groupAValue !== 0 ? ((groupBValue - groupAValue) / groupAValue) * 100 : 0;
                    
                    return (
                      <React.Fragment key={kpi.name}>
                        <Text style={styles.tableCell}>
                          {formatValue(groupAValue, kpi.format)}
                        </Text>
                        <Text style={styles.tableCell}>
                          {formatValue(groupBValue, kpi.format)}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            { color: delta > 0 ? '#16a34a' : '#dc2626' },
                          ]}
                        >
                          {delta > 0 ? '+' : ''}
                          {delta.toFixed(1)}%
                        </Text>
                      </React.Fragment>
                    );
                  })}
                </View>
              ))}
            </View>
            
            {filteredTableData.length > 20 && (
              <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 8 }}>
                * Mostrando solo las primeras 20 filas. Accede al dashboard completo para ver
                todos los datos.
              </Text>
            )}
          </View>
        )}
        
        {/* ===== FOOTER ===== */}
        <Text style={styles.footer} fixed>
          Generado con SideBy • {generationDate} • Página{' '}
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </Text>
      </Page>
    </Document>
  );
};

// Helper functions
function formatValue(value: number, format: 'number' | 'currency' | 'percentage'): string {
  if (value === null || value === undefined) return 'N/A';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }).format(value);
    case 'percentage':
      return `${value.toFixed(2)}%`;
    default:
      return new Intl.NumberFormat('es-ES').format(value);
  }
}

function applyFiltersToData(data: DataRow[], filters: DashboardFilters): any[] {
  // Lógica de filtrado para generar datos de tabla
  // ...
  return data;
}
```

---

### 3.5 Chart Capture for PDF (Optional)

Para incluir gráficos como imágenes en el PDF, se puede usar la siguiente estrategia:

**Opción 1: html2canvas (Client-side)**

```typescript
import html2canvas from 'html2canvas';

async function captureChartAsImage(chartElementId: string): Promise<string> {
  const element = document.getElementById(chartElementId);
  if (!element) return '';
  
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,  // Mejor calidad
  });
  
  return canvas.toDataURL('image/png');
}

// Uso en el hook:
const chartImage = await captureChartAsImage('main-chart');

// Luego en el PDF Document:
<Image src={chartImage} style={{ width: '100%', height: 200 }} />
```

**Opción 2: Backend Chart Rendering (Headless Browser)**

```typescript
// Endpoint en el backend
POST /api/v1/datasets/:id/export-pdf
{
  filters: { ... },
  sections: { ... }
}

// Backend usa Puppeteer para capturar charts
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:3000/datasets/${id}/dashboard`);
const chartBuffer = await page.screenshot({ selector: '#main-chart' });
// ... generar PDF con el buffer
```

---

## 4. User Journey

```
1. Usuario abre Dashboard
   ↓
2. Aplica filtros deseados
   ↓
3. Click en "Exportar PDF" (Header action)
   ↓
4. Modal aparece con checkboxes:
   [ ] Metadata
   [ ] KPI Summary
   [ ] Charts (capturas)
   [ ] Table
   [ ] AI Insights
   ↓
5. Usuario selecciona secciones
   ↓
6. Click "Generar PDF"
   ↓
7. Loading spinner (2-5 segundos)
   ↓
8. Descarga automática del archivo
   ↓
9. Toast: "PDF generado correctamente ✅"
```

---

## 5. PDF Features Checklist

### Must-Have (v0.7.0)

- [x] **Interactive Links:** Links a dashboard online funcionales
- [x] **Metadata Section:** Dataset, filtros, fecha generación
- [x] **KPI Summary:** Cards con valores y deltas
- [x] **Table Export:** Primeras 20-50 filas
- [x] **Page Numbers:** Footer con numeración
- [x] **A4 Optimized:** Layout optimizado para impresión
- [x] **Section Selector:** Modal para elegir qué exportar

### Nice-to-Have (v0.8.0+)

- [ ] **Chart Images:** Gráficos como PNG embedido
- [ ] **Multi-page Tables:** Tablas grandes divididas en múltiples páginas
- [ ] **Custom Branding:** Upload de logo corporativo
- [ ] **Email Sending:** Enviar PDF por email directamente
- [ ] **Scheduled Reports:** Generación automática semanal/mensual
- [ ] **Password Protection:** PDFs protegidos con contraseña

---

## 6. Implementation Plan

### Phase 1: Core PDF Generation (1.5 días)

- [ ] Instalar `@react-pdf/renderer` + `file-saver`
- [ ] Crear `DashboardPDFDocument.tsx` con estructura base
- [ ] Implementar metadata section
- [ ] Implementar KPI summary section
- [ ] Implementar header + footer
- [ ] Tests básicos de generación

### Phase 2: UI Integration (1 día)

- [ ] Crear `ExportPDFButton.tsx`
- [ ] Crear `PDFExportModal.tsx` con checkboxes
- [ ] Integrar en `DatasetDashboard.tsx` header
- [ ] Implementar loading states
- [ ] Toast notifications

### Phase 3: Advanced Features (1 día)

- [ ] Implementar table section con paginación
- [ ] Integrar chart capture (html2canvas)
- [ ] Aplicar filtros correctamente
- [ ] Styling polish (branding)
- [ ] Mobile responsiveness

### Phase 4: Testing & Polish (0.5 días)

- [ ] E2E tests de export
- [ ] Cross-browser testing
- [ ] PDF viewer testing (Adobe, Chrome, Firefox)
- [ ] Performance profiling (large datasets)
- [ ] Documentation

---

## 7. Dependencies & Installation

```bash
# Client-side
cd solution-sideby/apps/client
npm install @react-pdf/renderer file-saver html2canvas

# Types
npm install --save-dev @types/file-saver
```

**package.json addition:**
```json
{
  "dependencies": {
    "@react-pdf/renderer": "^4.0.0",
    "file-saver": "^2.0.5",
    "html2canvas": "^1.4.1"
  }
}
```

---

## 8. Testing Strategy

### Unit Tests

```typescript
describe('useExportPDF', () => {
  it('should generate PDF with all sections', async () => {
    const { result } = renderHook(() => useExportPDF());
    
    const options = {
      dataset: mockDataset,
      filters: {},
      kpis: mockKPIs,
      chartData: [],
      sections: {
        metadata: true,
        kpiSummary: true,
        charts: true,
        table: true,
        aiInsights: false,
      },
    };
    
    await act(async () => {
      await result.current.generatePDF(options);
    });
    
    expect(result.current.isGenerating).toBe(false);
    // Verificar que saveAs fue llamado
  });
});
```

### E2E Tests

```typescript
test('Usuario exporta PDF con filtros aplicados', async ({ page }) => {
  await page.goto('/datasets/123/dashboard');
  
  // Aplicar filtros
  await page.click('[data-testid="filter-region"]');
  await page.click('[data-testid="region-norte"]');
  
  // Exportar PDF
  await page.click('[data-testid="export-pdf"]');
  
  // Seleccionar secciones
  await page.check('[data-testid="section-metadata"]');
  await page.check('[data-testid="section-kpis"]');
  await page.check('[data-testid="section-table"]');
  
  // Generar
  await page.click('[data-testid="generate-pdf"]');
  
  // Esperar descarga
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain('.pdf');
});
```

---

## 9. Performance Considerations

- **Lazy Capture:** Solo capturar charts si el usuario selecciona la sección
- **Background Generation:** Usar Web Workers para no bloquear UI (futuro)
- **Streaming:** Para datasets muy grandes, generar PDF en backend
- **Caching:** Cachear chart images para regeneración rápida

---

## 10. Security Considerations

- **Link Validation:** Los links en el PDF deben ser solo a dominios permitidos
- **Data Sanitization:** Sanitizar nombres de dataset/filtros antes de incluir en PDF
- **File Size Limits:** Limitar tamaño de PDF a 10MB (evitar DoS)
- **Rate Limiting:** Máximo 5 PDFs por usuario por minuto

---

## 11. Accessibility & UX

- **Loading Feedback:** Progress bar durante generación (if >3 segundos)
- **Error Handling:** Toast + Sentry si falla generación
- **Keyboard Shortcuts:** `Ctrl+P` para abrir modal de export
- **Preview:** (Futuro) Vista previa del PDF antes de descargar

---

## 12. Future Enhancements (v0.8.0+)

- [ ] **PDF Templates:** Múltiples layouts (Executive, Technical, Summary)
- [ ] **Batch Export:** Exportar múltiples dashboards en un solo PDF
- [ ] **Cloud Storage:** Guardar PDFs en Google Drive / Dropbox
- [ ] **Watermarks:** Marca de agua configurable
- [ ] **Digital Signatures:** Firmar PDFs con certificado

---

**Última actualización:** 2026-02-15  
**Próximo Review:** Después de implementar Phase 2

