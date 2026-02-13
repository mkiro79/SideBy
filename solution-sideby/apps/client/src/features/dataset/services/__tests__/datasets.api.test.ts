/**
 * Tests para datasets.api.ts
 *
 * Suite de tests unitarios para el servicio de API de datasets.
 * Verifica que las funciones de API construyan correctamente las requests
 * y manejen las responses del backend.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import type {
  UploadFilesRequest,
  UpdateMappingRequest,
} from "../../types/api.types.js";

// Mock de axios
vi.mock("axios", () => {
  const mockAxiosInstance = {
    post: vi.fn(),
    patch: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn((error) => {
        return error && error.response !== undefined;
      }),
    },
  };
});

// Importar después del mock
import axios from "axios";
import {
  uploadFiles,
  updateMapping,
  getDataset,
  listDatasets,
  deleteDataset,
} from "../../services/datasets.api.js";

describe("datasets.api", () => {
  let mockAxiosInstance: {
    post: Mock;
    patch: Mock;
    get: Mock;
    delete: Mock;
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Get mock instance
    mockAxiosInstance = (axios.create as Mock)();

    // Mock localStorage con token válido
    const mockAuthStorage = {
      state: {
        token: "test-jwt-token-123",
      },
    };
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify(mockAuthStorage),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("uploadFiles", () => {
    it("debe enviar FormData con los archivos correctamente", async () => {
      // Arrange
      const fileA = new File(["content-a"], "fileA.csv", { type: "text/csv" });
      const fileB = new File(["content-b"], "fileB.csv", { type: "text/csv" });
      const request: UploadFilesRequest = { fileA, fileB };

      const mockResponse = {
        data: {
          success: true,
          data: {
            datasetId: "dataset-123",
            status: "processing",
            rowCount: 100,
            groupA: { fileName: "fileA.csv", rowCount: 50 },
            groupB: { fileName: "fileB.csv", rowCount: 50 },
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Act
      const result = await uploadFiles(request);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/v1/datasets",
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "multipart/form-data",
          }),
        }),
      );

      // Verificar que FormData contiene los archivos
      const formDataCall = mockAxiosInstance.post.mock.calls[0][1] as FormData;
      expect(formDataCall.get("fileA")).toBe(fileA);
      expect(formDataCall.get("fileB")).toBe(fileB);

      expect(result).toEqual(mockResponse.data);
    });

    it("debe lanzar error cuando el backend retorna error", async () => {
      // Arrange
      const fileA = new File([""], "empty.csv");
      const fileB = new File([""], "empty.csv");
      const request: UploadFilesRequest = { fileA, fileB };

      const mockError = {
        response: {
          data: {
            success: false,
            error: "Files too large",
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      // Act & Assert
      await expect(uploadFiles(request)).rejects.toThrow("Files too large");
    });
  });

  describe("updateMapping", () => {
    it("debe enviar JSON con la configuración de mapping", async () => {
      // Arrange
      const datasetId = "dataset-123";
      const request: UpdateMappingRequest = {
        meta: {
          name: "Mi Dataset",
          description: "Descripción del dataset",
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

      const mockResponse = {
        data: {
          success: true,
          data: {
            datasetId: "dataset-123",
            status: "ready",
          },
        },
      };

      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await updateMapping(datasetId, request);

      // Assert
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `/api/v1/datasets/${datasetId}`,
        request,
      );

      expect(result).toEqual(mockResponse.data);
    });

    it("debe manejar errores de validación del backend", async () => {
      // Arrange
      const datasetId = "dataset-123";
      const request: UpdateMappingRequest = {
        meta: { name: "" }, // Nombre vacío inválido
        schemaMapping: {
          dimensionField: "Product",
          kpiFields: [],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
      };

      const mockError = {
        response: {
          data: {
            success: false,
            error: "Name is required",
          },
        },
      };

      mockAxiosInstance.patch.mockRejectedValue(mockError);

      // Act & Assert
      await expect(updateMapping(datasetId, request)).rejects.toThrow(
        "Name is required",
      );
    });
  });

  describe("getDataset", () => {
    it("debe obtener un dataset por ID", async () => {
      // Arrange
      const datasetId = "dataset-123";
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: "dataset-123",
            ownerId: "user-456",
            status: "ready",
            meta: {
              name: "Mi Dataset",
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
            data: [],
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await getDataset(datasetId);

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/v1/datasets/${datasetId}`,
      );

      expect(result).toEqual(mockResponse.data.data);
    });

    it("debe lanzar error cuando el dataset no existe", async () => {
      // Arrange
      const datasetId = "non-existent";
      const mockError = {
        response: {
          data: {
            success: false,
            error: "Dataset not found",
          },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(getDataset(datasetId)).rejects.toThrow("Dataset not found");
    });
  });

  describe("listDatasets", () => {
    it("debe obtener la lista de datasets del usuario", async () => {
      // Arrange
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: "dataset-1",
              status: "ready",
              meta: {
                name: "Dataset 1",
                createdAt: "2026-02-13T10:00:00Z",
              },
              sourceConfig: {
                groupA: { fileName: "fileA1.csv" },
                groupB: { fileName: "fileB1.csv" },
              },
            },
            {
              id: "dataset-2",
              status: "processing",
              meta: {
                name: "Dataset 2",
                createdAt: "2026-02-13T11:00:00Z",
              },
              sourceConfig: {
                groupA: { fileName: "fileA2.csv" },
                groupB: { fileName: "fileB2.csv" },
              },
            },
          ],
          total: 2,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await listDatasets();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/v1/datasets");
      expect(result).toEqual(mockResponse.data);
    });

    it("debe retornar lista vacía cuando el usuario no tiene datasets", async () => {
      // Arrange
      const mockResponse = {
        data: {
          success: true,
          data: [],
          total: 0,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await listDatasets();

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("deleteDataset", () => {
    it("debe eliminar un dataset correctamente", async () => {
      // Arrange
      const datasetId = "dataset-123";
      const mockResponse = {
        data: {
          success: true,
          message: "Dataset deleted successfully",
        },
      };

      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      // Act
      await deleteDataset(datasetId);

      // Assert
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        `/api/v1/datasets/${datasetId}`,
      );
    });

    it("debe lanzar error cuando falla la eliminación", async () => {
      // Arrange
      const datasetId = "dataset-123";
      const mockError = {
        response: {
          data: {
            success: false,
            error: "Cannot delete dataset in use",
          },
        },
      };

      mockAxiosInstance.delete.mockRejectedValue(mockError);

      // Act & Assert
      await expect(deleteDataset(datasetId)).rejects.toThrow(
        "Cannot delete dataset in use",
      );
    });
  });
});
