/**
 * Tests para useDeleteAccount Hook
 *
 * Verifica:
 * - Mutation exitosa llama a deleteUserAccount
 * - La función onSuccess recibe callback y lo ejecuta tras el delete
 * - Manejo de errores del API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDeleteAccount } from "../useDeleteAccount.js";
import { createQueryClientWrapper } from "@/test/utils/react-query.js";
import * as api from "../../services/user.api.js";

// Mock del servicio de API
vi.mock("../../services/user.api.js", () => ({
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  deleteUserAccount: vi.fn(),
}));

describe("useDeleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe llamar a deleteUserAccount al mutar", async () => {
    vi.mocked(api.deleteUserAccount).mockResolvedValue(undefined);

    const wrapper = createQueryClientWrapper();
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(api.deleteUserAccount).toHaveBeenCalledTimes(1);
  });

  it("debe ejecutar onSuccess callback tras eliminar exitosamente", async () => {
    vi.mocked(api.deleteUserAccount).mockResolvedValue(undefined);
    const onSuccessSpy = vi.fn();

    const wrapper = createQueryClientWrapper();
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(undefined, { onSuccess: onSuccessSpy });
    });

    expect(onSuccessSpy).toHaveBeenCalledTimes(1);
  });

  it("debe propagar error cuando el API falla", async () => {
    vi.mocked(api.deleteUserAccount).mockRejectedValue(
      new Error("Error del servidor"),
    );

    const wrapper = createQueryClientWrapper();
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync();
      }),
    ).rejects.toThrow();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
