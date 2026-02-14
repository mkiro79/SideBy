/**
 * Tests para useUpdateDataset Hook
 *
 * Verifica:
 * - Update exitoso con invalidación de cache
 * - Optimistic updates (UI se actualiza antes de la respuesta)
 * - Rollback automático en errores
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useUpdateDataset } from "../useUpdateDataset.js";
import { createQueryClientWrapper } from "@/test/utils/react-query.js";
import * as api from "../../services/datasets.api.js";
import type { Dataset } from "../../types/api.types.js";

// Mock del servicio de API
vi.mock("../../services/datasets.api.js", () => ({
  updateDataset: vi.fn(),
}));

describe("useUpdateDataset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDataset: Dataset = {
    id: "dataset-123",
    ownerId: "user-456",
    status: "ready",
    meta: {
      name: "Original Dataset",
      description: "Original description",
      createdAt: "2026-02-13T10:00:00Z",
      updatedAt: "2026-02-13T10:00:00Z",
    },
    sourceConfig: {
      groupA: {
        label: "2024",
        color: "#3b82f6",
        originalFileName: "file_a.csv",
        rowCount: 100,
      },
      groupB: {
        label: "2023",
        color: "#ef4444",
        originalFileName: "file_b.csv",
        rowCount: 100,
      },
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
    data: [],
  };

  it("debe actualizar dataset y revalidar cache", async () => {
    const updatedDataset: Dataset = {
      ...mockDataset,
      meta: {
        ...mockDataset.meta,
        name: "Updated Dataset",
        description: "Updated description",
      },
    };

    vi.mocked(api.updateDataset).mockResolvedValue(updatedDataset);

    const { result } = renderHook(() => useUpdateDataset(), {
      wrapper: createQueryClientWrapper(),
    });

    // Act
    act(() => {
      result.current.mutate({
        id: "dataset-123",
        payload: {
          meta: {
            name: "Updated Dataset",
            description: "Updated description",
          },
        },
      });
    });

    // Assert - Mutation debe completarse
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(updatedDataset);
    expect(api.updateDataset).toHaveBeenCalledWith("dataset-123", {
      meta: {
        name: "Updated Dataset",
        description: "Updated description",
      },
    });
  });

  it("debe implementar optimistic update", async () => {
    const wrapper = createQueryClientWrapper();
    const queryClient = wrapper.queryClient;

    // Pre-poblar cache con dataset original
    queryClient.setQueryData(["dataset", "dataset-123"], mockDataset);

    // Mock que tarda 100ms en responder
    vi.mocked(api.updateDataset).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ...mockDataset,
                meta: { ...mockDataset.meta, name: "Final Name" },
              }),
            100,
          ),
        ),
    );

    const { result } = renderHook(() => useUpdateDataset(), { wrapper });

    // Act - Mutación optimista
    act(() => {
      result.current.mutate({
        id: "dataset-123",
        payload: {
          meta: { name: "Optimistic Update" },
        },
      });
    });

    // Assert - Cache debe actualizarse INMEDIATAMENTE (antes de los 100ms)
    await waitFor(() => {
      const cachedData = queryClient.getQueryData<Dataset>([
        "dataset",
        "dataset-123",
      ]);
      expect(cachedData?.meta.name).toBe("Optimistic Update");
      expect(cachedData?.meta.description).toBe("Original description"); // Otros campos preservados
    });

    // Esperar respuesta del servidor
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("debe hacer rollback en caso de error", async () => {
    const wrapper = createQueryClientWrapper();
    const queryClient = wrapper.queryClient;

    // Pre-poblar cache con dataset original
    queryClient.setQueryData(["dataset", "dataset-123"], mockDataset);

    // Mock que falla
    vi.mocked(api.updateDataset).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useUpdateDataset(), { wrapper });

    // Act - Intentar actualizar (fallará)
    act(() => {
      result.current.mutate({
        id: "dataset-123",
        payload: {
          meta: { name: "Failed Update" },
        },
      });
    });

    // Assert - Debe marcar error
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Assert - Cache debe volver al estado original (rollback)
    const cachedData = queryClient.getQueryData<Dataset>([
      "dataset",
      "dataset-123",
    ]);

    expect(cachedData?.meta.name).toBe("Original Dataset");
    expect(result.current.error?.message).toBe("Network error");
  });

  it("debe mergear correctamente objetos anidados (sourceConfig)", async () => {
    const wrapper = createQueryClientWrapper();
    const queryClient = wrapper.queryClient;

    queryClient.setQueryData(["dataset", "dataset-123"], mockDataset);

    const updatedDataset: Dataset = {
      ...mockDataset,
      sourceConfig: {
        groupA: {
          ...mockDataset.sourceConfig.groupA,
          label: "Updated 2024",
          color: "#10b981",
        },
        groupB: mockDataset.sourceConfig.groupB,
      },
    };

    vi.mocked(api.updateDataset).mockResolvedValue(updatedDataset);

    const { result } = renderHook(() => useUpdateDataset(), { wrapper });

    act(() => {
      result.current.mutate({
        id: "dataset-123",
        payload: {
          sourceConfig: {
            groupA: {
              label: "Updated 2024",
              color: "#10b981",
            },
          },
        },
      });
    });

    // Verificar merge optimista
    await waitFor(() => {
      const cachedData = queryClient.getQueryData<Dataset>([
        "dataset",
        "dataset-123",
      ]);
      expect(cachedData?.sourceConfig.groupA.label).toBe("Updated 2024");
      expect(cachedData?.sourceConfig.groupA.color).toBe("#10b981");
      expect(cachedData?.sourceConfig.groupA.originalFileName).toBe(
        "file_a.csv",
      ); // Preservado
      expect(cachedData?.sourceConfig.groupB).toEqual(
        mockDataset.sourceConfig.groupB,
      ); // No modificado
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
