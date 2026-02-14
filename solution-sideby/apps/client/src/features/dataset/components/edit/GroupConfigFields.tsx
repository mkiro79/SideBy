/**
 * GroupConfigFields - Sección de configuración de grupos comparativos
 * 
 * Campos:
 * - sourceConfig.groupA.label (Input text, requerido)
 * - sourceConfig.groupA.color (Color picker, requerido)
 * - sourceConfig.groupB.label (Input text, requerido)
 * - sourceConfig.groupB.color (Color picker, requerido)
 * 
 * IMPORTANTE: Los campos estarán DISABLED por defecto hasta que el backend
 * soporte PATCH de sourceConfig. Se muestra un tooltip explicativo.
 * 
 * Ver: docs/ROADMAP.md → RFC-004 → Backend: Soportar edición de sourceConfig
 * 
 * Este componente se implementará completamente en Commit 2 de Phase 6.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Control, FieldErrors } from "react-hook-form";
import type { DatasetEditFormData } from "../../schemas/datasetEdit.schema.js";

// ============================================================================
// PROPS
// ============================================================================

interface GroupConfigFieldsProps {
  control: Control<DatasetEditFormData>;
  errors: FieldErrors<DatasetEditFormData>;
  /** Si true, los campos están deshabilitados (backend no soporta edición aún) */
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

// Variables prefixed with _ to indicate unused (placeholder component)
export const GroupConfigFields = ({
  control: _control,
  errors: _errors,
  disabled = true, // Por defecto disabled hasta que backend soporte
}: GroupConfigFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Configuración de Grupos</h3>
        {disabled && (
          <span className="text-xs text-muted-foreground italic">
            (Solo lectura - Edición próximamente)
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        🚧 Componente en construcción - Commit 2
      </p>
      {/* TODO: Implementar campos de formulario */}
      {/* - Grupo A: Label + Color Picker */}
      {/* - Grupo B: Label + Color Picker */}
      {/* - Tooltip: "Los labels y colores se configuran en el upload. Próximamente editables." */}
    </div>
  );
};
