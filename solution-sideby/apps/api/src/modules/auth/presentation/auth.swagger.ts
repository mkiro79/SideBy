import { registry } from "@/infrastructure/openapi/openapi.registry.js";
import {
  LoginWithGoogleSchema,
  AuthResponseSchema,
  ErrorResponseSchema,
} from "./auth.dto.js";

// Registrar endpoint POST /api/v1/auth/google
registry.registerPath({
  method: "post",
  path: "/api/v1/auth/google",
  tags: ["Auth"],
  summary: "Autenticacion con Google OAuth",
  description:
    "Autentica un usuario mediante un token de Google OAuth y devuelve un JWT para futuras peticiones",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginWithGoogleSchema,
        },
      },
      description: "Token de Google OAuth obtenido desde el cliente",
      required: true,
    },
  },
  responses: {
    200: {
      description: "Autenticacion exitosa",
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
    },
    400: {
      description: "Error de validacion - Token invalido o faltante",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Error de autenticacion - Token de Google invalido",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Error interno del servidor",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
