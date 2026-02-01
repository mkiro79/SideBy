import { useState } from "react";
import type { CredentialResponse } from "@react-oauth/google";
import { useAuthStore } from "../store/auth.store.js";
import { AuthRepository } from "@/infrastructure/api/repositories/auth.repository.js";

// ============================================================================
// HOOK PERSONALIZADO PARA GOOGLE LOGIN
// ============================================================================

export interface UseGoogleLoginReturn {
  handleGoogleSuccess: (
    credentialResponse: CredentialResponse,
  ) => Promise<void>;
  handleGoogleError: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useGoogleAuth = (): UseGoogleLoginReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    console.log(
      "🔵 Google OAuth Success - Credential recibido",
      credentialResponse,
    );
    setIsLoading(true);
    setError(null);

    try {
      const idToken = credentialResponse.credential;

      if (!idToken) {
        throw new Error("No se recibió el ID token de Google");
      }

      console.log("🔵 Enviando ID token real al backend...");

      // Llamar al backend con el ID TOKEN REAL de Google
      const authResponse = await AuthRepository.loginWithGoogle(idToken);

      console.log("🔵 Respuesta del backend:", authResponse);

      if (authResponse.success) {
        // Guardar en Zustand (automáticamente persiste en localStorage)
        setAuth(authResponse.data.user, authResponse.data.token);

        console.log(
          "✅ Login exitoso - Usuario guardado:",
          authResponse.data.user.email,
        );
        console.log("✅ Token guardado en store");
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "Error al iniciar sesión con Google";

      setError(errorMessage);
      console.error("❌ Error en login:", err);
      console.error("❌ Mensaje de error:", errorMessage);
      console.error("❌ Response completo:", err.response);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.log("❌ Google OAuth Error - Usuario canceló o hubo error");
    setError("Error al iniciar sesión con Google");
    setIsLoading(false);
  };

  const clearError = () => setError(null);

  return {
    handleGoogleSuccess,
    handleGoogleError,
    isLoading,
    error,
    clearError,
  };
};
