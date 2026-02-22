/**
 * useDeleteAccount — Hook para eliminar la cuenta del usuario autenticado.
 *
 * Operación irreversible. Tras éxito, el consumidor debe:
 * 1. Limpiar el auth store (logout)
 * 2. Redirigir al usuario a /login
 */

import { useMutation } from "@tanstack/react-query";
import { deleteUserAccount } from "../services/user.api.js";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Mutation para eliminar definitivamente la cuenta del usuario (hard delete).
 * Elimina también todos sus datasets en cascada.
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteAccount();
 *
 * const handleDelete = () => {
 *   mutate(undefined, {
 *     onSuccess: () => {
 *       logout();
 *       navigate('/login');
 *     },
 *     onError: () => toast.error("Error al eliminar la cuenta"),
 *   });
 * };
 * ```
 */
export const useDeleteAccount = () => {
  return useMutation<void, Error, void>({
    mutationFn: deleteUserAccount,
  });
};
