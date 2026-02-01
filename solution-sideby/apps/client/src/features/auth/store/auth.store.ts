import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/auth.types.js";

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface AuthState {
  // Estado
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  clearError: () => void;
}

// ============================================================================
// STORE CON PERSIST MIDDLEWARE
// ============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,

      // Action: Guardar autenticación
      setAuth: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      // Action: Cerrar sesión
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      // Action: Limpiar errores
      clearError: () => {
        // Placeholder para futuros errores
      },
    }),
    {
      name: "sideby-auth-storage", // Nombre de la key en localStorage
      partialize: (state) => ({
        // Solo persistir estos campos
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
