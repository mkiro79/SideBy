/**
 * AIConfigFields - Sección de configuración de IA
 * 
 * Campos:
 * - aiConfig.enabled (Checkbox/Switch, boolean)
 * - aiConfig.userContext (Textarea, opcional, max 1000 chars)
 * 
 * El campo userContext solo se muestra si enabled = true.
 * 
 * Se implementará completamente en Commit 2 de Phase 6.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Control, FieldErrors } from "react-hook-form";
import type { DatasetEditFormData } from "../../schemas/datasetEdit.schema.js";

// ============================================================================
// PROPS
// ============================================================================

interface AIConfigFieldsProps {
  control: Control<DatasetEditFormData>;
  errors: FieldErrors<DatasetEditFormData>;
  /** Si true, muestra el campo userContext */
  aiEnabled: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

// Variables prefixed with _ to indicate unused (placeholder component)
export const AIConfigFields = ({
  control: _control,
  errors: _errors,
  aiEnabled: _aiEnabled,
}: AIConfigFieldsProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Configuración de IA</h3>
      <p className="text-sm text-muted-foreground">
        🚧 Componente en construcción - Commit 2
      </p>
      {/* TODO: Implementar campos de formulario */}
      {/* - Checkbox/Switch para aiConfig.enabled */}
      {/* - Textarea para aiConfig.userContext (solo si enabled = true) */}
      {/*   - Placeholder: "Contexto adicional para el análisis de IA..." */}
      {/*   - Character counter: 0 / 1000 */}
    </div>
  );
};
