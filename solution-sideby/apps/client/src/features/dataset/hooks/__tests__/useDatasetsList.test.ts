/**
 * Tests para useDatasetsList hook
 *
 * Verifica que el hook carga correctamente la lista de datasets del usuario,
 * maneja estados de loading/error, y permite recargar la lista.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDatasetsList } from "../useDatasetsList.js";
import * as datasetsApi from "../../services/datasets.api.js";
import type {
  DatasetSummary,
  ListDatasetsResponse,
} from "../../types/api.types.js";

// Mock del servicio de API
vi.mock("../../services/datasets.api.js", () => ({
  listDatasets: vi.fn(),
}));

describe("useDatasetsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDatasets: DatasetSummary[] = [
    {
      id: "dataset-1",
      status: "ready",
      meta: {
        name: "Dataset 1",
        createdAt: "2026-02-13T10:00:00Z",
        updatedAt: "2026-02-13T10:00:00Z",
      },
      sourceConfig: {
        groupA: {
          label: "2024",
          color: "#3b82f6",
          originalFileName: "fileA1.csv",
          rowCount: 100,
        },
        groupB: {
          label: "2023",
          color: "#ef4444",
          originalFileName: "fileB1.csv",
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
        createdAt: "2026-02-13T11:00:00Z",
        updatedAt: "2026-02-13T11:00:00Z",
      },
      sourceConfig: {
        groupA: {
          label: "2024",
          color: "#3b82f6",
          originalFileName: "fileA2.csv",
          rowCount: 150,
        },
        groupB: {
          label: "2023",
          color: "#ef4444",
          originalFileName: "fileB2.csv",
          rowCount: 150,
        },
      },
      totalRows: 300,
    },
  ];

  it("debe tener estado inicial correcto", () => {
    // Arrange & Act
    const { result } = renderHook(() => useDatasetsList());

    // Assert
    expect(result.current.datasets).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.isLoading).toBe(true); // Carga automáticamente
    expect(result.current.error).toBeNull();
    expect(typeof result.current.reload).toBe("function");
  });

  it("debe cargar lista de datasets automáticamente al montar", async () => {
    // Arrange
    const mockResponse: ListDatasetsResponse = {
      success: true,
      data: mockDatasets,
      total: 2,
    };

    vi.mocked(datasetsApi.listDatasets).mockResolvedValue(mockResponse);

    // Act
    const { result } = renderHook(() => useDatasetsList());

    // Assert - Loading state inicial
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.datasets).toEqual(mockDatasets);
      expect(result.current.total).toBe(2);
      expect(result.current.error).toBeNull();
    });

    expect(datasetsApi.listDatasets).toHaveBeenCalledTimes(1);
  });

  it("debe manejar lista vacía correctamente", async () => {
    // Arrange
    const mockResponse: ListDatasetsResponse = {
      success: true,
      data: [],
      total: 0,
    };

    vi.mocked(datasetsApi.listDatasets).mockResolvedValue(mockResponse);

    // Act
    const { result } = renderHook(() => useDatasetsList());

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.datasets).toEqual([]);
      expect(result.current.total).toBe(0);
    });
  });

  it("debe manejar errores de carga correctamente", async () => {
    // Arrange
    const errorMessage = "Network error";
    vi.mocked(datasetsApi.listDatasets).mockRejectedValue(
      new Error(errorMessage),
    );

    // Act
    const { result } = renderHook(() => useDatasetsList());

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.datasets).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it("debe recargar lista cuando se llama a reload()", async () => {
    // Arrange
    const mockResponse: ListDatasetsResponse = {
      success: true,
      data: mockDatasets,
      total: 2,
    };

    vi.mocked(datasetsApi.listDatasets).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDatasetsList());

    // Esperar primera carga
    await waitFor(() => {
      expect(result.current.datasets).toEqual(mockDatasets);
    });

    vi.clearAllMocks();

    // Mock con delay para poder capturar loading state
    vi.mocked(datasetsApi.listDatasets).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockResponse), 50)),
    );

    // Act - Reload envuelto en act() para forzar flush de setIsLoading(true)
    // antes de que React 18 lo batchee con setIsLoading(false)
    act(() => {
      result.current.reload();
    });

    // Assert - isLoading ya fue flusheado sincronamente por act()
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(datasetsApi.listDatasets).toHaveBeenCalledTimes(1);
    });
  });

  it("debe mantener datos previos durante recarga", async () => {
    // Arrange
    const mockResponse: ListDatasetsResponse = {
      success: true,
      data: mockDatasets,
      total: 2,
    };

    vi.mocked(datasetsApi.listDatasets).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDatasetsList());

    // Esperar primera carga
    await waitFor(() => {
      expect(result.current.datasets).toEqual(mockDatasets);
    });

    // Mock segunda carga con delay más largo
    vi.mocked(datasetsApi.listDatasets).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100)),
    );

    // Act - Recargar
    result.current.reload();

    // Assert - Datos previos aún disponibles durante loading
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(true);
      },
      { timeout: 150 },
    );
    expect(result.current.datasets).toEqual(mockDatasets); // Datos previos mantienen

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("debe limpiar error en reload exitoso", async () => {
    // Arrange - Primera carga con error
    vi.mocked(datasetsApi.listDatasets).mockRejectedValueOnce(
      new Error("Initial error"),
    );

    const { result } = renderHook(() => useDatasetsList());

    await waitFor(() => {
      expect(result.current.error).toBe("Initial error");
    });

    // Arrange - Segunda carga exitosa
    const mockResponse: ListDatasetsResponse = {
      success: true,
      data: mockDatasets,
      total: 2,
    };
    vi.mocked(datasetsApi.listDatasets).mockResolvedValue(mockResponse);

    // Act - Reload
    result.current.reload();

    // Assert - Error debe limpiarse
    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.datasets).toEqual(mockDatasets);
    });
  });
});
