/**
 * Documentación OpenAPI 3.0 para el módulo de Datasets.
 *
 * Este archivo registra los endpoints de la API de Datasets
 * para generar documentación interactiva con Swagger UI.
 *
 * Acceso: http://localhost:3000/api/docs
 */

import { registry } from "@/infrastructure/openapi/openapi.registry.js";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { hexColorSchema } from "./validators/datasets.schemas.js";

// Extender Zod con capacidades OpenAPI
extendZodWithOpenApi(z);

// ========================================
// SCHEMAS ZOD PARA OPENAPI
// ========================================

const GroupConfigSchema = z.object({
  label: z.string().openapi({ example: "Ventas 2024" }),
  color: z.string().openapi({ example: "#3b82f6" }),
  fileName: z.string().openapi({ example: "sales_2024.csv" }),
});

const KPIFieldSchema = z.object({
  field: z.string().openapi({ example: "revenue" }),
  label: z.string().openapi({ example: "Ingresos" }),
  format: z
    .enum(["number", "currency", "percentage"])
    .openapi({ example: "currency" }),
});

const SchemaMappingSchema = z.object({
  dimensionField: z.string().openapi({ example: "product" }),
  kpis: z.array(KPIFieldSchema),
});

const DashboardLayoutSchema = z.object({
  highlightedKPIs: z
    .array(z.string())
    .openapi({ example: ["revenue", "profit"] }),
});

const AIConfigSchema = z.object({
  contextPrompt: z.string().optional().openapi({
    example:
      "Analiza las ventas desde la perspectiva del crecimiento trimestral",
  }),
});

const DatasetMetaSchema = z.object({
  name: z.string().openapi({ example: "Ventas Q1 2024 vs Q1 2023" }),
  description: z.string().optional().openapi({
    example: "Comparación trimestral de ventas",
  }),
  createdAt: z.string().openapi({ example: "2024-02-10T10:00:00Z" }),
  updatedAt: z.string().openapi({ example: "2024-02-10T10:30:00Z" }),
});

const DatasetSchema = z.object({
  id: z.string().openapi({ example: "507f1f77bcf86cd799439011" }),
  ownerId: z.string().openapi({ example: "user_123" }),
  status: z
    .enum(["processing", "ready", "error"])
    .openapi({ example: "ready" }),
  meta: DatasetMetaSchema,
  sourceConfig: z.object({
    groupA: GroupConfigSchema,
    groupB: GroupConfigSchema,
  }),
  schemaMapping: SchemaMappingSchema.optional(),
  dashboardLayout: DashboardLayoutSchema.optional(),
  aiConfig: AIConfigSchema.optional(),
});

const ErrorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.object({
    message: z.string().openapi({ example: "Error message" }),
    code: z.string().openapi({ example: "ERROR_CODE" }),
    details: z.any().optional(),
  }),
});

const SuccessResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.any(),
});

// ========================================
// REGISTRO DE ENDPOINTS
// ========================================

// POST /api/v1/datasets - Crear dataset (upload de archivos)
registry.registerPath({
  method: "post",
  path: "/api/v1/datasets",
  tags: ["Datasets"],
  summary: "Crear nuevo dataset",
  description:
    "Sube dos archivos CSV (Grupo A y Grupo B) para crear un nuevo dataset. Los archivos deben tener las mismas columnas.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["fileA", "fileB"],
            properties: {
              fileA: {
                type: "string",
                format: "binary",
                description: "Archivo CSV del Grupo A (ej: datos 2024)",
              },
              fileB: {
                type: "string",
                format: "binary",
                description: "Archivo CSV del Grupo B (ej: datos 2023)",
              },
              labelA: {
                type: "string",
                description: "Etiqueta personalizada para Grupo A",
                example: "Ventas 2024",
              },
              labelB: {
                type: "string",
                description: "Etiqueta personalizada para Grupo B",
                example: "Ventas 2023",
              },
              colorA: {
                type: "string",
                description: "Color hex para Grupo A",
                example: "#3b82f6",
              },
              colorB: {
                type: "string",
                description: "Color hex para Grupo B",
                example: "#f59e0b",
              },
            },
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Dataset creado exitosamente (status: processing)",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description:
        "Error de validación (archivos inválidos, headers diferentes, etc.)",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "No autenticado (token JWT faltante o inválido)",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    429: {
      description: "Rate limit excedido (máximo 10 uploads por hora)",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// GET /api/v1/datasets - Listar datasets del usuario
registry.registerPath({
  method: "get",
  path: "/api/v1/datasets",
  tags: ["Datasets"],
  summary: "Listar datasets del usuario",
  description:
    "Obtiene todos los datasets del usuario autenticado, ordenados por fecha de creación (más recientes primero). No incluye el campo 'data' para optimizar performance.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Lista de datasets obtenida exitosamente",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            data: z.object({
              datasets: z.array(DatasetSchema),
              count: z.number().openapi({ example: 5 }),
            }),
          }),
        },
      },
    },
    401: {
      description: "No autenticado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// GET /api/v1/datasets/:id - Obtener dataset por ID
registry.registerPath({
  method: "get",
  path: "/api/v1/datasets/{id}",
  tags: ["Datasets"],
  summary: "Obtener dataset por ID",
  description:
    "Obtiene un dataset específico con todos sus datos. Solo el propietario puede acceder.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "507f1f77bcf86cd799439011",
      }),
    }),
  },
  responses: {
    200: {
      description: "Dataset obtenido exitosamente",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            data: DatasetSchema,
          }),
        },
      },
    },
    401: {
      description: "No autenticado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "No autorizado (no es el propietario del dataset)",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Dataset no encontrado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// PATCH /api/v1/datasets/:id - Actualizar mapping del dataset
registry.registerPath({
  method: "patch",
  path: "/api/v1/datasets/{id}",
  tags: ["Datasets"],
  summary: "Actualizar configuración del dataset",
  description:
    "Actualiza el mapping, layout del dashboard y configuración de IA. Cambia el status a 'ready' cuando se completa.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "507f1f77bcf86cd799439011",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            meta: z.object({
              name: z.string().min(3).max(100),
              description: z.string().max(500).optional(),
            }),
            schemaMapping: SchemaMappingSchema,
            dashboardLayout: DashboardLayoutSchema.optional(),
            aiConfig: AIConfigSchema.optional(),
            sourceConfig: z
              .object({
                groupA: z
                  .object({
                    label: z.string().max(50).optional(),
                    color: hexColorSchema.optional(),
                  })
                  .optional(),
                groupB: z
                  .object({
                    label: z.string().max(50).optional(),
                    color: hexColorSchema.optional(),
                  })
                  .optional(),
              })
              .optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Dataset actualizado exitosamente",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Error de validación",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "No autenticado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "No autorizado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Dataset no encontrado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// DELETE /api/v1/datasets/:id - Eliminar dataset
registry.registerPath({
  method: "delete",
  path: "/api/v1/datasets/{id}",
  tags: ["Datasets"],
  summary: "Eliminar dataset",
  description:
    "Elimina permanentemente un dataset y todos sus datos asociados. Solo el propietario puede eliminar.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "507f1f77bcf86cd799439011",
      }),
    }),
  },
  responses: {
    200: {
      description: "Dataset eliminado exitosamente",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            data: z.object({
              message: z
                .string()
                .openapi({ example: "Dataset eliminado exitosamente" }),
            }),
          }),
        },
      },
    },
    401: {
      description: "No autenticado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "No autorizado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Dataset no encontrado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
