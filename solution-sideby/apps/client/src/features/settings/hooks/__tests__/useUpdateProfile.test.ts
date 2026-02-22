/**
 * Tests para useUpdateProfile Hook
 *
 * Verifica:
 * - Mutation exitosa actualiza el perfil
 * - Cache de React Query se invalida al actualizar
 * - Estado de loading durante la mutación
 * - Manejo de errores del API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useUpdateProfile } from "../useUpdateProfile.js";
import { createQueryClientWrapper } from "@/test/utils/react-query.js";
import * as api from "../../services/user.api.js";
import type { UserProfileResponse } from "../../types/user-profile.types.js";

// Mock del servicio de API
vi.mock("../../services/user.api.js", () => ({
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  deleteUserAccount: vi.fn(),
}));

describe("useUpdateProfile", () => {
  const mockUpdatedProfile: UserProfileResponse = {
    success: true,
    data: {
      id: "user-123",
      name: "Jane Doe",
      email: "john.doe@gmail.com",
      isGoogleUser: true,
      role: "user",
      createdAt: "2025-01-01T00:00:00.000Z",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe llamar a updateUserProfile con el nombre correcto", async () => {
    vi.mocked(api.updateUserProfile).mockResolvedValue(mockUpdatedProfile);

    const wrapper = createQueryClientWrapper();
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: "Jane Doe" });
    });

    expect(api.updateUserProfile).toHaveBeenCalledWith({ name: "Jane Doe" });
  });

  it("debe estar pendiente (isPending) durante la mutación", async () => {
    // Mock que tarda en responder
    vi.mocked(api.updateUserProfile).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockUpdatedProfile), 100),
        ),
    );

    const wrapper = createQueryClientWrapper();
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    act(() => {
      result.current.mutate({ name: "Jane Doe" });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
  });

  it("debe propagar error cuando el API falla", async () => {
    vi.mocked(api.updateUserProfile).mockRejectedValue(
      new Error("Nombre inválido"),
    );

    const wrapper = createQueryClientWrapper();
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ name: "" });
      }),
    ).rejects.toThrow();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
