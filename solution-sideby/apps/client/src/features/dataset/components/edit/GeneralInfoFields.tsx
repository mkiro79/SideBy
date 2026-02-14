/**
 * GeneralInfoFields - Sección de información general del formulario
 * 
 * Campos:
 * - meta.name (Input text, requerido)
 * - meta.description (Textarea, opcional)
 * 
 * Este componente usa React Hook Form con Controller para integración.
 */

import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { DatasetEditFormData } from "../../schemas/datasetEdit.schema.js";
import { Input } from "@/shared/components/ui/Input.js";
import { Textarea } from "@/shared/components/ui/textarea.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card.js";

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

export const GeneralInfoFields = ({ control, errors }: GeneralInfoFieldsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información General</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nombre del dataset */}
        <div className="space-y-2">
          <label htmlFor="meta-name" className="text-sm font-medium">
            Nombre <span className="text-destructive">*</span>
          </label>
          <Controller
            name="meta.name"
            control={control}
            render={({ field }) => (
              <Input
                id="meta-name"
                placeholder="Ej: Comparación Performance 2023 vs 2024"
                {...field}
                aria-invalid={!!errors.meta?.name}
              />
            )}
          />
          {errors.meta?.name && (
            <p className="text-sm text-destructive">
              {errors.meta.name.message}
            </p>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <label htmlFor="meta-description" className="text-sm font-medium">
            Descripción <span className="text-muted-foreground">(opcional)</span>
          </label>
          <Controller
            name="meta.description"
            control={control}
            render={({ field }) => (
              <Textarea
                id="meta-description"
                placeholder="Describe brevemente el propósito de este dataset..."
                rows={3}
                {...field}
                value={field.value || ""}
                aria-invalid={!!errors.meta?.description}
              />
            )}
          />
          {errors.meta?.description && (
            <p className="text-sm text-destructive">
              {errors.meta.description.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
