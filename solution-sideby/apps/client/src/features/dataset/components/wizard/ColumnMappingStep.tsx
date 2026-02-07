/**
 * Column Mapping Step Component
 * 
 * Paso 2: Configurar mapping de columnas (dimensión + KPIs)
 */

import { useState } from 'react';
import { Plus, X, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select.js';
import { Input } from '@/shared/components/ui/Input.js';
import { Label } from '@/shared/components/ui/Label.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { Card } from '@/shared/components/ui/card.js';
import { Alert, AlertDescription } from '@/shared/components/ui/alert.js';
import { useWizardState } from '../../hooks/useWizardState.js';
import type { KPIMappingField } from '../../types/wizard.types.js';

export function ColumnMappingStep() {
  const { fileA, mapping, setMapping, addKPIField, removeKPIField } = useWizardState();
  
  const [newKPIColumn, setNewKPIColumn] = useState('');
  const [newKPILabel, setNewKPILabel] = useState('');
  const [newKPIFormat, setNewKPIFormat] = useState<'number' | 'currency' | 'percentage'>('number');
  
  const availableColumns = fileA.parsedData?.headers || [];
  const dimensionField = mapping.dimensionField;
  const kpiFields = mapping.kpiFields;
  
  // Columnas no usadas (disponibles para KPIs)
  const availableKPIColumns = availableColumns.filter(
    (col) =>
      col !== dimensionField &&
      !kpiFields.some((kpi) => kpi.columnName === col)
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
    };
    
    addKPIField(newField);
    
    // Reset form
    setNewKPIColumn('');
    setNewKPILabel('');
    setNewKPIFormat('number');
  };
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Mapeo de columnas</h2>
        <p className="text-muted-foreground">
          Define qué columna contiene las dimensiones (ej: categorías, regiones) y cuáles son los KPIs numéricos (ej: ventas, inventario).
        </p>
      </div>
      
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
        {kpiFields.length > 0 && (
          <div className="space-y-3">
            {kpiFields.map((kpi) => (
              <div
                key={kpi.id}
                className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{kpi.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Columna: <code className="text-xs">{kpi.columnName}</code>
                    </p>
                  </div>
                  <Badge variant="outline">{formatLabels[kpi.format]}</Badge>
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
                onValueChange={(value: string) => setNewKPIFormat(value as 'number' | 'currency' | 'percentage')}
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
        {availableKPIColumns.length === 0 && kpiFields.length === 0 && (
          <Alert variant="warning">
            <AlertDescription>
              {dimensionField
                ? 'No hay más columnas disponibles para KPIs. Cambia el campo de dimensión si necesitas usar otra columna.'
                : 'Primero selecciona un campo de dimensión.'}
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

const formatLabels: Record<KPIMappingField['format'], string> = {
  number: 'Número',
  currency: 'Moneda',
  percentage: 'Porcentaje',
};
