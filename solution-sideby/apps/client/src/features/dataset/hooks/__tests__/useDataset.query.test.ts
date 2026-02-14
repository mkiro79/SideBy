/**
 * Tests para useDataset Hook (con React Query)
 *
 * Verifica la migraciÃ³n correcta a React Query:
 * - Carga de dataset individual por ID
 * - Query deshabilitada cuando datasetId es null
 * - Manejo de errores
 * - Cache automÃ¡tico por ID
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDataset } from "../useDataset.js";
import { createQueryClientWrapper } from "@/test/utils/react-query.js";
import * as api from "../../services/datasets.api.js";
import type { Dataset } from "../../types/api.types.js";

describe("useDataset (con React Query)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe cargar dataset por ID correctamente", async () => {
    const mockDataset: Dataset = {
      id: "123",
      meta: {
        name: "Test Dataset",
        description: "A test dataset",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      status: "ready",
      ownerId: "user123",
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
      data: [],
    };

    vi.spyOn(api, "getDataset").mockResolvedValue(mockDataset);

    const { result } = renderHook(() => useDataset("123"), {
      wrapper: createQueryClientWrapper(),
    });

    // Estado inicial: loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.dataset).toBeNull();

    // Esperar a que cargue
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Datos cargados
    expect(result.current.dataset).toEqual(mockDataset);
    expect(result.current.error).toBeNull();
    expect(api.getDataset).toHaveBeenCalledWith("123");
  });

  it("NO debe hacer fetch si datasetId es null", () => {
    const spy = vi.spyOn(api, "getDataset");

    const { result } = renderHook(() => useDataset(null), {
      wrapper: createQueryClientWrapper(),
    });

    // Query estÃ¡ deshabilitada
    expect(result.current.isLoading).toBe(false);
    expect(result.current.dataset).toBeNull();

    // No debe llamar a la API
    expect(spy).not.toHaveBeenCalled();
  });

  it("debe manejar errores correctamente", async () => {
    const errorMessage = "Dataset not found";
    vi.spyOn(api, "getDataset").mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useDataset("999"), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.dataset).toBeNull();
  });

  it("debe poder recargar dataset manualmente con reload()", async () => {
    const mockDataset: Dataset = {
      id: "123",
      meta: {
        name: "Test",
        description: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: "ready",
      ownerId: "user1",
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
      data: [],
    };

    const spy = vi.spyOn(api, "getDataset").mockResolvedValue(mockDataset);

    const { result } = renderHook(() => useDataset("123"), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(spy).toHaveBeenCalledTimes(1);

    // Recargar manualmente
    await result.current.reload();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  it("debe cachear datasets por ID (diferentes IDs = diferentes queries)", async () => {
    const mockDataset1: Dataset = {
      id: "1",
      meta: {
        name: "Dataset 1",
        description: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: "ready",
      ownerId: "user1",
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
      data: [],
    };

    const mockDataset2: Dataset = {
      id: "2",
      meta: {
        name: "Dataset 2",
        description: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: "ready",
      ownerId: "user1",
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
      data: [],
    };

    const spy = vi.spyOn(api, "getDataset").mockImplementation((id: string) => {
      if (id === "1") return Promise.resolve(mockDataset1);
      if (id === "2") return Promise.resolve(mockDataset2);
      return Promise.reject(new Error("Not found"));
    });

    const wrapper = createQueryClientWrapper();

    // Cargar dataset 1
    const { result: result1 } = renderHook(() => useDataset("1"), { wrapper });
    await waitFor(() => expect(result1.current.isLoading).toBe(false));

    // Cargar dataset 2
    const { result: result2 } = renderHook(() => useDataset("2"), { wrapper });
    await waitFor(() => expect(result2.current.isLoading).toBe(false));

    // Debe haber llamado DOS veces (diferentes queryKeys)
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith("1");
    expect(spy).toHaveBeenCalledWith("2");
  });
});
