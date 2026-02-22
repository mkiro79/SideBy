/**
 * useUpdateProfile — Hook para actualizar el nombre del usuario autenticado.
 *
 * Usa React Query useMutation. Tras éxito, invalida el cache del perfil
 * para que se refetché con los datos actualizados.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile } from "../services/user.api.js";
import type {
  UpdateProfileRequest,
  UserProfile,
} from "../types/user-profile.types.js";
import { USER_PROFILE_QUERY_KEY } from "./useUserProfile.js";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Mutation para actualizar el nombre del perfil de usuario.
 * Solo el campo `name` es editable. El email es siempre read-only.
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateProfile();
 *
 * const handleSubmit = () => {
 *   mutate({ name: "Nuevo Nombre" }, {
 *     onSuccess: () => toast.success("Perfil actualizado"),
 *     onError: () => toast.error("Error al actualizar"),
 *   });
 * };
 * ```
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfileRequest>({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await updateUserProfile(data);
      return response.data;
    },

    // Tras éxito, invalidar el cache del perfil para refetch automático
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(USER_PROFILE_QUERY_KEY, updatedProfile);
    },
  });
};
