/**
 * Tests para useDatasetMapping hook
 *
 * Verifica que el hook maneja correctamente la actualización de mapping
 * del dataset usando React Query internamente.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDatasetMapping } from "../useDatasetMapping.js";
import { createQueryClientWrapper } from "@/test/utils/react-query.js";
import * as datasetsApi from "../../services/datasets.api.js";
import type {
  UpdateMappingRequest,
  Dataset,
} from "../../types/api.types.js";

// Mock del servicio de API
vi.mock("../../services/datasets.api.js", () => ({
  updateDataset: vi.fn(),
}));

describe("useDatasetMapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRequest: UpdateMappingRequest = {
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

  it("debe tener estado inicial correcto", () => {
    const { result } = renderHook(() => useDatasetMapping(), {
      wrapper: createQueryClientWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.update).toBe("function");
  });

  it("debe actualizar mapping exitosamente", async () => {
    const datasetId = "dataset-123";

    const mockResponse: Dataset = {
      id: datasetId,
      status: "ready",
    } as Dataset;

    vi.mocked(datasetsApi.updateDataset).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDatasetMapping(), {
      wrapper: createQueryClientWrapper(),
    });

    // Act
    const updatedData = await result.current.update(datasetId, mockRequest);

    // Assert
    expect(updatedData).toEqual({
      datasetId: "dataset-123",
      status: "ready",
    });

    expect(datasetsApi.updateDataset).toHaveBeenCalledWith(
      datasetId,
      mockRequest,
    );
  });

  it("debe manejar errores correctamente", async () => {
    const datasetId = "dataset-123";
    const errorMessage = "Validation failed";

    vi.mocked(datasetsApi.updateDataset).mockRejectedValue(
      new Error(errorMessage),
    );

    const { result } = renderHook(() => useDatasetMapping(), {
      wrapper: createQueryClientWrapper(),
    });

    // Act & Assert
    await expect(
      result.current.update(datasetId, mockRequest),
    ).rejects.toThrow(errorMessage);
  });
});
