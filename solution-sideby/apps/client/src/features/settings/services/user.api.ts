/**
 * Servicio API para el perfil de usuario
 *
 * Gestiona las llamadas HTTP a los endpoints de usuario:
 * - GET  /api/v1/users/me            → Obtener perfil
 * - PUT  /api/v1/users/me/profile    → Actualizar nombre
 * - DELETE /api/v1/users/me          → Eliminar cuenta (hard delete)
 */

import { httpClient } from "@/infrastructure/api/httpClient.js";
import type {
  UserProfileResponse,
  UpdateProfileRequest,
} from "../types/user-profile.types.js";

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Obtiene el perfil del usuario autenticado.
 */
export const getUserProfile = async (): Promise<UserProfileResponse> => {
  const response =
    await httpClient.get<UserProfileResponse>("/api/v1/users/me");
  return response.data;
};

/**
 * Actualiza el nombre del usuario autenticado.
 * El email es siempre read-only y no puede cambiarse aquí.
 */
export const updateUserProfile = async (
  data: UpdateProfileRequest,
): Promise<UserProfileResponse> => {
  const response = await httpClient.put<UserProfileResponse>(
    "/api/v1/users/me/profile",
    data,
  );
  return response.data;
};

/**
 * Elimina la cuenta del usuario de forma permanente (hard delete).
 * Esta operación elimina también todos sus datasets en cascada.
 * No hay vuelta atrás.
 */
export const deleteUserAccount = async (): Promise<void> => {
  await httpClient.delete("/api/v1/users/me");
};
