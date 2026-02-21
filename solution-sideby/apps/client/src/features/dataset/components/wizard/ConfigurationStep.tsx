/**
 * Configuration Step Component
 * 
 * Paso 3: Metadata + AI Config + Resumen completo + Preview
 */

import { Sparkles, Info, CheckCircle2, FileSpreadsheet, BarChart3, Calendar, Hash, Layers } from 'lucide-react';
import { Label } from '@/shared/components/ui/Label.js';
import { Input } from '@/shared/components/ui/Input.js';
import { Textarea } from '@/shared/components/ui/textarea.js';
import { Card, CardContent } from '@/shared/components/ui/card.js';
import { Alert, AlertDescription } from '@/shared/components/ui/alert.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { useWizardState } from '../../hooks/useWizardState.js';
import { getSampleRows } from '../../utils/csvParser.js';
import { FEATURES } from '@/config/features.js';

/**
 * Formatea un valor de celda para mostrar
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  // En este punto value es string, number, boolean o bigint
  return String(value as string | number | boolean | bigint);
}

/**
 * Valida si un string es un color hexadecimal válido (#RGB o #RRGGBB)
 */
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export function ConfigurationStep() {
  const {
    metadata,
    aiConfig,
    sourceConfig,
    setMetadata,
    setAIConfig,
    setSourceConfig,
    fileA,
    fileB,
    mapping,
  } = useWizardState();
  
  const sampleDataA = fileA.parsedData ? getSampleRows(fileA.parsedData, 3) : [];
  const sampleDataB = fileB.parsedData ? getSampleRows(fileB.parsedData, 3) : [];
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Configuración final</h2>
        <p className="text-muted-foreground">
          Completa la información del dataset y configura opciones avanzadas.
        </p>
      </div>
      
      {/* Success Message con Check Circle */}
      <div className="flex flex-col items-center justify-center py-6 px-4 bg-data-success/5 border border-data-success/20 rounded-lg">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-data-success/10">
          <CheckCircle2 className="h-8 w-8 text-data-success" />
        </div>
        <h3 className="text-lg font-semibold mb-1">¡Datos unificados correctamente!</h3>
        <p className="text-center text-sm text-muted-foreground">
          Tus archivos han sido procesados y validados. Completa la configuración para crear el dataset.
        </p>
      </div>
      
      {/* Resumen Completo con Métricas del Dataset Unificado */}
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Resumen del Dataset Unificado</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Vista previa de la configuración y datos combinados
          </p>
        </div>
        
        {/* Cards de Archivos con borde de color */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* File A Card */}
          <Card className="border-l-4 border-l-data-primary" data-file-card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-data-primary/10">
                  <FileSpreadsheet className="h-5 w-5 text-data-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">Archivo A (Actual)</p>
                  <p className="font-medium text-sm mt-0.5 truncate">
                    {fileA.file?.name || 'Archivo A'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {fileA.parsedData?.rowCount.toLocaleString() || 0} filas
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {fileA.parsedData?.headers.length || 0} columnas
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File B Card */}
          <Card className="border-l-4 border-l-data-comparative" data-file-card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-data-comparative/10">
                  <FileSpreadsheet className="h-5 w-5 text-data-comparative" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">Archivo B (Comparativo)</p>
                  <p className="font-medium text-sm mt-0.5 truncate">
                    {fileB.file?.name || 'Archivo B'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {fileB.parsedData?.rowCount.toLocaleString() || 0} filas
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {fileB.parsedData?.headers.length || 0} columnas
                    </Badge>
                  </div>
                </div>
              </div>
</CardContent>
          </Card>
        </div>
        
        {/* Métricas del Dataset Unificado */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t">
          {/* Total Rows */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="h-4 w-4" />
              Total de Filas
            </div>
            <p className="text-2xl font-semibold">
              {((fileA.parsedData?.rowCount || 0) + (fileB.parsedData?.rowCount || 0)).toLocaleString()}
            </p>
          </div>

          {/* Dimension Field */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              Campo Dimensión
            </div>
            <p className="text-lg font-semibold truncate">
              {mapping.dimensionField || 'N/A'}
            </p>
          </div>

          {/* Date Column */}
          {mapping.dateField && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Columna de Fecha
              </div>
              <p className="text-lg font-semibold truncate">
                {mapping.dateField}
              </p>
            </div>
          )}

          {/* KPIs Count */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              KPIs Configurados
            </div>
            <p className="text-2xl font-semibold">
              {(mapping.kpiFields || []).length}
            </p>
          </div>
        </div>

        {/* KPI List */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-semibold">KPIs Seleccionados:</h4>
          <div className="flex flex-wrap gap-2">
            {(mapping.kpiFields || []).map((kpi) => (
              <Badge key={kpi.id} variant="outline" className="text-xs">
                {kpi.label} ({kpi.format})
                {kpi.highlighted && ' ⭐'}
              </Badge>
            ))}
          </div>
          {(mapping.kpiFields || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No hay KPIs configurados</p>
          )}
        </div>
      </Card>
      
      {/* Preview Summary con tabla antigua (preservado por compatibilidad) */}
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Resumen de configuración</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {/* Archivos */}
          <div>
            <p className="font-medium text-muted-foreground">Archivo A</p>
            <p className="font-mono text-xs">{fileA.file?.name}</p>
            <p className="text-muted-foreground">
              {fileA.parsedData?.rowCount} filas
            </p>
          </div>
          
          <div>
            <p className="font-medium text-muted-foreground">Archivo B</p>
            <p className="font-mono text-xs">{fileB.file?.name}</p>
            <p className="text-muted-foreground">
              {fileB.parsedData?.rowCount} filas
            </p>
          </div>
          
          {/* Mapping */}
          <div>
            <p className="font-medium text-muted-foreground">Campo dimensión</p>
            <p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {mapping.dimensionField}
              </code>
            </p>
          </div>
          
          <div>
            <p className="font-medium text-muted-foreground">KPIs configurados</p>
            <p>{(mapping.kpiFields || []).length} campo(s)</p>
          </div>

          {/* Grupos */}
          <div>
            <p className="font-medium text-muted-foreground">Grupo A</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: sourceConfig.groupA.color }}
              />
              <p>{sourceConfig.groupA.label}</p>
            </div>
          </div>

          <div>
            <p className="font-medium text-muted-foreground">Grupo B</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: sourceConfig.groupB.color }}
              />
              <p>{sourceConfig.groupB.label}</p>
            </div>
          </div>
        </div>
        
        {/* Sample Data Preview */}
        <div className="pt-4 border-t">
          <p className="font-medium text-sm mb-3">Vista previa (primeras 3 filas)</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs border rounded-lg">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left font-medium">Archivo</th>
                  {fileA.parsedData?.headers.slice(0, 4).map((header) => (
                    <th key={header} className="p-2 text-left font-medium">
                      {header}
                    </th>
                  ))}
                  {(fileA.parsedData?.headers.length || 0) > 4 && (
                    <th className="p-2 text-left text-muted-foreground">...</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sampleDataA.map((row, i) => {
                  const rowKey = `a-${JSON.stringify(Object.values(row).slice(0, 2))}`;
                  return (
                    <tr key={rowKey} className="border-t">
                      <td className="p-2 font-medium text-data-primary">A</td>
                      {fileA.parsedData?.headers.slice(0, 4).map((header) => {
                        const cellValue = row[header];
                        const displayValue = formatCellValue(cellValue);
                        return (
                          <td key={`a-${i}-${header}`} className="p-2">
                            {displayValue}
                          </td>
                        );
                      })}
                      {(fileA.parsedData?.headers.length || 0) > 4 && (
                        <td className="p-2 text-muted-foreground">...</td>
                      )}
                    </tr>
                  );
                })}
                {sampleDataB.map((row, i) => {
                  const rowKey = `b-${JSON.stringify(Object.values(row).slice(0, 2))}`;
                  return (
                    <tr key={rowKey} className="border-t">
                      <td className="p-2 font-medium text-data-comparative">B</td>
                      {fileB.parsedData?.headers.slice(0, 4).map((header) => {
                        const cellValue = row[header];
                        const displayValue = formatCellValue(cellValue);
                        return (
                          <td key={`b-${i}-${header}`} className="p-2">
                            {displayValue}
                          </td>
                        );
                      })}
                      {(fileB.parsedData?.headers.length || 0) > 4 && (
                        <td className="p-2 text-muted-foreground">...</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Información del dataset (antes de definición de grupos) */}
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Información del dataset</h3>
        </div>
        
        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="dataset-name">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dataset-name"
            value={metadata.name}
            onChange={(e) => setMetadata({ name: e.target.value })}
            placeholder="Ej: Ventas Q1 2024 vs Q1 2023"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {metadata.name.length}/100 caracteres
          </p>
        </div>
        
        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="dataset-description">Descripción (opcional)</Label>
          <Textarea
            id="dataset-description"
            value={metadata.description}
            onChange={(e) => setMetadata({ description: e.target.value })}
            placeholder="Describe el contenido y propósito de este dataset..."
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {metadata.description.length}/500 caracteres
          </p>
        </div>
      </Card>

      {/* Configuracion de grupos (al final de la pagina) */}
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Configuración de grupos</h3>
          <p className="text-sm text-muted-foreground">
            Personaliza etiquetas y colores para los grupos A y B.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-data-primary">Grupo A</h4>
            <div className="space-y-2">
              <Label htmlFor="group-a-label">Etiqueta Grupo A</Label>
              <Input
                id="group-a-label"
                value={sourceConfig.groupA.label}
                onChange={(e) =>
                  setSourceConfig({ groupA: { label: e.target.value } })
                }
                placeholder="Ej: Actual"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {sourceConfig.groupA.label.length}/50 caracteres
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-a-color">Color Grupo A</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="group-a-color"
                  type="color"
                  value={sourceConfig.groupA.color}
                  onChange={(e) =>
                    setSourceConfig({ groupA: { color: e.target.value } })
                  }
                  className="h-10 w-14 p-1"
                />
                <Input
                  aria-label="Hex Grupo A"
                  value={sourceConfig.groupA.color}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Solo actualizar si es vacío o un color hex válido
                    if (value === '' || isValidHexColor(value)) {
                      setSourceConfig({ groupA: { color: value } });
                    }
                  }}
                  placeholder="#3b82f6"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-data-comparative">Grupo B</h4>
            <div className="space-y-2">
              <Label htmlFor="group-b-label">Etiqueta Grupo B</Label>
              <Input
                id="group-b-label"
                value={sourceConfig.groupB.label}
                onChange={(e) =>
                  setSourceConfig({ groupB: { label: e.target.value } })
                }
                placeholder="Ej: Comparativo"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {sourceConfig.groupB.label.length}/50 caracteres
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-b-color">Color Grupo B</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="group-b-color"
                  type="color"
                  value={sourceConfig.groupB.color}
                  onChange={(e) =>
                    setSourceConfig({ groupB: { color: e.target.value } })
                  }
                  className="h-10 w-14 p-1"
                />
                <Input
                  aria-label="Hex Grupo B"
                  value={sourceConfig.groupB.color}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Solo actualizar si es vacío o un color hex válido
                    if (value === '' || isValidHexColor(value)) {
                      setSourceConfig({ groupB: { color: value } });
                    }
                  }}
                  placeholder="#6366f1"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* AI Configuration - Controlado por Feature Flag (FIX-02e: movido al final) */}
      {FEATURES.AI_ENABLED && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Análisis con IA</h3>
                <Badge variant="secondary">Beta</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Genera insights automáticos y recomendaciones basadas en tus datos
              </p>
            </div>
            
            {/* Toggle Switch */}
            <label htmlFor="ai-toggle" className="relative inline-flex items-center cursor-pointer">
              <span className="sr-only">Habilitar análisis con IA</span>
              <input
                id="ai-toggle"
                type="checkbox"
                checked={aiConfig.enabled}
                onChange={(e) => setAIConfig({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {/* Contexto adicional (solo si AI está habilitado) */}
          {aiConfig.enabled && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="ai-context">Contexto adicional para el análisis</Label>
              <Textarea
                id="ai-context"
                value={aiConfig.userContext}
                onChange={(e) => setAIConfig({ userContext: e.target.value })}
                placeholder="Ej: Este dataset compara ventas de productos en diferentes regiones. Prioriza análisis de crecimiento en la región Sur..."
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground">
                Proporciona contexto para obtener insights más relevantes (opcional)
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Al finalizar, se creará el dataset y podrás comenzar a visualizar las comparaciones
          en el Dashboard. Este proceso puede tardar unos segundos.
        </AlertDescription>
      </Alert>
    </div>
  );
}
