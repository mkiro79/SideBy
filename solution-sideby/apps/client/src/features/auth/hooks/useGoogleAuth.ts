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
    setIsLoading(true);
    setError(null);

    try {
      const idToken = credentialResponse.credential;

      if (!idToken) {
        throw new Error("No ID token received from Google");
      }

      // Validate that Google Client ID is configured
      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        throw new Error("Google Client ID is not configured");
      }

      // Call backend with the real Google ID TOKEN
      const authResponse = await AuthRepository.loginWithGoogle(idToken);

      if (authResponse.success) {
        // Save in Zustand (automatically persists in localStorage)
        setAuth(authResponse.data.user, authResponse.data.token);
      } else {
        throw new Error("Error in server response");
      }
    } catch (err: unknown) {
      let errorMessage = "Error logging in with Google";

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { error?: { message?: string } } };
          message?: string;
        };
        errorMessage =
          axiosError.response?.data?.error?.message ||
          axiosError.message ||
          errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Error logging in with Google");
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
