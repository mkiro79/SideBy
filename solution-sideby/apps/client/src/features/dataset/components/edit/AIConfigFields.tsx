/**
 * AIConfigFields - Sección de configuración de IA
 * 
 * Campos:
 * - aiConfig.enabled (Checkbox/Switch, boolean)
 * - aiConfig.userContext (Textarea, opcional, max 1000 chars)
 * 
 * El campo userContext solo se muestra si enabled = true.
 */

import { Controller, useController } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { DatasetEditFormData } from "../../schemas/datasetEdit.schema.js";
import { Textarea } from "@/shared/components/ui/textarea.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card.js";
import { Checkbox } from "@/shared/components/ui/checkbox.js";

// ============================================================================
// PROPS
// ============================================================================

interface AIConfigFieldsProps {
  control: Control<DatasetEditFormData>;
  errors: FieldErrors<DatasetEditFormData>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AIConfigFields = ({
  control,
  errors,
}: AIConfigFieldsProps) => {
  const { field: enabledField } = useController({
    name: "aiConfig.enabled",
    control,
  });
  const aiEnabled = !!enabledField.value;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de IA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checkbox para habilitar IA */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="ai-enabled"
            checked={!!enabledField.value}
            onCheckedChange={enabledField.onChange}
          />
          <div className="space-y-1 flex-1">
            <label
              htmlFor="ai-enabled"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Habilitar análisis con IA
            </label>
            <p className="text-sm text-muted-foreground">
              Activa el análisis inteligente de datos y generación de insights automáticos
            </p>
          </div>
        </div>

        {/* Textarea para contexto (solo si AI enabled) */}
        {aiEnabled && (
          <div className="space-y-2">
            <label htmlFor="ai-context" className="text-sm font-medium">
              Contexto adicional <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Controller
              name="aiConfig.userContext"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="ai-context"
                  placeholder="Ej: Este dataset compara el rendimiento de ventas por región. Enfócate en identificar las regiones con mayor variación..."
                  rows={4}
                  {...field}
                  value={field.value || ""}
                  aria-invalid={!!errors.aiConfig?.userContext}
                />
              )}
            />
            {errors.aiConfig?.userContext && (
              <p className="text-sm text-destructive">
                {errors.aiConfig.userContext.message}
              </p>
            )}
            <Controller
              name="aiConfig.userContext"
              control={control}
              render={({ field: contextField }) => (
                <p className="text-xs text-muted-foreground">
                  {(contextField.value?.length || 0)} / 1000 caracteres
                </p>
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
