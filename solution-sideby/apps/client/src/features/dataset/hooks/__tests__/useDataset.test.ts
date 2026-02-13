/**
 * Tests para useDataset hook
 *
 * Verifica que el hook carga correctamente un dataset por ID,
 * maneja estados de loading/error, y permite recargar datos.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDataset } from "../useDataset.js";
import * as datasetsApi from "../../services/datasets.api.js";
import type { Dataset } from "../../types/api.types.js";

// Mock del servicio de API
vi.mock("../../services/datasets.api.js", () => ({
  getDataset: vi.fn(),
}));

describe("useDataset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDataset: Dataset = {
    id: "dataset-123",
    ownerId: "user-456",
    status: "ready",
    meta: {
      name: "Test Dataset",
      createdAt: "2026-02-13T10:00:00Z",
      updatedAt: "2026-02-13T10:00:00Z",
    },
    sourceConfig: {
      groupA: {
        label: "Grupo A",
        color: "#3B82F6",
        originalFileName: "fileA.csv",
        rowCount: 50,
      },
      groupB: {
        label: "Grupo B",
        color: "#F97316",
        originalFileName: "fileB.csv",
        rowCount: 50,
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

  it("debe tener estado inicial correcto con datasetId null", () => {
    // Arrange & Act
    const { result } = renderHook(() => useDataset(null));

    // Assert
    expect(result.current.dataset).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.reload).toBe("function");
  });

  it("debe cargar dataset automáticamente cuando se proporciona datasetId", async () => {
    // Arrange
    vi.mocked(datasetsApi.getDataset).mockResolvedValue(mockDataset);

    // Act
    const { result } = renderHook(() => useDataset("dataset-123"));

    // Assert - Loading state
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.dataset).toEqual(mockDataset);
      expect(result.current.error).toBeNull();
    });

    expect(datasetsApi.getDataset).toHaveBeenCalledWith("dataset-123");
    expect(datasetsApi.getDataset).toHaveBeenCalledTimes(1);
  });

  it("debe manejar errores de carga correctamente", async () => {
    // Arrange
    const errorMessage = "Dataset not found";
    vi.mocked(datasetsApi.getDataset).mockRejectedValue(
      new Error(errorMessage),
    );

    // Act
    const { result } = renderHook(() => useDataset("non-existent"));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.dataset).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it("debe recargar dataset cuando se llama a reload()", async () => {
    // Arrange
    vi.mocked(datasetsApi.getDataset).mockResolvedValue(mockDataset);

    const { result } = renderHook(() => useDataset("dataset-123"));

    // Esperar primera carga
    await waitFor(() => {
      expect(result.current.dataset).toEqual(mockDataset);
    });

    vi.clearAllMocks();

    // Mock con delay para poder capturar loading state
    vi.mocked(datasetsApi.getDataset).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockDataset), 50)),
    );

    // Act - Reload
    result.current.reload();

    // Assert - Should be loading
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(true);
      },
      { timeout: 100 },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(datasetsApi.getDataset).toHaveBeenCalledWith("dataset-123");
    });
  });

  it("debe actualizar dataset cuando cambia el datasetId", async () => {
    // Arrange
    const dataset1: Dataset = { ...mockDataset, id: "dataset-1" };
    const dataset2: Dataset = { ...mockDataset, id: "dataset-2" };

    vi.mocked(datasetsApi.getDataset)
      .mockResolvedValueOnce(dataset1)
      .mockResolvedValueOnce(dataset2);

    // Act - Render inicial con dataset-1
    const { result, rerender } = renderHook(({ id }) => useDataset(id), {
      initialProps: { id: "dataset-1" },
    });

    await waitFor(() => {
      expect(result.current.dataset).toEqual(dataset1);
    });

    // Act - Cambiar a dataset-2
    rerender({ id: "dataset-2" });

    // Assert
    await waitFor(() => {
      expect(result.current.dataset).toEqual(dataset2);
    });

    expect(datasetsApi.getDataset).toHaveBeenCalledWith("dataset-1");
    expect(datasetsApi.getDataset).toHaveBeenCalledWith("dataset-2");
    expect(datasetsApi.getDataset).toHaveBeenCalledTimes(2);
  });

  it("no debe hacer fetch cuando datasetId es null", () => {
    // Arrange & Act
    renderHook(() => useDataset(null));

    // Assert
    expect(datasetsApi.getDataset).not.toHaveBeenCalled();
  });

  it("no debe recargar si datasetId es null", () => {
    // Arrange
    const { result } = renderHook(() => useDataset(null));

    // Act
    result.current.reload();

    // Assert
    expect(datasetsApi.getDataset).not.toHaveBeenCalled();
  });
});
