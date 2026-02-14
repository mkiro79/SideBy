/**
 * GeneralInfoFields - Sección de información general del formulario
 * 
 * Campos:
 * - meta.name (Input text, requerido)
 * - meta.description (Textarea, opcional)
 * 
 * Este componente usa React Hook Form con Controller para integración.
 * Se implementará completamente en Commit 2 de Phase 6.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Control, FieldErrors } from "react-hook-form";
import type { DatasetEditFormData } from "../../schemas/datasetEdit.schema.js";

// ============================================================================
// PROPS
// ============================================================================

interface GeneralInfoFieldsProps {
  control: Control<DatasetEditFormData>;
  errors: FieldErrors<DatasetEditFormData>;
}

// ============================================================================
// COMPONENT
// ============================================================================

// Variables prefixed with _ to indicate unused (placeholder component)
export const GeneralInfoFields = ({ control: _control, errors: _errors }: GeneralInfoFieldsProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Información General</h3>
      <p className="text-sm text-muted-foreground">
        🚧 Componente en construcción - Commit 2
      </p>
      {/* TODO: Implementar campos de formulario */}
      {/* - Input para meta.name */}
      {/* - Textarea para meta.description */}
    </div>
  );
};
