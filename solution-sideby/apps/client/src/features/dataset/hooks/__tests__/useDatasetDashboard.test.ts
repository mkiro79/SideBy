/**
 * Tests para useDatasetDashboard hook
 *
 * Verifica cálculo de KPIs, aplicación de filtros y detección de campos categóricos.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDatasetDashboard } from "../useDatasetDashboard.js";
import { useDataset } from "../useDataset.js";
import type { Dataset } from "../../types/api.types.js";
import type { DashboardTemplateId } from "../../types/dashboard.types.js";

vi.mock("../useDataset.js", () => ({
  useDataset: vi.fn(),
}));

type HookParams = {
  datasetId: string | null;
  templateId: DashboardTemplateId;
  filters: {
    categorical: Record<string, string[]>; // ✅ Multi-select (arrays)
  };
};

const mockDataset: Dataset = {
  id: "dataset-1",
  ownerId: "owner-1",
  status: "ready",
  meta: {
    name: "Dataset Test",
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
  },
  sourceConfig: {
    groupA: {
      label: "Grupo A",
      color: "#3B82F6",
      originalFileName: "a.csv",
      rowCount: 2,
    },
    groupB: {
      label: "Grupo B",
      color: "#F97316",
      originalFileName: "b.csv",
      rowCount: 2,
    },
  },
  schemaMapping: {
    dimensionField: "region",
    kpiFields: [
      {
        id: "kpi_revenue",
        columnName: "revenue",
        label: "Ingresos",
        format: "currency",
      },
      {
        id: "kpi_orders",
        columnName: "orders",
        label: "Órdenes",
        format: "number",
      },
    ],
    categoricalFields: ["region", "channel"],
  },
  dashboardLayout: {
    templateId: "sideby_executive",
    highlightedKpis: ["revenue"], // FIX: Debe contener columnName, no id
  },
  data: [
    {
      _source_group: "groupA",
      revenue: 100,
      orders: 10,
      region: "north",
      channel: "web",
    },
    {
      _source_group: "groupA",
      revenue: 200,
      orders: 20,
      region: "south",
      channel: "retail",
    },
    {
      _source_group: "groupB",
      revenue: 80,
      orders: 8,
      region: "north",
      channel: "web",
    },
    {
      _source_group: "groupB",
      revenue: 120,
      orders: 12,
      region: "south",
      channel: "retail",
    },
  ],
};

describe("useDatasetDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDataset).mockReturnValue({
      dataset: mockDataset,
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
  });

  const renderUseDatasetDashboard = (params: Partial<HookParams> = {}) => {
    const defaultParams: HookParams = {
      datasetId: "dataset-1",
      templateId: "sideby_detailed",
      filters: { categorical: {} },
    };

    return renderHook(() =>
      useDatasetDashboard({ ...defaultParams, ...params }),
    );
  };

  it("debe calcular KPIs con suma, diferencia y porcentaje", () => {
    const { result } = renderUseDatasetDashboard({
      templateId: "sideby_detailed",
    });

    const revenueKpi = result.current.kpis.find(
      (kpi) => kpi.name === "revenue",
    );
    expect(revenueKpi).toBeDefined();
    expect(revenueKpi?.valueA).toBe(300);
    expect(revenueKpi?.valueB).toBe(200);
    // Delta = B - A = 200 - 300 = -100 (crecimiento negativo desde A hacia B)
    expect(revenueKpi?.diff).toBe(-100);
    // Porcentaje = (-100 / 300) * 100 = -33.33%
    expect(revenueKpi?.diffPercent).toBeCloseTo(-33.33, 1);
    expect(revenueKpi?.trend).toBe("down");
  });

  it("debe aplicar filtros categóricos (single-select legacy)", () => {
    const { result } = renderUseDatasetDashboard({
      filters: { categorical: { region: ["north"] } }, // ✅ Array con un solo valor
    });

    expect(result.current.filteredData).toHaveLength(2);
    expect(
      result.current.filteredData.every((row) => row.region === "north"),
    ).toBe(true);

    const revenueKpi = result.current.kpis.find(
      (kpi) => kpi.name === "revenue",
    );
    expect(revenueKpi?.valueA).toBe(100);
    expect(revenueKpi?.valueB).toBe(80);
  });

  // ===== MULTI-SELECT FILTERS TESTS (RFC-005) =====

  it("[RFC-005] debe filtrar con múltiples valores en una dimensión (OR logic)", () => {
    const { result } = renderUseDatasetDashboard({
      filters: { categorical: { region: ["north", "south"] } }, // ✅ Multi-select
    });

    // Debe incluir filas de north Y south (OR logic dentro de la misma dimensión)
    expect(result.current.filteredData).toHaveLength(4); // Todas las filas
    expect(
      result.current.filteredData.every((row) =>
        ["north", "south"].includes(row.region as string),
      ),
    ).toBe(true);
  });

  it("[RFC-005] debe retornar todos los datos cuando el array de filtros está vacío", () => {
    const { result } = renderUseDatasetDashboard({
      filters: { categorical: { region: [] } }, // ✅ Array vacío = no filtrar
    });

    // Debe incluir todas las filas (4 filas en total)
    expect(result.current.filteredData).toHaveLength(4);
  });

  it("[RFC-005] debe aplicar AND logic entre diferentes dimensiones", () => {
    const { result } = renderUseDatasetDashboard({
      filters: {
        categorical: {
          region: ["north"], // Solo north
          channel: ["web"], // Y solo web
        },
      },
    });

    // Debe retornar solo las filas que cumplen AMBAS condiciones
    expect(result.current.filteredData).toHaveLength(2);
    expect(
      result.current.filteredData.every(
        (row) => row.region === "north" && row.channel === "web",
      ),
    ).toBe(true);
  });

  it("[RFC-005] debe aplicar multi-select en múltiples dimensiones correctamente", () => {
    const { result } = renderUseDatasetDashboard({
      filters: {
        categorical: {
          region: ["north", "south"], // north O south
          channel: ["web"], // Y web
        },
      },
    });

    // Debe retornar filas de (north O south) Y web
    expect(result.current.filteredData).toHaveLength(2); // north+web, south NO (porque south tiene channel=retail)
    expect(
      result.current.filteredData.every((row) => row.channel === "web"),
    ).toBe(true);
  });

  it("[RFC-005] debe calcular KPIs correctamente con filtros multi-select aplicados", () => {
    const { result } = renderUseDatasetDashboard({
      filters: { categorical: { region: ["south"] } },
    });

    const revenueKpi = result.current.kpis.find(
      (kpi) => kpi.name === "revenue",
    );

    // Solo filas de south: groupA=200, groupB=120
    expect(revenueKpi?.valueA).toBe(200);
    expect(revenueKpi?.valueB).toBe(120);
    // Delta = B - A = 120 - 200 = -80 (crecimiento negativo)
    expect(revenueKpi?.diff).toBe(-80);
    // Porcentaje = (-80 / 200) * 100 = -40%
    expect(revenueKpi?.diffPercent).toBeCloseTo(-40, 1);
  });

  it("debe detectar campos categóricos excluyendo _source_group", () => {
    const { result } = renderUseDatasetDashboard();

    expect(result.current.categoricalFields).toContain("region");
    expect(result.current.categoricalFields).toContain("channel");
    expect(result.current.categoricalFields).not.toContain("_source_group");
  });

  it("debe retornar arrays vacíos cuando no hay dataset", () => {
    vi.mocked(useDataset).mockReturnValue({
      dataset: null,
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    const { result } = renderUseDatasetDashboard();

    expect(result.current.dataset).toBeNull();
    expect(result.current.kpis).toEqual([]);
    expect(result.current.filteredData).toEqual([]);
    expect(result.current.categoricalFields).toEqual([]);
  });
});
