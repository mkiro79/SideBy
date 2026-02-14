/**
 * Tests para useDeleteDataset Hook
 *
 * Verifica:
 * - Delete exitoso con invalidación de cache
 * - Optimistic removal (UI se actualiza antes de la respuesta)
 * - Rollback automático en errores
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDeleteDataset } from "../useDeleteDataset.js";
import { createQueryClientWrapper } from "@/test/utils/react-query.js";
import * as api from "../../services/datasets.api.js";
import type {
  DatasetSummary,
  ListDatasetsResponse,
} from "../../types/api.types.js";

// Mock del servicio de API
vi.mock("../../services/datasets.api.js", () => ({
  deleteDataset: vi.fn(),
}));

describe("useDeleteDataset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDatasets: DatasetSummary[] = [
    {
      id: "dataset-1",
      status: "ready",
      meta: {
        name: "Dataset 1",
        description: "Test dataset 1",
        createdAt: "2026-02-13T10:00:00Z",
        updatedAt: "2026-02-13T10:00:00Z",
      },
      sourceConfig: {
        groupA: {
          label: "2024",
          color: "#3b82f6",
          originalFileName: "file_a1.csv",
          rowCount: 100,
        },
        groupB: {
          label: "2023",
          color: "#ef4444",
          originalFileName: "file_b1.csv",
          rowCount: 100,
        },
      },
      totalRows: 200,
    },
    {
      id: "dataset-2",
      status: "processing",
      meta: {
        name: "Dataset 2",
        description: "Test dataset 2",
        createdAt: "2026-02-13T11:00:00Z",
        updatedAt: "2026-02-13T11:00:00Z",
      },
      sourceConfig: {
        groupA: {
          label: "2024",
          color: "#3b82f6",
          originalFileName: "file_a2.csv",
          rowCount: 50,
        },
        groupB: {
          label: "2023",
          color: "#ef4444",
          originalFileName: "file_b2.csv",
          rowCount: 50,
        },
      },
      totalRows: 100,
    },
    {
      id: "dataset-3",
      status: "ready",
      meta: {
        name: "Dataset 3",
        description: "Test dataset 3",
        createdAt: "2026-02-13T12:00:00Z",
        updatedAt: "2026-02-13T12:00:00Z",
      },
      sourceConfig: {
        groupA: {
          label: "2024",
          color: "#3b82f6",
          originalFileName: "file_a3.csv",
          rowCount: 75,
        },
        groupB: {
          label: "2023",
          color: "#ef4444",
          originalFileName: "file_b3.csv",
          rowCount: 75,
        },
      },
      totalRows: 150,
    },
  ];

  it("debe eliminar dataset y revalidar cache", async () => {
    vi.mocked(api.deleteDataset).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteDataset(), {
      wrapper: createQueryClientWrapper(),
    });

    // Act
    act(() => {
      result.current.mutate("dataset-123");
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.deleteDataset).toHaveBeenCalledWith("dataset-123");
  });

  it("debe remover del cache optimísticamente", async () => {
    const wrapper = createQueryClientWrapper();
    const queryClient = wrapper.queryClient;

    // Pre-poblar cache con lista de datasets
    const mockResponse: ListDatasetsResponse = {
      success: true,
      data: mockDatasets,
      total: 3,
    };
    queryClient.setQueryData(["datasets"], mockResponse);

    // Mock que tarda 100ms en responder
    vi.mocked(api.deleteDataset).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100)),
    );

    const { result } = renderHook(() => useDeleteDataset(), { wrapper });

    // Act - Eliminar dataset-2
    act(() => {
      result.current.mutate("dataset-2");
    });

    // Assert - Cache debe actualizarse INMEDIATAMENTE (antes de los 100ms)
    await waitFor(() => {
      const cachedData = queryClient.getQueryData<ListDatasetsResponse>([
        "datasets",
      ]);
      expect(cachedData?.data).toHaveLength(2);
      expect(
        cachedData?.data.find((d) => d.id === "dataset-2"),
      ).toBeUndefined();
      expect(cachedData?.data.find((d) => d.id === "dataset-1")).toBeDefined();
      expect(cachedData?.data.find((d) => d.id === "dataset-3")).toBeDefined();
      expect(cachedData?.total).toBe(2);
    });

    // Esperar respuesta del servidor
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("debe hacer rollback si falla", async () => {
    const wrapper = createQueryClientWrapper();
    const queryClient = wrapper.queryClient;

    // Pre-poblar cache
    const mockResponse: ListDatasetsResponse = {
      success: true,
      data: mockDatasets,
      total: 3,
    };
    queryClient.setQueryData(["datasets"], mockResponse);

    // Mock que falla
    vi.mocked(api.deleteDataset).mockRejectedValue(new Error("Forbidden"));

    const { result } = renderHook(() => useDeleteDataset(), { wrapper });

    // Act - Intentar eliminar (fallará)
    act(() => {
      result.current.mutate("dataset-2");
    });

    // Assert - Debe marcar error
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Assert - Cache debe volver al estado original (rollback)
    const cachedData = queryClient.getQueryData<ListDatasetsResponse>([
      "datasets",
    ]);

    expect(cachedData?.data).toHaveLength(3);
    expect(cachedData?.data.find((d) => d.id === "dataset-2")).toBeDefined();
    expect(cachedData?.total).toBe(3);
    expect(result.current.error?.message).toBe("Forbidden");
  });

  it("debe eliminar solo el dataset especificado", async () => {
    const wrapper = createQueryClientWrapper();
    const queryClient = wrapper.queryClient;

    const mockResponse: ListDatasetsResponse = {
      success: true,
      data: mockDatasets,
      total: 3,
    };
    queryClient.setQueryData(["datasets"], mockResponse);

    vi.mocked(api.deleteDataset).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteDataset(), { wrapper });

    // Eliminar dataset-1
    act(() => {
      result.current.mutate("dataset-1");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedData = queryClient.getQueryData<ListDatasetsResponse>([
      "datasets",
    ]);

    expect(cachedData?.data).toHaveLength(2);
    expect(cachedData?.data.map((d) => d.id)).toEqual([
      "dataset-2",
      "dataset-3",
    ]);
  });

  it("debe remover también el dataset del cache de detalle", async () => {
    const wrapper = createQueryClientWrapper();
    const queryClient = wrapper.queryClient;

    // Pre-poblar cache de lista Y detalle
    queryClient.setQueryData(["datasets"], {
      success: true,
      data: mockDatasets,
      total: 3,
    });
    queryClient.setQueryData(["dataset", "dataset-2"], mockDatasets[1]);

    vi.mocked(api.deleteDataset).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteDataset(), { wrapper });

    // Verificar que el detalle existe antes
    expect(queryClient.getQueryData(["dataset", "dataset-2"])).toBeDefined();

    // Eliminar
    act(() => {
      result.current.mutate("dataset-2");
    });

    // Verificar que el detalle fue removido inmediatamente
    await waitFor(() => {
      expect(
        queryClient.getQueryData(["dataset", "dataset-2"]),
      ).toBeUndefined();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
