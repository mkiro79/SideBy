/**
 * ColumnMappingStep - RFC-003-A Simplified Auto-Mapping UI
 * 
 * Componente simplificado para mapeo de columnas con auto-detección.
 * 
 * Estructura:
 * 1. Dropdown para seleccionar columna de fecha
 * 2. Checkboxes para métricas (máximo 4)
 * 3. Checkboxes para dimensiones (sin límite)
 * 
 * NO permite:
 * - Renombrar KPIs
 * - Cambiar tipos de columna
 * - Agregar agregaciones
 */

import { useEffect, useState, useMemo } from "react";
import { Calendar, TrendingUp, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select.js";
import { Label } from "@/shared/components/ui/Label.js";
import { Card } from "@/shared/components/ui/card.js";
import { Alert, AlertDescription } from "@/shared/components/ui/alert.js";
import { Checkbox } from "@/shared/components/ui/checkbox.js";
import { FilePreview } from "../FilePreview.js";
import { autoClassifyColumns } from "../../utils/autoClassify.js";
import { inferKPIFormat } from "../../utils/inferKPIFormat.js";
import { useWizardState } from "../../hooks/useWizardState.js";
import type { WizardState, ColumnMapping } from "../../types/wizard.types.js";

export interface ColumnMappingStepProps {
  readonly state?: WizardState;
  readonly setMapping?: (mapping: ColumnMapping) => void;
}

interface ClassifiedColumns {
  dateColumns: string[];
  numericColumns: string[];
  stringColumns: string[];
}

const MAX_METRICS = 4;

export function ColumnMappingStep({
  state,
  setMapping: setMappingProp,
}: ColumnMappingStepProps) {
  // Soporte para ambos modos: legacy (sin props) usando hook, o nuevo (con props)
  const hookState = useWizardState();
  
  // Usar props si están disponibles, sino el hook legacy
  const wizardState = state || hookState;
  const setMappingFn = setMappingProp || hookState.setMapping;
  
  // Estado local para las selecciones
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(
    new Set()
  );
  const [selectedDimensions, setSelectedDimensions] = useState<Set<string>>(
    new Set()
  );

  // Obtener datos - soportar ambos formatos (RFC-003-A uploadedFiles[] O legacy fileA)
  const uploadedFile = wizardState.uploadedFiles?.[0];
  const legacyFile = wizardState.fileA;

  // Extraer headers y rows del formato disponible (memoizados para estabilidad)
  const headers = useMemo(() => {
    return uploadedFile 
      ? uploadedFile.preview?.headers || []
      : legacyFile?.parsedData?.headers || [];
  }, [uploadedFile, legacyFile]);
  
  // Convertir rows de Record<string, unknown>[] a string[][]
  const rows: string[][] = useMemo(() => {
    if (uploadedFile) {
      return uploadedFile.preview?.rows || [];
    } 
    if (legacyFile?.parsedData) {
      return legacyFile.parsedData.rows.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string') return value;
          if (typeof value === 'number') return value.toString();
          if (typeof value === 'boolean') return value.toString();
          // Objetos/arrays: stringify
          return JSON.stringify(value);
        })
      );
    }
    return [];
  }, [uploadedFile, legacyFile, headers]);

  // Auto-clasificar columnas al montar
  const classifiedColumns: ClassifiedColumns = useMemo(() => {
    if (headers.length === 0 || rows.length === 0) {
      return { dateColumns: [], numericColumns: [], stringColumns: [] };
    }

    // Transformar rows de string[][] a Record<string, unknown>[]
    const transformedRows = rows.map((row) => {
      const rowObject: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        rowObject[header] = row[index];
      });
      return rowObject;
    });

    return autoClassifyColumns(headers, transformedRows);
  }, [headers, rows]);

  // Inicializar selección de fecha con la primera columna de fecha detectada
  useEffect(() => {
    if (classifiedColumns.dateColumns.length > 0 && selectedDate === null) {
      // Inicialización en el siguiente tick para evitar setState síncrono
      Promise.resolve().then(() => {
        setSelectedDate(classifiedColumns.dateColumns[0]);
      });
    }
  }, [classifiedColumns.dateColumns, selectedDate]);

  // Handler para cambio de fecha
  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    
    // Actualizar mapping
    updateMapping(value, selectedMetrics, selectedDimensions);
  };

  // Handler para toggle de métrica
  const handleMetricToggle = (column: string, checked: boolean) => {
    const newMetrics = new Set(selectedMetrics);
    
    if (checked) {
      if (newMetrics.size < MAX_METRICS) {
        newMetrics.add(column);
      }
    } else {
      newMetrics.delete(column);
    }
    
    setSelectedMetrics(newMetrics);
    updateMapping(selectedDate, newMetrics, selectedDimensions);
  };

  // Handler para toggle de dimensión
  const handleDimensionToggle = (column: string, checked: boolean) => {
    const newDimensions = new Set(selectedDimensions);
    
    if (checked) {
      newDimensions.add(column);
    } else {
      newDimensions.delete(column);
    }
    
    setSelectedDimensions(newDimensions);
    updateMapping(selectedDate, selectedMetrics, newDimensions);
  };

  // Actualizar el mapping global
  const updateMapping = (
    date: string | null,
    metrics: Set<string>,
    dimensions: Set<string>
  ) => {
    const newMapping: ColumnMapping = {
      dimensionField: null,
      dateField: null,
      kpiFields: [],
    };

    // Agregar fecha
    if (date) {
      newMapping.dateField = date;
    }

    // Agregar métricas como kpiFields con formato inferido
    newMapping.kpiFields = Array.from(metrics).map((metric) => ({
      id: metric,
      columnName: metric,
      label: metric,
      format: inferKPIFormat(metric),
    }));

    // Agregar primera dimensión como dimensionField (requerido para canProceedToStep3)
    const dimensionsArray = Array.from(dimensions);
    if (dimensionsArray.length > 0) {
      newMapping.dimensionField = dimensionsArray[0];
    }

    setMappingFn(newMapping);
  };

  // Renderizar secciones solo si hay datos
  if (headers.length === 0 || rows.length === 0) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            No hay datos disponibles para mapear. Por favor, carga un archivo primero.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Mapeo de Columnas</h2>
        <p className="text-muted-foreground">
          Selecciona la columna de fecha, las métricas a analizar y las
          dimensiones para segmentar.
        </p>
      </div>

      {/* Vista Previa de Archivos (Side-by-Side) */}
      {(wizardState.fileA || wizardState.fileB) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wizardState.fileA?.parsedData && wizardState.fileA.file && (
            <FilePreview
              fileName={wizardState.fileA.file.name}
              label="Archivo A"
              variant="primary"
              headers={wizardState.fileA.parsedData.headers}
              rows={wizardState.fileA.parsedData.rows.slice(0, 3)}
              totalRows={wizardState.fileA.parsedData.rowCount}
              fileSize={`${(wizardState.fileA.file.size / 1024).toFixed(1)} KB`}
            />
          )}
          
          {wizardState.fileB?.parsedData && wizardState.fileB.file && (
            <FilePreview
              fileName={wizardState.fileB.file.name}
              label="Archivo B"
              variant="comparative"
              headers={wizardState.fileB.parsedData.headers}
              rows={wizardState.fileB.parsedData.rows.slice(0, 3)}
              totalRows={wizardState.fileB.parsedData.rowCount}
              fileSize={`${(wizardState.fileB.file.size / 1024).toFixed(1)} KB`}
            />
          )}
        </div>
      )}

      {/* Sección 1: Selección de Fecha */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Columna de Fecha</h3>
        </div>

        {classifiedColumns.dateColumns.length === 0 ? (
          <Alert variant="destructive">
            <AlertDescription>
              No se detectó ninguna columna de fecha automáticamente.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="date-select">Selecciona la columna de fecha</Label>
            <Select value={selectedDate || ""} onValueChange={handleDateChange}>
              <SelectTrigger id="date-select">
                <SelectValue placeholder="Selecciona una columna de fecha" />
              </SelectTrigger>
              <SelectContent>
                {classifiedColumns.dateColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Mensaje informativo cuando no hay fecha seleccionada */}
        {selectedDate === null && (
          <Alert>
            <AlertDescription>
              Sin fecha = no habrá gráfico de evolución temporal
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Sección 2: Selección de Métricas */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Métricas</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Selecciona hasta {MAX_METRICS} métricas para analizar (máximo{" "}
          {MAX_METRICS} métricas)
        </p>

        {classifiedColumns.numericColumns.length === 0 ? (
          <Alert>
            <AlertDescription>
              No se detectaron métricas numéricas en tus datos.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {classifiedColumns.numericColumns.map((col) => {
              const isChecked = selectedMetrics.has(col);
              const isDisabled =
                !isChecked && selectedMetrics.size >= MAX_METRICS;

              return (
                <div key={col} className="flex items-center space-x-2">
                  <Checkbox
                    id={`metric-${col}`}
                    checked={isChecked}
                    disabled={isDisabled}
                    onCheckedChange={(checked: boolean) =>
                      handleMetricToggle(col, checked)
                    }
                    aria-label={col}
                  />
                  <Label
                    htmlFor={`metric-${col}`}
                    className={isDisabled ? "text-muted-foreground" : ""}
                  >
                    {col}
                  </Label>
                </div>
              );
            })}
          </div>
        )}

        {selectedMetrics.size > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedMetrics.size} de {MAX_METRICS} métricas seleccionadas
          </p>
        )}
      </Card>

      {/* Sección 3: Selección de Dimensiones */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Dimensiones</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Selecciona las dimensiones para segmentar tus datos (opcional)
        </p>

        {classifiedColumns.stringColumns.length === 0 ? (
          <Alert>
            <AlertDescription>
              No se detectaron dimensiones categóricas en tus datos.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {classifiedColumns.stringColumns.map((col) => {
              const isChecked = selectedDimensions.has(col);

              return (
                <div key={col} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dimension-${col}`}
                    checked={isChecked}
                    onCheckedChange={(checked: boolean) =>
                      handleDimensionToggle(col, checked)
                    }
                    aria-label={col}
                  />
                  <Label htmlFor={`dimension-${col}`}>{col}</Label>
                </div>
              );
            })}
          </div>
        )}

        {selectedDimensions.size > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedDimensions.size} dimensión(es) seleccionada(s)
          </p>
        )}
      </Card>
    </div>
  );
}
