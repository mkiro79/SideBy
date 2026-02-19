/**
 * Documentación OpenAPI 3.0 para el módulo de Insights.
 *
 * Este archivo registra los endpoints de generación de insights con IA
 * para generar documentación interactiva con Swagger UI.
 *
 * Acceso: http://localhost:3000/api/docs
 */

import { registry } from "@/infrastructure/openapi/openapi.registry.js";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Extender Zod con capacidades OpenAPI
extendZodWithOpenApi(z);

// ========================================
// SCHEMAS ZOD PARA OPENAPI
// ========================================

const InsightMetadataSchema = z
  .object({
    kpi: z.string().optional().openapi({ example: "revenue" }),
    dimension: z.string().optional().openapi({ example: "Product A" }),
    value: z.number().optional().openapi({ example: 125000.5 }),
    change: z.number().optional().openapi({ example: 15.3 }),
    period: z.string().optional().openapi({ example: "2024-Q1" }),
  })
  .openapi({
    description: "Metadatos adicionales específicos del insight",
  });

const DatasetInsightSchema = z
  .object({
    id: z.string().openapi({ example: "insight_abc123" }),
    datasetId: z.string().openapi({ example: "507f1f77bcf86cd799439011" }),
    type: z
      .enum(["summary", "warning", "suggestion", "trend", "anomaly"])
      .openapi({
        example: "trend",
        description: "Tipo de insight generado",
      }),
    severity: z.number().int().min(1).max(5).openapi({
      example: 3,
      description: "Nivel de importancia (1=bajo, 5=crítico)",
    }),
    icon: z.enum(["💡", "⚠️", "✨", "📈", "📉", "🚨", "✅"]).openapi({
      example: "📈",
      description: "Icono visual representativo",
    }),
    title: z
      .string()
      .openapi({ example: "Incremento significativo en ventas" }),
    message: z.string().openapi({
      example: "Las ventas del Grupo A aumentaron un 15.3% respecto al Grupo B",
    }),
    metadata: InsightMetadataSchema,
    generatedBy: z.enum(["rule-engine", "ai-model"]).openapi({
      example: "ai-model",
      description: "Motor que generó el insight",
    }),
    confidence: z.number().min(0).max(1).openapi({
      example: 0.92,
      description: "Nivel de confianza del insight (0-1)",
    }),
    generatedAt: z
      .string()
      .datetime()
      .openapi({ example: "2024-02-19T10:30:00Z" }),
    cacheTTL: z.number().optional().openapi({
      example: 300,
      description: "Tiempo de vida del cache en segundos",
    }),
  })
  .openapi({
    description: "Insight individual generado para un dataset",
  });

const InsightsResponseSchema = z
  .object({
    insights: z
      .array(DatasetInsightSchema)
      .openapi({ description: "Lista de insights generados" }),
    businessNarrative: z
      .object({
        summary: z.string().openapi({
          example:
            "El desempeño mejora en KPIs clave, pero existe riesgo en una dimensión crítica.",
        }),
        recommendedActions: z.array(z.string()).openapi({
          example: [
            "Priorizar acciones en Región Norte",
            "Revisar mix de producto de alto margen",
          ],
        }),
        language: z.enum(["es", "en"]).openapi({ example: "es" }),
        generatedBy: z.enum(["ai-model"]).openapi({ example: "ai-model" }),
        confidence: z.number().min(0).max(1).openapi({ example: 0.82 }),
        generatedAt: z
          .string()
          .datetime()
          .openapi({ example: "2024-02-19T10:30:00Z" }),
      })
      .optional()
      .openapi({
        description:
          "Narrativa ejecutiva opcional generada por LLM a partir de insights por reglas",
      }),
    meta: z.object({
      total: z
        .number()
        .openapi({ example: 5, description: "Total de insights generados" }),
      generatedAt: z.string().datetime().openapi({
        example: "2024-02-19T10:30:00Z",
        description: "Timestamp de generación",
      }),
      cacheStatus: z.enum(["hit", "miss"]).openapi({
        example: "hit",
        description: "Indica si los insights provienen de cache",
      }),
      generationSource: z
        .enum(["rule-engine", "ai-model", "mixed", "unknown"])
        .openapi({
          example: "rule-engine",
          description:
            "Fuente de generación de insights: reglas, LLM, mezcla o desconocida",
        }),
      narrativeStatus: z
        .enum(["not-requested", "generated", "fallback"])
        .openapi({
          example: "generated",
          description:
            "Estado de la narrativa LLM: no solicitada, generada o fallback por error",
        }),
      generationTimeMs: z.number().openapi({
        example: 450,
        description: "Tiempo de generación en milisegundos",
      }),
    }),
  })
  .openapi({
    description: "Respuesta exitosa con insights generados",
  });

const ErrorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.object({
    message: z.string().openapi({ example: "Error message" }),
    code: z.string().openapi({ example: "ERROR_CODE" }),
  }),
});

// ========================================
// REGISTRO DE ENDPOINTS
// ========================================

// GET /api/v1/datasets/:id/insights - Generar insights para un dataset
registry.registerPath({
  method: "get",
  path: "/api/v1/datasets/{id}/insights",
  tags: ["Insights"],
  summary: "Generar insights con IA para un dataset",
  description: `Genera insights inteligentes para un dataset específico utilizando reglas heurísticas y/o modelos de IA (LLM). 
  
**Características:**
- Análisis automático de tendencias, anomalías y patrones
- Cache inteligente (TTL: 5 minutos por defecto)
- Rate limiting: 10 solicitudes por minuto por usuario
- Soporte para filtros dimensionales

**Estrategias de generación:**
1. **Rule Engine (siempre)**: Genera la lista base de insights
2. **AI Narrative (opcional)**: Genera un resumen ejecutivo y acciones sobre los insights base

El bloque narrativo se habilita según configuración del dataset (\`aiConfig.enabled\` o \`aiConfig.enabledFeatures.insights\`).`,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "507f1f77bcf86cd799439011",
        description: "ID del dataset (MongoDB ObjectId)",
      }),
    }),
    query: z.object({
      filters: z
        .string()
        .optional()
        .openapi({
          param: {
            name: "filters",
            in: "query",
          },
          example: '{"categorical":{"region":["Norte","Sur"]}}',
          description:
            "Filtros dimensionales en formato JSON (opcional). Estructura: { categorical: { [dimension]: string[] } }",
        }),
      forceRefresh: z
        .string()
        .optional()
        .openapi({
          param: {
            name: "forceRefresh",
            in: "query",
          },
          example: "false",
          description:
            "Si es 'true', ignora el cache y regenera los insights (opcional, default: false)",
        }),
    }),
  },
  responses: {
    200: {
      description: "Insights generados exitosamente",
      content: {
        "application/json": {
          schema: InsightsResponseSchema,
        },
      },
    },
    400: {
      description:
        "Error de validación (Dataset ID inválido o filtros mal formados)",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
          example: {
            success: false,
            error: {
              message: "Dataset ID inválido",
              code: "VALIDATION_ERROR",
            },
          },
        },
      },
    },
    401: {
      description: "No autenticado (token JWT faltante o inválido)",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
          example: {
            success: false,
            error: {
              message: "No autorizado",
              code: "UNAUTHORIZED",
            },
          },
        },
      },
    },
    404: {
      description:
        "Dataset no encontrado o no pertenece al usuario autenticado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
          example: {
            success: false,
            error: {
              message: "Dataset no encontrado",
              code: "NOT_FOUND",
            },
          },
        },
      },
    },
    429: {
      description:
        "Rate limit excedido (máximo 10 solicitudes por minuto por usuario)",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
          example: {
            success: false,
            error: {
              message: "Demasiadas solicitudes, intente nuevamente más tarde",
              code: "TOO_MANY_REQUESTS",
            },
          },
        },
      },
    },
    500: {
      description: "Error interno del servidor (fallo en LLM o procesamiento)",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
