/**
 * Documentación OpenAPI para Auth de Desarrollo
 *
 * ⚠️ SOLO VISIBLE EN DEVELOPMENT ⚠️
 */

import { registry } from "@/infrastructure/openapi/openapi.registry.js";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Extender Zod con OpenAPI
extendZodWithOpenApi(z);

// Solo registrar en desarrollo
if (process.env.NODE_ENV !== "production") {
  // Schema de entrada
  const DevLoginRequestSchema = z
    .object({
      email: z.string().email(),
      name: z.string().optional(),
      role: z.enum(["user", "admin"]).optional(),
    })
    .openapi({
      example: {
        email: "test@example.com",
        name: "Test User",
        role: "user",
      },
      description: "Datos para generar token de desarrollo",
    });

  // Schema de respuesta
  const DevLoginResponseSchema = z
    .object({
      success: z.boolean(),
      data: z.object({
        user: z.object({
          id: z.string(),
          email: z.string(),
          name: z.string(),
          role: z.enum(["user", "admin"]),
        }),
        token: z.string(),
      }),
    })
    .openapi({
      example: {
        success: true,
        data: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "test@example.com",
            name: "Test User",
            role: "user",
          },
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
      description: "Token JWT generado para desarrollo",
    });

  // Registrar endpoint
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/dev-login",
    tags: ["Auth (Development Only)"],
    summary: "🔧 Generar token JWT para testing",
    description: `
**⚠️ SOLO PARA DESARROLLO - DESHABILITADO EN PRODUCCIÓN**

Genera un token JWT sin necesidad de autenticación real con Google OAuth.
Si el usuario no existe, se crea automáticamente.

**Uso:**
1. Envía un email (y opcionalmente nombre y role)
2. Recibe un token JWT válido
3. Usa el token en el header \`Authorization: Bearer <token>\`

**Casos de uso:**
- Testing de endpoints protegidos
- Desarrollo local sin configurar Google OAuth
- Scripts automatizados de prueba
    `,
    request: {
      body: {
        content: {
          "application/json": {
            schema: DevLoginRequestSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Token generado exitosamente",
        content: {
          "application/json": {
            schema: DevLoginResponseSchema,
          },
        },
      },
      400: {
        description: "Email requerido",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              error: z.object({
                message: z.string(),
                code: z.string(),
              }),
            }),
          },
        },
      },
      403: {
        description: "Endpoint deshabilitado en producción",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              error: z.object({
                message: z.string(),
                code: z.string(),
              }),
            }),
          },
        },
      },
    },
  });
}
