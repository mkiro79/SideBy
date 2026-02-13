/**
 * Tests para useDatasetMapping hook
 *
 * Verifica que el hook maneja correctamente la actualización de mapping
 * del dataset (FASE 2 del wizard).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDatasetMapping } from "../useDatasetMapping.js";
import * as datasetsApi from "../../services/datasets.api.js";
import type {
  UpdateMappingRequest,
  UpdateMappingResponse,
} from "../../types/api.types.js";

// Mock del servicio de API
vi.mock("../../services/datasets.api.js", () => ({
  updateMapping: vi.fn(),
}));

describe("useDatasetMapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe tener estado inicial correcto", () => {
    // Arrange & Act
    const { result } = renderHook(() => useDatasetMapping());

    // Assert
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.update).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });

  it("debe actualizar mapping exitosamente", async () => {
    // Arrange
    const datasetId = "dataset-123";
    const request: UpdateMappingRequest = {
      meta: {
        name: "Mi Dataset",
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
    };

    const mockResponse: UpdateMappingResponse["data"] = {
      datasetId: "dataset-123",
      status: "ready",
    };

    vi.mocked(datasetsApi.updateMapping).mockResolvedValue({
      success: true,
      data: mockResponse,
    });

    const { result } = renderHook(() => useDatasetMapping());

    // Act
    const updatePromise = result.current.update(datasetId, request);

    const updatedData = await updatePromise;

    // Assert - Success state
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    expect(updatedData).toEqual(mockResponse);
    expect(datasetsApi.updateMapping).toHaveBeenCalledWith(datasetId, request);
  });

  it("debe manejar errores de validación del backend", async () => {
    // Arrange
    const datasetId = "dataset-123";
    const request: UpdateMappingRequest = {
      meta: { name: "" }, // Inválido
      schemaMapping: {
        dimensionField: "",
        kpiFields: [],
      },
      dashboardLayout: {
        templateId: "sideby_executive",
        highlightedKpis: [],
      },
    };

    const errorMessage = "Name is required";
    vi.mocked(datasetsApi.updateMapping).mockRejectedValue(
      new Error(errorMessage),
    );

    const { result } = renderHook(() => useDatasetMapping());

    // Act & Assert
    await expect(result.current.update(datasetId, request)).rejects.toThrow(
      errorMessage,
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it("debe resetear el estado correctamente", async () => {
    // Arrange
    const datasetId = "dataset-123";
    const request: UpdateMappingRequest = {
      meta: { name: "Test" },
      schemaMapping: {
        dimensionField: "Product",
        kpiFields: [],
      },
      dashboardLayout: {
        templateId: "sideby_executive",
        highlightedKpis: [],
      },
    };

    vi.mocked(datasetsApi.updateMapping).mockRejectedValue(
      new Error("Test error"),
    );

    const { result } = renderHook(() => useDatasetMapping());

    // Act - Generar error
    await expect(result.current.update(datasetId, request)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe("Test error");
    });

    // Act - Reset
    result.current.reset();

    // Assert - Esperar a que el estado se actualice
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
