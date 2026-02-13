/**
 * Tests para useDatasetUpload hook
 *
 * Verifica que el hook maneja correctamente el upload de archivos,
 * estados de loading, errores y la integración con el servicio de API.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDatasetUpload } from "../useDatasetUpload.js";
import * as datasetsApi from "../../services/datasets.api.js";
import type { UploadFilesResponse } from "../../types/api.types.js";

// Mock del servicio de API
vi.mock("../../services/datasets.api.js", () => ({
  uploadFiles: vi.fn(),
}));

describe("useDatasetUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe tener estado inicial correcto", () => {
    // Arrange & Act
    const { result } = renderHook(() => useDatasetUpload());

    // Assert
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.upload).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });

  it("debe subir archivos exitosamente", async () => {
    // Arrange
    const fileA = new File(["content-a"], "fileA.csv", { type: "text/csv" });
    const fileB = new File(["content-b"], "fileB.csv", { type: "text/csv" });

    const mockResponse: UploadFilesResponse["data"] = {
      datasetId: "dataset-123",
      status: "processing",
      rowCount: 100,
      groupA: { fileName: "fileA.csv", rowCount: 50 },
      groupB: { fileName: "fileB.csv", rowCount: 50 },
    };

    vi.mocked(datasetsApi.uploadFiles).mockResolvedValue({
      success: true,
      data: mockResponse,
    });

    const { result } = renderHook(() => useDatasetUpload());

    // Act
    const uploadPromise = result.current.upload({ fileA, fileB });
    const uploadedData = await uploadPromise;

    // Assert - Success state
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    expect(uploadedData).toEqual(mockResponse);
    expect(datasetsApi.uploadFiles).toHaveBeenCalledWith({ fileA, fileB });
    expect(datasetsApi.uploadFiles).toHaveBeenCalledTimes(1);
  });

  it("debe manejar errores de upload correctamente", async () => {
    // Arrange
    const fileA = new File([""], "empty.csv");
    const fileB = new File([""], "empty.csv");

    const errorMessage = "Files too large";
    vi.mocked(datasetsApi.uploadFiles).mockRejectedValue(
      new Error(errorMessage),
    );

    const { result } = renderHook(() => useDatasetUpload());

    // Act & Assert
    await expect(result.current.upload({ fileA, fileB })).rejects.toThrow(
      errorMessage,
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it('debe manejar errores sin mensaje como "Error desconocido"', async () => {
    // Arrange
    const fileA = new File([""], "file.csv");
    const fileB = new File([""], "file.csv");

    vi.mocked(datasetsApi.uploadFiles).mockRejectedValue(
      "String error", // No es una instancia de Error
    );

    const { result } = renderHook(() => useDatasetUpload());

    // Act
    await expect(result.current.upload({ fileA, fileB })).rejects.toBeDefined();

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe("Error desconocido");
    });
  });

  it("debe resetear el estado correctamente", async () => {
    // Arrange
    const fileA = new File([""], "file.csv");
    const fileB = new File([""], "file.csv");

    vi.mocked(datasetsApi.uploadFiles).mockRejectedValue(
      new Error("Test error"),
    );

    const { result } = renderHook(() => useDatasetUpload());

    // Act - Generar error
    await expect(result.current.upload({ fileA, fileB })).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe("Test error");
    });

    // Act - Reset con waitFor para esperar actualización de estado
    result.current.reset();

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it("debe mantener isLoading=true durante el proceso de upload", async () => {
    // Arrange
    const fileA = new File(["content"], "file.csv");
    const fileB = new File(["content"], "file.csv");

    vi.mocked(datasetsApi.uploadFiles).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: {
                  datasetId: "dataset-123",
                  status: "processing",
                  rowCount: 100,
                  groupA: { fileName: "fileA.csv", rowCount: 50 },
                  groupB: { fileName: "fileB.csv", rowCount: 50 },
                },
              }),
            50,
          ),
        ),
    );

    const { result } = renderHook(() => useDatasetUpload());

    // Act - Iniciar upload (no esperar)
    const uploadPromise = result.current.upload({ fileA, fileB });

    // Assert - Debe estar en loading
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(true);
      },
      { timeout: 100 },
    );

    // Esperar a que termine
    await uploadPromise;

    // Assert - Ya no debe estar en loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
