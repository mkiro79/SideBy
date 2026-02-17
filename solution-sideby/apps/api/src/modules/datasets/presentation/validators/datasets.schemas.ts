import { z } from "zod";
import { DatasetRules } from "@/modules/datasets/domain/validation.rules.js";

const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color inválido");

/**
 * Schema de validación para actualizar el mapping de un dataset.
 * Valida la estructura completa de configuración enviada por el frontend.
 */
export const UpdateMappingSchema = z.object({
  meta: z.object({
    name: z
      .string()
      .min(
        DatasetRules.MIN_NAME_LENGTH,
        `El nombre debe tener al menos ${DatasetRules.MIN_NAME_LENGTH} caracteres`,
      )
      .max(
        DatasetRules.MAX_NAME_LENGTH,
        `Máximo ${DatasetRules.MAX_NAME_LENGTH} caracteres`,
      ),
    description: z
      .string()
      .max(
        DatasetRules.MAX_DESCRIPTION_LENGTH,
        `Máximo ${DatasetRules.MAX_DESCRIPTION_LENGTH} caracteres`,
      )
      .optional(),
  }),

  schemaMapping: z.object({
    dimensionField: z.string().min(1, "Debes seleccionar una dimensión"),
    dateField: z.string().optional(),
    kpiFields: z
      .array(
        z.object({
          id: z.string().min(1),
          columnName: z.string().min(1),
          label: z.string().min(1),
          format: z.enum(["number", "currency", "percentage"]),
          highlighted: z.boolean().optional(), // ✅ Campo para marcar KPIs destacados
        }),
      )
      .min(
        DatasetRules.MIN_KPIS,
        `Debes seleccionar al menos ${DatasetRules.MIN_KPIS} KPI`,
      ),
    categoricalFields: z.array(z.string()).optional(),
  }),

  dashboardLayout: z.object({
    templateId: z.literal("sideby_executive"),
    highlightedKpis: z
      .array(z.string())
      .max(
        DatasetRules.MAX_HIGHLIGHTED_KPIS,
        `Máximo ${DatasetRules.MAX_HIGHLIGHTED_KPIS} KPIs destacados`,
      )
      .default([]),
  }),

  aiConfig: z
    .object({
      enabled: z.boolean(),
      userContext: z
        .string()
        .max(
          DatasetRules.MAX_AI_CONTEXT_LENGTH,
          `Máximo ${DatasetRules.MAX_AI_CONTEXT_LENGTH} caracteres`,
        )
        .optional(),
    })
    .optional(),

  sourceConfig: z
    .object({
      groupA: z
        .object({
          label: z
            .string()
            .max(
              DatasetRules.MAX_GROUP_LABEL_LENGTH,
              `Máximo ${DatasetRules.MAX_GROUP_LABEL_LENGTH} caracteres`,
            )
            .optional(),
          color: hexColorSchema.optional(),
        })
        .optional(),
      groupB: z
        .object({
          label: z
            .string()
            .max(
              DatasetRules.MAX_GROUP_LABEL_LENGTH,
              `Máximo ${DatasetRules.MAX_GROUP_LABEL_LENGTH} caracteres`,
            )
            .optional(),
          color: hexColorSchema.optional(),
        })
        .optional(),
    })
    .optional(),
});

/**
 * Tipo inferido del schema de validación.
 */
export type UpdateMappingSchemaType = z.infer<typeof UpdateMappingSchema>;
