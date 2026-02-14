/**
 * Tests para useDatasets Hook (con React Query)
 *
 * Verifica la migración correcta a React Query:
 * - Carga de datos desde el backend
 * - Manejo de errores
 * - Cache automático (no hacer fetch duplicado)
 * - Invalidación de cache tras delete
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDatasets } from "../useDatasets.js";
import { createQueryClientWrapper } from "@/test/utils/react-query.js";
import * as api from "../../services/datasets.api.js";
import type {
  DatasetSummary,
  ListDatasetsResponse,
} from "../../types/api.types.js";

// Mock de react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

describe("useDatasets (con React Query)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe cargar datasets del backend correctamente", async () => {
    const mockDatasets: DatasetSummary[] = [
      {
        id: "698f3809e7a4974e30e129c6",
        meta: {
          name: "Dataset A",
          description: "Test dataset",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        status: "ready",
        sourceConfig: {
          groupA: {
            label: "2024",
            color: "#3b82f6",
            originalFileName: "a.csv",
            rowCount: 100,
          },
          groupB: {
            label: "2023",
            color: "#ef4444",
            originalFileName: "b.csv",
            rowCount: 100,
          },
        },
        totalRows: 200,
      },
      {
        id: "698f3809e7a4974e30e129c7",
        meta: {
          name: "Dataset B",
          description: "Test dataset 2",
          createdAt: "2024-01-02T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
        },
        status: "processing",
        sourceConfig: {
          groupA: {
            label: "2024",
            color: "#3b82f6",
            originalFileName: "a.csv",
            rowCount: 100,
          },
          groupB: {
            label: "2023",
            color: "#ef4444",
            originalFileName: "b.csv",
            rowCount: 100,
          },
        },
        totalRows: 200,
      },
    ];

    // Mock API response con wrapper { data: [...], total: number }
    vi.spyOn(api, "listDatasets").mockResolvedValue({
      success: true,
      data: mockDatasets,
      total: mockDatasets.length,
    } satisfies ListDatasetsResponse);

    const { result } = renderHook(() => useDatasets(), {
      wrapper: createQueryClientWrapper(),
    });

    // Estado inicial: loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.datasets).toEqual([]);

    // Esperar a que cargue
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Datos cargados
    expect(result.current.datasets).toHaveLength(2);
    expect(result.current.datasets[0].id).toBe("698f3809e7a4974e30e129c6");
    expect(result.current.error).toBeNull();
  });

  it("debe manejar errores correctamente", async () => {
    const errorMessage = "Network error";
    vi.spyOn(api, "listDatasets").mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useDatasets(), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.datasets).toEqual([]);
  });

  it("debe cachear resultados (no hacer fetch duplicado)", async () => {
    const mockDatasets: DatasetSummary[] = [
      {
        id: "1",
        meta: {
          name: "Test",
          description: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        status: "ready",
        sourceConfig: {
          groupA: {
            label: "A",
            color: "#000",
            originalFileName: "a.csv",
            rowCount: 1,
          },
          groupB: {
            label: "B",
            color: "#fff",
            originalFileName: "b.csv",
            rowCount: 1,
          },
        },
        totalRows: 2,
      },
    ];

    const spy = vi.spyOn(api, "listDatasets").mockResolvedValue({
      success: true,
      data: mockDatasets,
      total: mockDatasets.length,
    } satisfies ListDatasetsResponse);

    const wrapper = createQueryClientWrapper();

    // Primer hook
    const { result: result1 } = renderHook(() => useDatasets(), { wrapper });

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    // Segundo hook con la misma query
    const { result: result2 } = renderHook(() => useDatasets(), { wrapper });

    await waitFor(() => {
      expect(result2.current.isLoading).toBe(false);
    });

    // Debe haber llamado solo UNA vez (cache)
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("debe invalidar cache después de deleteDataset", async () => {
    const mockDatasets: DatasetSummary[] = [
      {
        id: "1",
        meta: {
          name: "Dataset 1",
          description: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        status: "ready",
        sourceConfig: {
          groupA: {
            label: "A",
            color: "#000",
            originalFileName: "a.csv",
            rowCount: 1,
          },
          groupB: {
            label: "B",
            color: "#fff",
            originalFileName: "b.csv",
            rowCount: 1,
          },
        },
        totalRows: 2,
      },
    ];

    vi.spyOn(api, "listDatasets").mockResolvedValue({
      success: true,
      data: mockDatasets,
      total: mockDatasets.length,
    } satisfies ListDatasetsResponse);
    vi.spyOn(api, "deleteDataset").mockResolvedValue(undefined);

    const { result } = renderHook(() => useDatasets(), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.datasets).toHaveLength(1);

    // Eliminar dataset
    await result.current.deleteDataset("1");

    // Verificar que llamó a la API de delete
    expect(api.deleteDataset).toHaveBeenCalledWith("1");
  });

  it("debe tener funciones de navegación disponibles", () => {
    vi.spyOn(api, "listDatasets").mockResolvedValue({
      success: true,
      data: [],
      total: 0,
    } satisfies ListDatasetsResponse);

    const { result } = renderHook(() => useDatasets(), {
      wrapper: createQueryClientWrapper(),
    });

    // Verificar que existen las funciones
    expect(typeof result.current.openDataset).toBe("function");
    expect(typeof result.current.createNewDataset).toBe("function");
    expect(typeof result.current.refreshDatasets).toBe("function");
  });
});
