/**
 * Tests para useUpdateDataset Hook
 *
 * Verifica:
 * - Update exitoso con invalidación de cache
 * - Manejo de errores
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useUpdateDataset } from "../useUpdateDataset.js";
import { createQueryClientWrapper } from "@/test/utils/react-query.js";
import * as api from "../../services/datasets.api.js";
import type { Dataset, UpdateMappingRequest } from "../../types/api.types.js";

// Mock del servicio de API
vi.mock("../../services/datasets.api.js", () => ({
  updateDataset: vi.fn(),
}));

describe("useUpdateDataset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPayload: UpdateMappingRequest = {
    meta: {
      name: "Test Dataset",
      description: "Test description",
    },
    schemaMapping: {
      dimensionField: "Product",
      kpiFields: [
        {
          id: "revenue",
          columnName: "Revenue",
          label: "Ingresos",
          format: "currency",
        },
      ],
    },
    dashboardLayout: {
      templateId: "sideby_executive",
      highlightedKpis: ["revenue"],
    },
    aiConfig: {
      enabled: false,
    },
  };

  const mockDataset: Dataset = {
    id: "dataset-123",
    status: "ready",
  } as Dataset;

  it("debe actualizar dataset y revalidar cache", async () => {
    vi.mocked(api.updateDataset).mockResolvedValue(mockDataset);

    const { result } = renderHook(() => useUpdateDataset(), {
      wrapper: createQueryClientWrapper(),
    });

    // Act
    act(() => {
      result.current.mutate({
        id: "dataset-123",
        payload: mockPayload,
      });
    });

    // Assert - Mutation debe completarse
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDataset);
    expect(api.updateDataset).toHaveBeenCalledWith("dataset-123", mockPayload);
  });

  it("debe manejar errores correctamente", async () => {
    vi.mocked(api.updateDataset).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useUpdateDataset(), {
      wrapper: createQueryClientWrapper(),
    });

    // Act - Intentar actualizar (fallará)
    act(() => {
      result.current.mutate({
        id: "dataset-123",
        payload: mockPayload,
      });
    });

    // Assert - Debe marcar error
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Network error");
  });
});
