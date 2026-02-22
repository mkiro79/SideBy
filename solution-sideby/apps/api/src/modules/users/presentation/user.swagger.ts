/**
 * Documentación OpenAPI 3.0 para el módulo de Users.
 *
 * Este archivo registra los endpoints del perfil de usuario
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
// SCHEMAS OPENAPI
// ========================================

const UserProfileResponseSchema = z
  .object({
    id: z.string().openapi({ example: "user-abc123" }),
    name: z.string().openapi({ example: "John Doe" }),
    email: z.string().email().openapi({ example: "john.doe@gmail.com" }),
    isGoogleUser: z.boolean().openapi({ example: true }),
    avatar: z
      .string()
      .optional()
      .openapi({ example: "https://cdn.example.com/avatar.jpg" }),
    role: z.enum(["user", "admin"]).openapi({ example: "user" }),
    createdAt: z.string().openapi({ example: "2025-01-01T00:00:00.000Z" }),
  })
  .openapi("UserProfile");

const UpdateProfileBodySchema = z
  .object({
    name: z.string().min(1).max(100).openapi({ example: "Jane Doe" }),
  })
  .openapi("UpdateProfileBody");

const ErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      message: z.string(),
      code: z.string(),
      // Presente en errores de validación (fieldErrors de Zod)
      details: z
        .object({ fieldErrors: z.record(z.string(), z.array(z.string())) })
        .optional(),
    }),
  })
  .openapi("ErrorResponse");

// ========================================
// REGISTRO DE ENDPOINTS
// ========================================

/**
 * GET /api/v1/users/me
 */
registry.registerPath({
  method: "get",
  path: "/api/v1/users/me",
  tags: ["Users"],
  summary: "Obtener perfil del usuario autenticado",
  description:
    "Retorna la información pública del usuario autenticado via JWT.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Perfil del usuario",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: UserProfileResponseSchema,
          }),
        },
      },
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Usuario no encontrado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

/**
 * PUT /api/v1/users/me/profile
 */
registry.registerPath({
  method: "put",
  path: "/api/v1/users/me/profile",
  tags: ["Users"],
  summary: "Actualizar perfil del usuario",
  description:
    "Permite actualizar el nombre del usuario autenticado. El email es siempre read-only.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: UpdateProfileBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Perfil actualizado correctamente",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: UserProfileResponseSchema,
          }),
        },
      },
    },
    400: {
      description: "Datos de entrada inválidos",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Usuario no encontrado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

/**
 * DELETE /api/v1/users/me
 */
registry.registerPath({
  method: "delete",
  path: "/api/v1/users/me",
  tags: ["Users"],
  summary: "Eliminar cuenta de usuario",
  description:
    "Elimina permanentemente la cuenta del usuario autenticado y todos sus datasets (hard delete con cascade).",
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description: "Cuenta eliminada correctamente",
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Usuario no encontrado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
