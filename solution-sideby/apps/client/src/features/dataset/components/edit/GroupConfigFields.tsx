/**
 * GroupConfigFields - Configuración editable de grupos comparativos
 *
 * Campos:
 * - sourceConfig.groupA.label (Input text, max 50 chars, contador)
 * - sourceConfig.groupA.color (Color picker nativo + hex input sincronizados)
 * - sourceConfig.groupB.label (Input text, max 50 chars, contador)
 * - sourceConfig.groupB.color (Color picker nativo + hex input sincronizados)
 */

import { Controller, useWatch } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { DatasetEditFormData } from "../../schemas/datasetEdit.schema.js";
import { Input } from "@/shared/components/ui/Input.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card.js";

// ============================================================================
// PROPS
// ============================================================================

interface GroupConfigFieldsProps {
  control: Control<DatasetEditFormData>;
  errors: FieldErrors<DatasetEditFormData>;
}

// ============================================================================
// SUBCOMPONENT - Bloque de configuración de un grupo
// ============================================================================

interface GroupBlockProps {
  groupKey: "groupA" | "groupB";
  title: string;
  labelPlaceholder: string;
  defaultColor: string;
  accentColor: string;
  control: Control<DatasetEditFormData>;
  errors: FieldErrors<DatasetEditFormData>;
}

const GroupBlock = ({
  groupKey,
  title,
  labelPlaceholder,
  defaultColor,
  accentColor,
  control,
  errors,
}: GroupBlockProps) => {
  const labelValue = useWatch({
    control,
    name: `sourceConfig.${groupKey}.label`,
    defaultValue: "",
  });

  const groupErrors = errors.sourceConfig?.[groupKey];

  return (
    <div className="space-y-4">
      {/* Título del grupo con color de acento */}
      <h3 className="font-semibold text-base" style={{ color: accentColor }}>
        {title}
      </h3>

      {/* Etiqueta */}
      <div className="space-y-1.5">
        <label
          htmlFor={`${groupKey}-label`}
          className="text-sm font-medium"
        >
          Etiqueta {title}
        </label>
        <Controller
          name={`sourceConfig.${groupKey}.label`}
          control={control}
          render={({ field }) => (
            <Input
              id={`${groupKey}-label`}
              placeholder={labelPlaceholder}
              maxLength={50}
              aria-invalid={!!groupErrors?.label}
              {...field}
              value={field.value || ""}
            />
          )}
        />
        {/* Contador de caracteres */}
        <p className="text-xs text-muted-foreground text-right">
          {(labelValue || "").length}/50 caracteres
        </p>
        {groupErrors?.label && (
          <p className="text-sm text-destructive">
            {groupErrors.label.message}
          </p>
        )}
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <label
          htmlFor={`${groupKey}-color`}
          className="text-sm font-medium"
        >
          Color {title}
        </label>
        <Controller
          name={`sourceConfig.${groupKey}.color`}
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              {/* Swatch nativo sincronizado */}
              <input
                type="color"
                id={`${groupKey}-color`}
                value={field.value || defaultColor}
                onChange={(e) => field.onChange(e.target.value)}
                className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-input p-1"
                aria-label={`Color del ${title}`}
              />
              {/* Hex manual */}
              <Input
                placeholder={defaultColor}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                className="flex-1 font-mono text-sm"
                aria-label={`Valor hexadecimal del ${title}`}
              />
            </div>
          )}
        />
        {groupErrors?.color && (
          <p className="text-sm text-destructive">
            {groupErrors.color.message}
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT
// ============================================================================

export const GroupConfigFields = ({
  control,
  errors,
}: GroupConfigFieldsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de grupos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Personaliza etiquetas y colores para los grupos A y B.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GroupBlock
            groupKey="groupA"
            title="Grupo A"
            labelPlaceholder="Ej: 2024"
            defaultColor="#3b82f6"
            accentColor="#3b82f6"
            control={control}
            errors={errors}
          />
          <GroupBlock
            groupKey="groupB"
            title="Grupo B"
            labelPlaceholder="Ej: 2023"
            defaultColor="#f97415"
            accentColor="#f97415"
            control={control}
            errors={errors}
          />
        </div>
      </CardContent>
    </Card>
  );
};
