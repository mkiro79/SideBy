import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Extender Zod con capacidades OpenAPI
extendZodWithOpenApi(z);

// Schema de entrada para login con Google
export const LoginWithGoogleSchema = z
  .object({
    token: z.string().min(1, "Google token is required"),
  })
  .openapi({
    example: {
      token: "ya29.a0AfH6SMBx...",
    },
    description: "Google OAuth token obtenido del cliente",
  });

// Schema de respuesta del usuario
export const UserResponseSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(["user", "admin"]),
    avatar: z.string().optional(),
  })
  .openapi({
    example: {
      id: "507f1f77bcf86cd799439011",
      email: "usuario@ejemplo.com",
      name: "Juan Perez",
      role: "user",
      avatar: "https://lh3.googleusercontent.com/a/default-user",
    },
    description: "Datos del usuario autenticado",
  });

// Schema de respuesta completa de autenticacion
export const AuthResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.object({
      user: UserResponseSchema,
      token: z.string(),
    }),
  })
  .openapi({
    example: {
      success: true,
      data: {
        user: {
          id: "507f1f77bcf86cd799439011",
          email: "usuario@ejemplo.com",
          name: "Juan Perez",
          role: "user",
          avatar: "https://lh3.googleusercontent.com/a/default-user",
        },
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
    description: "Respuesta exitosa de autenticacion con JWT",
  });

// Schema de respuesta de error
export const ErrorResponseSchema = z
  .object({
    success: z.boolean(),
    error: z.object({
      message: z.string(),
      code: z.string().optional(),
    }),
  })
  .openapi({
    example: {
      success: false,
      error: {
        message: "Authentication failed: Invalid Google token",
        code: "AUTH_ERROR",
      },
    },
    description: "Respuesta de error",
  });

// Types exportados
export type LoginWithGoogleInput = z.infer<typeof LoginWithGoogleSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
