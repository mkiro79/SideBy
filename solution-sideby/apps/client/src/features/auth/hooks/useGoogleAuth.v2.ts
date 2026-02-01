import { useState } from "react";
import { useGoogleLogin, type CodeResponse } from "@react-oauth/google";
import { useAuthStore } from "../store/auth.store.js";
import { AuthRepository } from "@/infrastructure/api/repositories/auth.repository.js";
import axios from "axios";

// ============================================================================
// HOOK PERSONALIZADO PARA GOOGLE LOGIN (Auth Code Flow)
// ============================================================================

export interface UseGoogleLoginReturn {
  login: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useGoogleAuth = (): UseGoogleLoginReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSuccess = async (
    codeResponse: Omit<
      CodeResponse,
      "error" | "error_description" | "error_uri"
    >,
  ) => {
    console.log("🔵 Google OAuth Success - Authorization code recibido");
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔵 Intercambiando código por tokens...");

      // Intercambiar el authorization code por tokens usando Google Token Endpoint
      const tokenResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
          code: codeResponse.code,
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          redirect_uri: window.location.origin,
          grant_type: "authorization_code",
        },
      );

      console.log("🔵 Tokens recibidos de Google");

      const idToken = tokenResponse.data.id_token;

      if (!idToken) {
        throw new Error("No se recibió el ID token de Google");
      }

      console.log("🔵 Enviando ID token al backend...");

      // Llamar al backend con el ID TOKEN (no el access token)
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

  const handleError = () => {
    console.log("❌ Google OAuth Error - Usuario canceló o hubo error");
    setError("Cancelaste el inicio de sesión con Google");
    setIsLoading(false);
  };

  const login = useGoogleLogin({
    onSuccess: handleSuccess,
    onError: handleError,
    flow: "auth-code", // Authorization code flow para obtener ID token
  });

  const clearError = () => setError(null);

  return {
    login,
    isLoading,
    error,
    clearError,
  };
};
