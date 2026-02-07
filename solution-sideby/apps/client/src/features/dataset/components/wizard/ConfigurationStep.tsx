/**
 * Configuration Step Component
 * 
 * Paso 3: Metadata  + AI Config + Preview
 */

import { Sparkles, Info } from 'lucide-react';
import { Label } from '@/shared/components/ui/Label.js';
import { Input } from '@/shared/components/ui/Input.js';
import { Textarea } from '@/shared/components/ui/textarea.js';
import { Card } from '@/shared/components/ui/card.js';
import { Alert, AlertDescription } from '@/shared/components/ui/alert.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { useWizardState } from '../../hooks/useWizardState.js';
import { getSampleRows } from '../../utils/csvParser.js';

export function ConfigurationStep() {
  const { metadata, aiConfig, setMetadata, setAIConfig, fileA, fileB, mapping } = useWizardState();
  
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
      
      {/* Metadata Form */}
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
      
      {/* AI Configuration */}
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
          <label className="relative inline-flex items-center cursor-pointer">
            <input
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
      
      {/* Preview Summary */}
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
            <p>{mapping.kpiFields.length} campo(s)</p>
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
                {sampleDataA.map((row, i) => (
                  <tr key={`a-${i}`} className="border-t">
                    <td className="p-2 font-medium text-data-primary">A</td>
                    {fileA.parsedData?.headers.slice(0, 4).map((header) => (
                      <td key={header} className="p-2">
                        {String(row[header] ?? '')}
                      </td>
                    ))}
                    {(fileA.parsedData?.headers.length || 0) > 4 && (
                      <td className="p-2 text-muted-foreground">...</td>
                    )}
                  </tr>
                ))}
                {sampleDataB.map((row, i) => (
                  <tr key={`b-${i}`} className="border-t">
                    <td className="p-2 font-medium text-data-comparative">B</td>
                    {fileB.parsedData?.headers.slice(0, 4).map((header) => (
                      <td key={header} className="p-2">
                        {String(row[header] ?? '')}
                      </td>
                    ))}
                    {(fileB.parsedData?.headers.length || 0) > 4 && (
                      <td className="p-2 text-muted-foreground">...</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      
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
