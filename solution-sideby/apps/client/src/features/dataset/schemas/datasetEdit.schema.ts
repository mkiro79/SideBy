/**
 * Schema de validación para edición de datasets
 *
 * Define las reglas de validación con Zod para el formulario de edición.
 * El schema debe coincidir con el backend UpdateMappingSchema.
 *
 * IMPORTANTE: sourceConfig (grupos) NO es editable actualmente porque
 * el backend no lo soporta en el endpoint PATCH. Los campos de grupos
 * están incluidos para preparación futura.
 *
 * Ver: docs/ROADMAP.md → RFC-004 → Backend: Soportar edición de sourceConfig
 */

import { z } from "zod";

/**
 * Schema de validación para edición de datasets
 *
 * Validaciones:
 * - Nombre requerido, min 3 caracteres, max 100
 * - Descripción opcional, max 500 caracteres
 * - Labels de grupos requeridos, max 50 caracteres
 * - Colores en formato hexadecimal (#RRGGBB)
 * - Dimension field requerido (columna para agrupar)
 * - Date field opcional
 * - KPI fields: array con al menos 1 KPI
 * - Dashboard: templateId y highlightedKpis
 * - AI context max 1000 caracteres
 */
export const datasetEditSchema = z.object({
  // ============================================================================
  // GENERAL INFO
  // ============================================================================
  meta: z.object({
    name: z
      .string()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(100, "El nombre no puede exceder 100 caracteres"),

    description: z
      .string()
      .max(500, "La descripción no puede exceder 500 caracteres")
      .optional()
      .or(z.literal("")),
  }),

  // ============================================================================
  // GROUP CONFIGURATION (Preparación futura - actualmente NO editable)
  // ============================================================================
  // Nota: Se activará cuando el backend soporte PATCH de sourceConfig
  // Ver: docs/ROADMAP.md → RFC-004 → Backend: Soportar edición de sourceConfig
  sourceConfig: z
    .object({
      groupA: z.object({
        label: z
          .string()
          .min(1, "El label del Grupo A es requerido")
          .max(50, "El label no puede exceder 50 caracteres"),

        color: z
          .string()
          .regex(
            /^#[0-9A-Fa-f]{6}$/,
            "Color debe ser formato hexadecimal (#RRGGBB)",
          ),
      }),

      groupB: z.object({
        label: z
          .string()
          .min(1, "El label del Grupo B es requerido")
          .max(50, "El label no puede exceder 50 caracteres"),

        color: z
          .string()
          .regex(
            /^#[0-9A-Fa-f]{6}$/,
            "Color debe ser formato hexadecimal (#RRGGBB)",
          ),
      }),
    })
    .optional(), // Opcional porque backend no lo acepta aún

  // ============================================================================
  // SCHEMA MAPPING (KPI Fields + Dimension + Date)
  // ============================================================================
  schemaMapping: z.object({
    dimensionField: z
      .string()
      .min(1, "Debes seleccionar una columna de dimensión"),

    dateField: z.string().optional().or(z.literal("")),

    kpiFields: z
      .array(
        z.object({
          id: z.string().min(1),
          columnName: z.string().min(1),
          label: z
            .string()
            .min(1, "El label no puede estar vacío")
            .max(100, "El label no puede exceder 100 caracteres"),
          format: z.enum(["number", "currency", "percentage"]),
        }),
      )
      .min(1, "Debes seleccionar al menos 1 KPI"),

    categoricalFields: z.array(z.string()).optional(),
  }),

  // ============================================================================
  // DASHBOARD LAYOUT
  // ============================================================================
  dashboardLayout: z.object({
    templateId: z.literal("sideby_executive"),

    highlightedKpis: z
      .array(z.string())
      .max(4, "Máximo 4 KPIs destacados permitidos"),
  }),

  // ============================================================================
  // AI CONFIGURATION
  // ============================================================================
  aiConfig: z
    .object({
      enabled: z.boolean(),

      userContext: z
        .string()
        .max(1000, "El contexto no puede exceder 1000 caracteres")
        .optional()
        .or(z.literal("")),
    })
    .optional(),
});

/**
 * Tipo TypeScript inferido del schema
 * Usar este tipo para React Hook Form y payloads
 */
export type DatasetEditFormData = z.infer<typeof datasetEditSchema>;

/**
 * Schema parcial para validaciones específicas
 * Útil para validar solo una sección del formulario
 */
export const generalInfoSchema = datasetEditSchema.pick({ meta: true });
export const groupConfigSchema = datasetEditSchema.pick({ sourceConfig: true });
export const kpiFieldsSchema = datasetEditSchema.pick({ schemaMapping: true });
export const aiConfigSchema = datasetEditSchema.pick({ aiConfig: true });

/**
 * Tipos parciales para secciones individuales
 */
export type GeneralInfoFormData = z.infer<typeof generalInfoSchema>;
export type GroupConfigFormData = z.infer<typeof groupConfigSchema>;
export type KPIFieldsFormData = z.infer<typeof kpiFieldsSchema>;
export type AIConfigFormData = z.infer<typeof aiConfigSchema>;
