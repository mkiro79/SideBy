/**
 * useLogout — Hook centralizado para cerrar sesión.
 *
 * Combina tres acciones en orden:
 * 1. Limpia el cache de React Query (evita que el próximo usuario vea datos del anterior).
 * 2. Limpia el store de Zustand (token, user, isAuthenticated).
 * 3. Redirige al login.
 *
 * Debe usarse en TODOS los puntos donde se sale de la sesión para garantizar
 * que no queden datos cacheados de un usuario anterior.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store.js";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Devuelve una función `logout` lista para llamar desde cualquier componente.
 *
 * @example
 * ```tsx
 * const logout = useLogout();
 * <Button onClick={logout}>Cerrar sesión</Button>
 * ```
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const storeLogout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    // 1. Limpia el cache de React Query para que el nuevo usuario
    //    no herede datasets, perfil u otras queries del usuario anterior.
    queryClient.clear();

    // 2. Limpia el store de Zustand (borra token y datos de sesión).
    storeLogout();

    // 3. Redirige al login.
    navigate("/login", { replace: true });
  }, [queryClient, storeLogout, navigate]);

  return logout;
};
