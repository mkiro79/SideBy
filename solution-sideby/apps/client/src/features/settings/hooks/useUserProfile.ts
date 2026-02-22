/**
 * useUserProfile — Hook para obtener el perfil del usuario autenticado.
 *
 * Usa React Query para cachear la petición y refetchear cuando sea necesario.
 * Query key: ["user-profile"]
 */

import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "../services/user.api.js";
import type { UserProfile } from "../types/user-profile.types.js";

export const USER_PROFILE_QUERY_KEY = ["user-profile"] as const;

// ============================================================================
// RETURN TYPE
// ============================================================================

export interface UseUserProfileReturn {
  profile: UserProfile | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Obtiene y cachea el perfil del usuario autenticado.
 *
 * @example
 * ```tsx
 * const { profile, isLoading } = useUserProfile();
 * if (isLoading) return <Spinner />;
 * return <p>{profile?.name}</p>;
 * ```
 */
export const useUserProfile = (): UseUserProfileReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: async () => {
      const response = await getUserProfile();
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    profile: data,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
