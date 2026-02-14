/**
 * KPIFieldsSection - Sección de configuración de campos KPI
 * 
 * Campos:
 * - schemaMapping.dimensionField (Select, requerido)
 * - schemaMapping.dateField (Select, opcional)
 * - schemaMapping.kpiFields (Tabla editable)
 *   - Columnas: Original Name (read-only), Label (editable), Format (editable)
 * - schemaMapping.categoricalFields (Multi-select, opcional)
 * 
 * Este componente usa useFieldArray de react-hook-form para manejar
 * el array dinámico de kpiFields.
 * 
 * Se implementará completamente enCommit 2 de Phase 6.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Control, FieldErrors } from "react-hook-form";
import type { DatasetEditFormData } from "../../schemas/datasetEdit.schema.js";

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

// Variables prefixed with _ to indicate unused (placeholder component)
export const KPIFieldsSection = ({
  control: _control,
  errors: _errors,
  availableColumns: _availableColumns,
}: KPIFieldsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Campos KPI y Dimensiones</h3>
      <p className="text-sm text-muted-foreground">
        🚧 Componente en construcción - Commit 2
      </p>
      {/* TODO: Implementar campos de formulario */}
      {/* - Select para dimensionField */}
      {/* - Select para dateField (opcional) */}
      {/* - Tabla con useFieldArray para kpiFields */}
      {/*   - Columnas: Original Name | Label (Input) | Format (Select) */}
      {/* - Multi-select para categoricalFields (futuro) */}
    </div>
  );
};
