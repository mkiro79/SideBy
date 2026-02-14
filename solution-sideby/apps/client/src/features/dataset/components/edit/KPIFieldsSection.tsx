/**
 * KPIFieldsSection - Sección de configuración de campos KPI
 * 
 * Campos:
 * - schemaMapping.dimensionField (Select, requerido)
 * - schemaMapping.dateField (Select, opcional)
 * - schemaMapping.kpiFields (Tabla editable con useFieldArray)
 *   - Columnas: Original Name (read-only), Label (editable), Format (editable)
 * 
 * Este componente usa useFieldArray de react-hook-form para manejar
 * el array dinámico de kpiFields.
 */

import { Controller, useFieldArray } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { DatasetEditFormData } from "../../schemas/datasetEdit.schema.js";
import { Input } from "@/shared/components/ui/Input.js";
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

// ============================================================================
// PROPS
// ============================================================================

interface KPIFieldsSectionProps {
  control: Control<DatasetEditFormData>;
  errors: FieldErrors<DatasetEditFormData>;
  /** Columnas disponibles del dataset (para selects de dimension/date) */
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campos KPI y Dimensiones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dimension Field Select */}
        <div className="space-y-2">
          <label htmlFor="dimension-field" className="text-sm font-medium">
            Campo de Dimensión <span className="text-destructive">*</span>
          </label>
          <Controller
            name="schemaMapping.dimensionField"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="dimension-field">
                  <SelectValue placeholder="Selecciona una columna para agrupar" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.schemaMapping?.dimensionField && (
            <p className="text-sm text-destructive">
              {errors.schemaMapping.dimensionField.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Columna principal para agrupar y comparar datos
          </p>
        </div>

        {/* Date Field Select (opcional) */}
        <div className="space-y-2">
          <label htmlFor="date-field" className="text-sm font-medium">
            Campo de Fecha <span className="text-muted-foreground">(opcional)</span>
          </label>
          <Controller
            name="schemaMapping.dateField"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
              >
                <SelectTrigger id="date-field">
                  <SelectValue placeholder="Selecciona una columna de fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno</SelectItem>
                  {availableColumns.map((col) => (
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

        {/* KPI Fields Table */}
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
          {errors.schemaMapping?.kpiFields && typeof errors.schemaMapping.kpiFields === 'object' && 'message' in errors.schemaMapping.kpiFields && (
            <p className="text-sm text-destructive">
              {errors.schemaMapping.kpiFields.message as string}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Personaliza los nombres y formatos de visualización para cada KPI
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
