import { z } from "zod";

/**
 * Schema Zod para validar el body del endpoint PUT /users/me/profile.
 * Solo permite actualizar el campo 'name'.
 */
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(100, "El nombre es demasiado largo"),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
