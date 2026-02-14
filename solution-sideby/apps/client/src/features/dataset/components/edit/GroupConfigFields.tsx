/**
 * GroupConfigFields - Sección de configuración de grupos comparativos
 * 
 * Campos:
 * - sourceConfig.groupA.label (Input text, requerido)
 * - sourceConfig.groupA.color (Color picker, requerido)
 * - sourceConfig.groupB.label (Input text, requerido)
 * - sourceConfig.groupB.color (Color picker, requerido)
 * 
 * IMPORTANTE: Los campos están DISABLED por defecto hasta que el backend
 * soporte PATCH de sourceConfig. Se muestra un Alert explicativo.
 * 
 * Ver: docs/ROADMAP.md → RFC-004 → Backend: Soportar edición de sourceConfig
 */

import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { DatasetEditFormData } from "../../schemas/datasetEdit.schema.js";
import { Input } from "@/shared/components/ui/Input.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card.js";
import { Alert, AlertDescription } from "@/shared/components/ui/alert.js";
import { InfoIcon } from "lucide-react";

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

export const GroupConfigFields = ({
  control,
  errors,
  disabled = true, // Por defecto disabled hasta que backend soporte
}: GroupConfigFieldsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Grupos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert informativo si disabled */}
        {disabled && (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Los labels y colores de grupos se configuran durante el upload inicial.
              La edición estará disponible próximamente cuando el backend lo soporte.
            </AlertDescription>
          </Alert>
        )}

        {/* Grupo A */}
        <div className="space-y-4 rounded-lg border p-4">
          <h4 className="font-medium text-sm">Grupo A</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Label Grupo A */}
            <div className="space-y-2">
              <label htmlFor="groupA-label" className="text-sm font-medium">
                Label
              </label>
              <Controller
                name="sourceConfig.groupA.label"
                control={control}
                render={({ field }) => (
                  <Input
                    id="groupA-label"
                    placeholder="Ej: 2024"
                    disabled={disabled}
                    {...field}
                    value={field.value || ""}
                    aria-invalid={!!errors.sourceConfig?.groupA?.label}
                  />
                )}
              />
              {errors.sourceConfig?.groupA?.label && (
                <p className="text-sm text-destructive">
                  {errors.sourceConfig.groupA.label.message}
                </p>
              )}
            </div>

            {/* Color Grupo A */}
            <div className="space-y-2">
              <label htmlFor="groupA-color" className="text-sm font-medium">
                Color
              </label>
              <Controller
                name="sourceConfig.groupA.color"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="groupA-color"
                      disabled={disabled}
                      {...field}
                      value={field.value || "#3B82F6"}
                      className="h-10 w-20 rounded-md border border-input disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Input
                      placeholder="#3B82F6"
                      disabled={disabled}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                )}
              />
              {errors.sourceConfig?.groupA?.color && (
                <p className="text-sm text-destructive">
                  {errors.sourceConfig.groupA.color.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Grupo B */}
        <div className="space-y-4 rounded-lg border p-4">
          <h4 className="font-medium text-sm">Grupo B</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Label Grupo B */}
            <div className="space-y-2">
              <label htmlFor="groupB-label" className="text-sm font-medium">
                Label
              </label>
              <Controller
                name="sourceConfig.groupB.label"
                control={control}
                render={({ field }) => (
                  <Input
                    id="groupB-label"
                    placeholder="Ej: 2023"
                    disabled={disabled}
                    {...field}
                    value={field.value || ""}
                    aria-invalid={!!errors.sourceConfig?.groupB?.label}
                  />
                )}
              />
              {errors.sourceConfig?.groupB?.label && (
                <p className="text-sm text-destructive">
                  {errors.sourceConfig.groupB.label.message}
                </p>
              )}
            </div>

            {/* Color Grupo B */}
            <div className="space-y-2">
              <label htmlFor="groupB-color" className="text-sm font-medium">
                Color
              </label>
              <Controller
                name="sourceConfig.groupB.color"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="groupB-color"
                      disabled={disabled}
                      {...field}
                      value={field.value || "#F97316"}
                      className="h-10 w-20 rounded-md border border-input disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Input
                      placeholder="#F97316"
                      disabled={disabled}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                )}
              />
              {errors.sourceConfig?.groupB?.color && (
                <p className="text-sm text-destructive">
                  {errors.sourceConfig.groupB.color.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
