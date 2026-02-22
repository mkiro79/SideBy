/**
 * Tests para useUserProfile Hook
 *
 * Verifica:
 * - Fetch del perfil al montar el componente
 * - Estado de loading durante la petición
 * - Mapeo correcto del DTO del backend
 * - Manejo de error cuando el usuario no está autenticado
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUserProfile } from "../useUserProfile.js";
import { createQueryClientWrapper } from "@/test/utils/react-query.js";
import * as api from "../../services/user.api.js";
import type { UserProfileResponse } from "../../types/user-profile.types.js";

// Mock del servicio de API
vi.mock("../../services/user.api.js", () => ({
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  deleteUserAccount: vi.fn(),
}));

describe("useUserProfile", () => {
  const mockProfile: UserProfileResponse = {
    success: true,
    data: {
      id: "user-123",
      name: "John Doe",
      email: "john.doe@gmail.com",
      isGoogleUser: true,
      avatar: "https://example.com/avatar.jpg",
      role: "user",
      createdAt: "2025-01-01T00:00:00.000Z",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar el perfil del usuario al montar el componente", async () => {
    vi.mocked(api.getUserProfile).mockResolvedValue(mockProfile);

    const wrapper = createQueryClientWrapper();
    const { result } = renderHook(() => useUserProfile(), { wrapper });

    // Inicialmente debe estar cargando
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile.data);
    expect(result.current.error).toBeNull();
  });

  it("debe mapear isGoogleUser correctamente para usuarios Google", async () => {
    vi.mocked(api.getUserProfile).mockResolvedValue(mockProfile);

    const wrapper = createQueryClientWrapper();
    const { result } = renderHook(() => useUserProfile(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.profile?.isGoogleUser).toBe(true);
  });

  it("debe mapear isGoogleUser como false para usuarios con contraseña", async () => {
    const passwordUserResponse: UserProfileResponse = {
      success: true,
      data: { ...mockProfile.data, isGoogleUser: false },
    };
    vi.mocked(api.getUserProfile).mockResolvedValue(passwordUserResponse);

    const wrapper = createQueryClientWrapper();
    const { result } = renderHook(() => useUserProfile(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.profile?.isGoogleUser).toBe(false);
  });

  it("debe retornar error si la llamada al API falla", async () => {
    vi.mocked(api.getUserProfile).mockRejectedValue(new Error("Unauthorized"));

    const wrapper = createQueryClientWrapper();
    const { result } = renderHook(() => useUserProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.profile).toBeUndefined();
  });
});
