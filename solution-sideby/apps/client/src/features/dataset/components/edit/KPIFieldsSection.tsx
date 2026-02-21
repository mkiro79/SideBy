/**
 * KPIFieldsSection - Sección de configuración de campos KPI y dimensiones
 *
 * Campos:
 * - schemaMapping.dimensionField (solo lectura, no editable)
 * - schemaMapping.dateField (Select filtrado por patrón fecha, opcional)
 * - schemaMapping.kpiFields (Tabla editable con labels y formatos)
 * - schemaMapping.categoricalFields (chips toggle para añadir/quitar)
 *
 * La dimensión NO es editable en el update porque está ligada a la estructura
 * de los archivos originales cargados en el paso 1 del wizard.
 * El campo de fecha sigue las mismas reglas que el paso 2 del wizard:
 * solo muestra columnas cuyo nombre coincide con el patrón de fecha.
 */

import { Controller, useFieldArray, useWatch } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { DatasetEditFormData } from "../../schemas/datasetEdit.schema.js";
import { Input } from "@/shared/components/ui/Input.js";
import { Badge } from "@/shared/components/ui/badge.js";
import { Button } from "@/shared/components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table.js";
import { Plus, X } from "lucide-react";

// ============================================================================
// HELPERS
// ============================================================================

/** Patrón de detección de columnas de fecha (igual que wizard paso 2) */
const DATE_COLUMN_PATTERN = /fecha|date|time|periodo|year|mes|month/i;

// ============================================================================
// PROPS
// ============================================================================

interface KPIFieldsSectionProps {
  control: Control<DatasetEditFormData>;
  errors: FieldErrors<DatasetEditFormData>;
  /** Columnas disponibles del dataset */
  availableColumns: string[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export const KPIFieldsSection = ({
  control,
  errors,
  availableColumns,
}: KPIFieldsSectionProps) => {
  // useFieldArray para manejar el array de kpiFields
  const { fields } = useFieldArray({
    control,
    name: "schemaMapping.kpiFields",
  });

  // Leer valores actuales para filtrar columnas disponibles
  const dimensionField = useWatch({ control, name: "schemaMapping.dimensionField" });
  const currentKpiColumns = useWatch({ control, name: "schemaMapping.kpiFields" }) ?? [];
  const categoricalFields = useWatch({ control, name: "schemaMapping.categoricalFields" }) ?? [];

  // Columnas que coinciden con patrón de fecha (misma lógica que wizard step 2)
  const dateColumns = availableColumns.filter((col) => DATE_COLUMN_PATTERN.test(col));

  // Columnas candidatas para categorical: no son dimensión, no son KPI, no son fecha detectada
  const kpiColumnNames = currentKpiColumns.map((k) => k.columnName);
  const categoricalCandidates = availableColumns.filter(
    (col) =>
      col !== dimensionField &&
      !kpiColumnNames.includes(col) &&
      !DATE_COLUMN_PATTERN.test(col),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campos KPI y Dimensiones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ================================================================
            DIMENSIÓN - Solo lectura (no se puede cambiar sin resubir archivos)
        ================================================================ */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Campo de Dimensión
          </label>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 min-h-10">
            <span className="font-mono text-sm text-foreground">
              {dimensionField || <span className="text-muted-foreground italic">No definido</span>}
            </span>
            <Badge variant="secondary" className="ml-auto text-xs shrink-0">
              Solo lectura
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            La dimensión se define al cargar los archivos y no puede modificarse desde aquí
          </p>
        </div>

        {/* ================================================================
            CAMPO DE FECHA - Solo columnas que coincidan con patrón fecha
        ================================================================ */}
        {dateColumns.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="date-field" className="text-sm font-medium">
              Campo de Fecha{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Controller
              name="schemaMapping.dateField"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value: string) => {
                    field.onChange(value === "none" ? "" : value);
                  }}
                  value={field.value || "none"}
                >
                  <SelectTrigger id="date-field">
                    <SelectValue placeholder="Selecciona columna de fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {dateColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.schemaMapping?.dateField && (
              <p className="text-sm text-destructive">
                {errors.schemaMapping.dateField.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Columna temporal para análisis de tendencias
            </p>
          </div>
        )}

        {/* ================================================================
            KPI FIELDS - Tabla editable (label + formato)
        ================================================================ */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Campos KPI <span className="text-destructive">*</span>
          </label>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Columna Original</TableHead>
                  <TableHead className="w-[40%]">Label Personalizado</TableHead>
                  <TableHead className="w-[30%]">Formato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No hay campos KPI configurados
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field, index) => (
                    <TableRow key={field.id}>
                      {/* Original Name (read-only) */}
                      <TableCell className="font-mono text-sm">
                        {field.columnName}
                      </TableCell>

                      {/* Label (editable) */}
                      <TableCell>
                        <Controller
                          name={`schemaMapping.kpiFields.${index}.label`}
                          control={control}
                          render={({ field: labelField }) => (
                            <Input
                              placeholder="Ej: Ingresos Totales"
                              {...labelField}
                              aria-invalid={
                                !!errors.schemaMapping?.kpiFields?.[index]?.label
                              }
                            />
                          )}
                        />
                        {errors.schemaMapping?.kpiFields?.[index]?.label && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.schemaMapping.kpiFields[index]?.label?.message}
                          </p>
                        )}
                      </TableCell>

                      {/* Format (editable) */}
                      <TableCell>
                        <Controller
                          name={`schemaMapping.kpiFields.${index}.format`}
                          control={control}
                          render={({ field: formatField }) => (
                            <Select
                              onValueChange={formatField.onChange}
                              value={formatField.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Formato" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="currency">Moneda</SelectItem>
                                <SelectItem value="percentage">Porcentaje</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.schemaMapping?.kpiFields?.[index]?.format && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.schemaMapping.kpiFields[index]?.format?.message}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {errors.schemaMapping?.kpiFields &&
            typeof errors.schemaMapping.kpiFields === "object" &&
            "message" in errors.schemaMapping.kpiFields && (
              <p className="text-sm text-destructive">
                {errors.schemaMapping.kpiFields.message as string}
              </p>
            )}
          <p className="text-xs text-muted-foreground">
            Personaliza los nombres y formatos de visualización para cada KPI
          </p>
        </div>

        {/* ================================================================
            CAMPOS CATEGÓRICOS - Chips toggle para añadir/quitar
        ================================================================ */}
        {categoricalCandidates.length > 0 && (
          <Controller
            name="schemaMapping.categoricalFields"
            control={control}
            render={({ field }) => {
              const selected: string[] = field.value ?? [];

              const toggle = (col: string) => {
                const next = selected.includes(col)
                  ? selected.filter((c) => c !== col)
                  : [...selected, col];
                field.onChange(next);
              };

              return (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Campos Categóricos{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categoricalCandidates.map((col) => {
                      const isActive = selected.includes(col);
                      return (
                        <Button
                          key={col}
                          type="button"
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => toggle(col)}
                        >
                          {isActive ? (
                            <X className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          {col}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Columnas de texto usadas para filtrar y segmentar los datos
                  </p>
                </div>
              );
            }}
          />
        )}

        {/* Categóricos activos cuando no hay candidatos disponibles */}
        {categoricalCandidates.length === 0 && (categoricalFields as string[]).length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Campos Categóricos activos</label>
            <div className="flex flex-wrap gap-1">
              {(categoricalFields as string[]).map((col) => (
                <Badge key={col} variant="secondary" className="text-xs">
                  {col}
                </Badge>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};
