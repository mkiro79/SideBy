/**
 * Tests para useDatasetDashboard hook
 *
 * Verifica cálculo de KPIs, aplicación de filtros y detección de campos categóricos.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDatasetDashboard } from '../useDatasetDashboard.js';
import { useDataset } from '../useDataset.js';
import type { Dataset } from '../../types/api.types.js';
import type { DashboardTemplateId } from '../../types/dashboard.types.js';

vi.mock('../useDataset.js', () => ({
  useDataset: vi.fn(),
}));

type HookParams = {
  datasetId: string | null;
  templateId: DashboardTemplateId;
  filters: {
    categorical: Record<string, string>;
  };
};

const mockDataset: Dataset = {
  id: 'dataset-1',
  ownerId: 'owner-1',
  status: 'ready',
  meta: {
    name: 'Dataset Test',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  sourceConfig: {
    groupA: {
      label: 'Grupo A',
      color: '#3B82F6',
      originalFileName: 'a.csv',
      rowCount: 2,
    },
    groupB: {
      label: 'Grupo B',
      color: '#F97316',
      originalFileName: 'b.csv',
      rowCount: 2,
    },
  },
  schemaMapping: {
    dimensionField: 'region',
    kpiFields: [
      {
        id: 'kpi_revenue',
        columnName: 'revenue',
        label: 'Ingresos',
        format: 'currency',
      },
      {
        id: 'kpi_orders',
        columnName: 'orders',
        label: 'Órdenes',
        format: 'number',
      },
    ],
    categoricalFields: ['region', 'channel'],
  },
  dashboardLayout: {
    templateId: 'sideby_executive',
    highlightedKpis: ['kpi_revenue'],
  },
  data: [
    { _source_group: 'groupA', revenue: 100, orders: 10, region: 'north', channel: 'web' },
    { _source_group: 'groupA', revenue: 200, orders: 20, region: 'south', channel: 'retail' },
    { _source_group: 'groupB', revenue: 80, orders: 8, region: 'north', channel: 'web' },
    { _source_group: 'groupB', revenue: 120, orders: 12, region: 'south', channel: 'retail' },
  ],
};

describe('useDatasetDashboard', () => {
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
      datasetId: 'dataset-1',
      templateId: 'sideby_detailed',
      filters: { categorical: {} },
    };

    return renderHook(() => useDatasetDashboard({ ...defaultParams, ...params }));
  };

  it('debe calcular KPIs con suma, diferencia y porcentaje', () => {
    const { result } = renderUseDatasetDashboard({ templateId: 'sideby_detailed' });

    const revenueKpi = result.current.kpis.find((kpi) => kpi.name === 'revenue');
    expect(revenueKpi).toBeDefined();
    expect(revenueKpi?.valueA).toBe(300);
    expect(revenueKpi?.valueB).toBe(200);
    expect(revenueKpi?.diff).toBe(100);
    expect(revenueKpi?.diffPercent).toBe(50);
    expect(revenueKpi?.trend).toBe('up');
  });

  it('debe aplicar filtros categóricos', () => {
    const { result } = renderUseDatasetDashboard({
      filters: { categorical: { region: 'north' } },
    });

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.every((row) => row.region === 'north')).toBe(true);

    const revenueKpi = result.current.kpis.find((kpi) => kpi.name === 'revenue');
    expect(revenueKpi?.valueA).toBe(100);
    expect(revenueKpi?.valueB).toBe(80);
  });

  it('debe detectar campos categóricos excluyendo _source_group', () => {
    const { result } = renderUseDatasetDashboard();

    expect(result.current.categoricalFields).toContain('region');
    expect(result.current.categoricalFields).toContain('channel');
    expect(result.current.categoricalFields).not.toContain('_source_group');
  });

  it('debe retornar arrays vacíos cuando no hay dataset', () => {
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
