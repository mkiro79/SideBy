/**
 * Column Mapping Step Component
 * 
 * Paso 2: Configurar mapping de columnas (dimensión + KPIs)
 * Incluye vista previa lado a lado de ambos archivos
 */

import { useState } from 'react';
import { Plus, X, TrendingUp, Star, Calendar } from 'lucide-react';
import { Button } from '@/shared/components/ui/button.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select.js';
import { Input } from '@/shared/components/ui/Input.js';
import { Label } from '@/shared/components/ui/Label.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { Card } from '@/shared/components/ui/card.js';
import { Alert, AlertDescription } from '@/shared/components/ui/alert.js';
import { Checkbox } from '@/shared/components/ui/checkbox.js';
import { useWizardState } from '../../hooks/useWizardState.js';
import { FilePreview } from '../FilePreview.js';
import type { KPIMappingField, KPIFormat } from '../../types/wizard.types.js';

export function ColumnMappingStep() {
  const { fileA, fileB, mapping, setMapping, addKPIField, removeKPIField } = useWizardState();
  
  const [newKPIColumn, setNewKPIColumn] = useState('');
  const [newKPILabel, setNewKPILabel] = useState('');
  const [newKPIFormat, setNewKPIFormat] = useState<KPIFormat>('number');
  
  const availableColumns = fileA.parsedData?.headers || [];
  const dimensionField = mapping.dimensionField;
  const kpiFields = mapping.kpiFields || [];
  const categoricalFields = mapping.categoricalFields || [];
  
  // Columnas no usadas (disponibles para KPIs)
  const availableKPIColumns = availableColumns.filter(
    (col) =>
      col !== dimensionField &&
      col !== mapping.dateField &&
      !(kpiFields || []).some((kpi) => kpi.columnName === col)
  );
  
  // Columnas disponibles para categorical (strings, excluye dimensión, KPIs, fecha)
  const availableCategoricalColumns = availableColumns.filter((col) => {
    if (col === dimensionField || col === mapping.dateField) return false;
    if ((kpiFields || []).some((kpi) => kpi.columnName === col)) return false;
    
    // Detectar si es string
    const sampleRow = fileA.parsedData?.rows[0];
    if (!sampleRow) return false;
    const value = sampleRow[col];
    return typeof value === 'string';
  });
  
  // Detectar posibles columnas de fecha
  const dateColumns = availableColumns.filter((col) =>
    /fecha|date|time|periodo|year|mes|month/i.test(col)
  );
  
  /**
   * Handler para agregar KPI
   */
  const handleAddKPI = () => {
    if (!newKPIColumn || !newKPILabel) return;
    
    const newField: KPIMappingField = {
      id: `kpi_${Date.now()}`,
      columnName: newKPIColumn,
      label: newKPILabel,
      format: newKPIFormat,
      highlighted: false, // Por defecto no destacado
    };
    
    addKPIField(newField);
    
    // Reset form
    setNewKPIColumn('');
    setNewKPILabel('');
    setNewKPIFormat('number');
  };
  
  /**
   * Handler para toggle de KPI destacado
   */
  const handleToggleHighlighted = (kpiId: string) => {
    const updatedKPIs = (kpiFields || []).map((kpi) => {
      if (kpi.id === kpiId) {
        return { ...kpi, highlighted: !kpi.highlighted };
      }
      return kpi;
    });
    
    setMapping({ kpiFields: updatedKPIs });
  };
  
  /**
   * Handler para toggle de campo categórico
   */
  const handleToggleCategorical = (columnName: string) => {
    const currentCategorical = categoricalFields || [];
    const isSelected = currentCategorical.includes(columnName);
    
    const updatedCategorical = isSelected
      ? currentCategorical.filter((col) => col !== columnName)
      : [...currentCategorical, columnName];
    
    setMapping({ categoricalFields: updatedCategorical });
  };
  
  // Contar KPIs destacados
  const highlightedCount = (kpiFields || []).filter((kpi) => kpi.highlighted).length;
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Mapeo de columnas</h2>
        <p className="text-muted-foreground">
          Define qué columna contiene las dimensiones (ej: categorías, regiones) y cuáles son los KPIs numéricos (ej: ventas, inventario).
        </p>
      </div>
      
      {/* Vista previa lado a lado */}
      {fileA.parsedData && fileB.parsedData && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Vista previa de los archivos</h3>
          <div className="grid gap-6 lg:grid-cols-2">
            <FilePreview
              fileName={fileA.file?.name || 'Archivo A'}
              label="Archivo A (Datos Actuales)"
              variant="primary"
              headers={fileA.parsedData.headers}
              rows={fileA.parsedData.rows.slice(0, 5)}
              totalRows={fileA.parsedData.rowCount}
            />
            <FilePreview
              fileName={fileB.file?.name || 'Archivo B'}
              label="Archivo B (Datos Comparativos)"
              variant="comparative"
              headers={fileB.parsedData.headers}
              rows={fileB.parsedData.rows.slice(0, 5)}
              totalRows={fileB.parsedData.rowCount}
            />
          </div>
        </div>
      )}
      
      {/* Dimension Field Selection */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dimension-field">
            Campo de dimensión <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            La columna que agrupa tus datos (ej: "Producto", "Región", "Categoría")
          </p>
        </div>
        
        <Select
          value={dimensionField || ''}
          onValueChange={(value: string) => setMapping({ dimensionField: value })}
        >
          <SelectTrigger id="dimension-field" className="w-full">
            <SelectValue placeholder="Selecciona la columna de dimensión" />
          </SelectTrigger>
          <SelectContent>
            {availableColumns.map((col) => (
              <SelectItem key={col} value={col}>
                {col}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Selector de columna de fecha (opcional) */}
        {dateColumns.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="date-field">Columna de fecha (opcional)</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Detectamos posibles columnas de fecha. Selecciona una para análisis temporal.
            </p>
            <Select
              value={mapping.dateField || 'none'}
              onValueChange={(value: string) => setMapping({ dateField: value === 'none' ? null : value })}
            >
              <SelectTrigger id="date-field">
                <SelectValue placeholder="Ninguna (omitir análisis temporal)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {dateColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>
      
      {/* KPI Fields Configuration */}
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label>
            Campos KPI <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Columnas numéricas que quieres comparar entre ambos archivos
          </p>
        </div>
        
        {/* Lista de KPIs configurados */}
        {(kpiFields || []).length > 0 && (
          <div className="space-y-3">
            {highlightedCount < 4 ? (
              <Alert>
                <Star className="h-4 w-4" />
                <AlertDescription>
                  <strong>KPIs Destacados:</strong> Marca hasta 4 KPIs como destacados para mostrarlos en las tarjetas principales del dashboard ({highlightedCount}/4 seleccionados).
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="warning">
                <AlertDescription>
                  Has alcanzado el límite de 4 KPIs destacados. Desmarca uno para destacar otro.
                </AlertDescription>
              </Alert>
            )}
            
            {(kpiFields || []).map((kpi) => (
              <div
                key={kpi.id}
                className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{kpi.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Columna: <code className="text-xs">{kpi.columnName}</code>
                    </p>
                  </div>
                  <Badge variant="outline">{formatLabels[kpi.format]}</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Toggle para destacar */}
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id={`highlight-${kpi.id}`}
                      checked={kpi.highlighted || false}
                      onCheckedChange={() => handleToggleHighlighted(kpi.id)}
                      disabled={!kpi.highlighted && highlightedCount >= 4}
                    />
                    <Label
                      htmlFor={`highlight-${kpi.id}`}
                      className="text-xs cursor-pointer flex items-center gap-1"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${kpi.highlighted ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                      />
                      Destacar
                    </Label>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeKPIField(kpi.id)}
                    aria-label={`Eliminar ${kpi.label}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Formulario para agregar nuevo KPI */}
        <div className="space-y-4 pt-4 border-t">
          <Label>Agregar nuevo KPI</Label>
          
          <div className="grid gap-4">
            {/* Columna fuente */}
            <div className="space-y-2">
              <Label htmlFor="kpi-column">Columna</Label>
              <Select
                value={newKPIColumn}
                onValueChange={setNewKPIColumn}
                disabled={availableKPIColumns.length === 0}
              >
                <SelectTrigger id="kpi-column">
                  <SelectValue placeholder="Selecciona una columna" />
                </SelectTrigger>
                <SelectContent>
                  {availableKPIColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Label personalizado */}
            <div className="space-y-2">
              <Label htmlFor="kpi-label">Etiqueta para mostrar</Label>
              <Input
                id="kpi-label"
                value={newKPILabel}
                onChange={(e) => setNewKPILabel(e.target.value)}
                placeholder="Ej: Ventas totales"
              />
            </div>
            
            {/* Formato */}
            <div className="space-y-2">
              <Label htmlFor="kpi-format">Formato</Label>
              <Select
                value={newKPIFormat}
                onValueChange={(value: string) => setNewKPIFormat(value as KPIFormat)}
              >
                <SelectTrigger id="kpi-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="currency">Moneda ($)</SelectItem>
                  <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Botón agregar */}
            <Button
              onClick={handleAddKPI}
              disabled={!newKPIColumn || !newKPILabel || availableKPIColumns.length === 0}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar KPI
            </Button>
          </div>
        </div>
        
        {/* Alert si no hay columnas disponibles */}
        {availableKPIColumns.length === 0 && (kpiFields || []).length === 0 && (
          <Alert variant="warning">
            <AlertDescription>
              {dimensionField
                ? 'No hay más columnas disponibles para KPIs. Cambia el campo de dimensión si necesitas usar otra columna.'
                : 'Primero selecciona un campo de dimensión.'}
            </AlertDescription>
          </Alert>
        )}
      </Card>
      
      {/* Categorical Fields Selection */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Campos categóricos (opcional)</Label>
          <p className="text-sm text-muted-foreground">
            Selecciona columnas de texto para crear filtros en el dashboard (ej: "Canal", "Región", "Tipo de Cliente")
          </p>
        </div>
        
        {availableCategoricalColumns.length > 0 ? (
          <div className="space-y-2">
            {availableCategoricalColumns.map((col) => (
              <div
                key={col}
                className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={`categorical-${col}`}
                  checked={categoricalFields.includes(col)}
                  onCheckedChange={() => handleToggleCategorical(col)}
                />
                <Label
                  htmlFor={`categorical-${col}`}
                  className="flex-1 cursor-pointer font-normal"
                >
                  {col}
                </Label>
                {categoricalFields.includes(col) && (
                  <Badge variant="secondary" className="text-xs">
                    Filtrable
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              No hay columnas de texto disponibles para usar como filtros categóricos.
            </AlertDescription>
          </Alert>
        )}
        
        {categoricalFields.length > 0 && (
          <Alert>
            <AlertDescription className="text-sm">
              ✅ {categoricalFields.length} campo(s) seleccionado(s): {categoricalFields.join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

const formatLabels: Record<KPIFormat, string> = {
  number: 'Número',
  currency: 'Moneda',
  percentage: 'Porcentaje',
  date: 'Fecha',
  string: 'Texto',
};
