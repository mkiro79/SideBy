import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/utils/react-query.js";
import { useDatasetInsights } from "../useDatasetInsights.js";
import * as api from "../../services/datasets.api.js";
import type { DashboardFilters } from "../../types/dashboard.types.js";
import type { DatasetInsightsResponse } from "../../types/api.types.js";

describe("useDatasetInsights", () => {
  const filters: DashboardFilters = { categorical: {} };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no debe ejecutar query por defecto", () => {
    const spy = vi.spyOn(api, "getDatasetInsights");

    const { result } = renderHook(
      () => useDatasetInsights("dataset-1", filters),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it("debe ejecutar query cuando enabled=true", async () => {
    const mockResponse: DatasetInsightsResponse = {
      insights: [
        {
          id: "insight-1",
          datasetId: "dataset-1",
          type: "summary",
          severity: 1,
          icon: "💡",
          title: "Resumen general",
          message: "Los KPIs mejoraron 12%",
          metadata: { change: 12 },
          generatedBy: "rule-engine",
          confidence: 1,
          generatedAt: new Date().toISOString(),
        },
      ],
      meta: {
        total: 1,
        generatedAt: new Date().toISOString(),
        cacheStatus: "miss",
        generationSource: "rule-engine",
        generationTimeMs: 120,
      },
    };

    const spy = vi
      .spyOn(api, "getDatasetInsights")
      .mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useDatasetInsights("dataset-1", filters, { enabled: true }),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(spy).toHaveBeenCalledWith("dataset-1", filters);
  });

  it("debe permitir fetch manual con trigger", async () => {
    const mockResponse: DatasetInsightsResponse = {
      insights: [],
      meta: {
        total: 0,
        generatedAt: new Date().toISOString(),
        cacheStatus: "hit",
        generationSource: "rule-engine",
        generationTimeMs: 20,
      },
    };

    const spy = vi
      .spyOn(api, "getDatasetInsights")
      .mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useDatasetInsights("dataset-1", filters),
      { wrapper: createQueryClientWrapper() },
    );

    expect(spy).not.toHaveBeenCalled();

    await result.current.fetchInsights();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    expect(result.current.data).toEqual(mockResponse);
  });
});
