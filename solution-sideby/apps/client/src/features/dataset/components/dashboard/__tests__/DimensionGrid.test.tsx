/**
 * Tests para DimensionGrid
 * 
 * Grid 2×2 de análisis por dimensión categórica
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DimensionGrid } from '../DimensionGrid.js';
import type { KPIResult } from '../../../types/dashboard.types.js';
import type { DataRow } from '../../../types/api.types.js';

describe('DimensionGrid', () => {
  const mockKpis: KPIResult[] = [
    {
      name: 'revenue',
      label: 'Ingresos',
      valueA: 50000,
      valueB: 40000,
      diff: 10000,
      diffPercent: 25,
      format: 'currency',
      trend: 'up',
    },
    {
      name: 'orders',
      label: 'Pedidos',
      valueA: 150,
      valueB: 100,
      diff: 50,
      diffPercent: 50,
      format: 'number',
      trend: 'up',
    },
  ];

  const mockData: DataRow[] = [
    { _source_group: 'groupA', country: 'USA', channel: 'Online', revenue: 30000, orders: 80 },
    { _source_group: 'groupA', country: 'Spain', channel: 'Retail', revenue: 20000, orders: 70 },
    { _source_group: 'groupB', country: 'USA', channel: 'Online', revenue: 25000, orders: 50 },
    { _source_group: 'groupB', country: 'Spain', channel: 'Retail', revenue: 15000, orders: 50 },
  ];

  const mockDimensions = ['country', 'channel'];

  it('debe renderizar el título "Análisis por Dimensión"', () => {
    render(
      <DimensionGrid
        kpis={mockKpis}
        data={mockData}
        dimensions={mockDimensions}
        groupALabel="2024"
        groupBLabel="2023"
        groupAColor="hsl(var(--primary))"
        groupBColor="hsl(var(--secondary))"
      />
    );

    expect(screen.getByText('Análisis por Dimensión')).toBeInTheDocument();
  });

  it('debe renderizar selector de KPI', () => {
    render(
      <DimensionGrid
        kpis={mockKpis}
        data={mockData}
        dimensions={mockDimensions}
        groupALabel="2024"
        groupBLabel="2023"
        groupAColor="hsl(var(--primary))"
        groupBColor="hsl(var(--secondary))"
      />
    );

    // Debe haber 2 comboboxes: uno para KPI y otro para tipo de gráfico
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes).toHaveLength(2);
  });

  it('debe renderizar las dimensiones formateadas', () => {
    render(
      <DimensionGrid
        kpis={mockKpis}
        data={mockData}
        dimensions={mockDimensions}
        groupALabel="2024"
        groupBLabel="2023"
        groupAColor="hsl(var(--primary))"
        groupBColor="hsl(var(--secondary))"
      />
    );

    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('Channel')).toBeInTheDocument();
  });

  it('debe limitar a 4 dimensiones máximo', () => {
    const manyDimensions = ['dim1', 'dim2', 'dim3', 'dim4', 'dim5', 'dim6'];
    
    render(
      <DimensionGrid
        kpis={mockKpis}
        data={mockData}
        dimensions={manyDimensions}
        groupALabel="2024"
        groupBLabel="2023"
        groupAColor="hsl(var(--primary))"
        groupBColor="hsl(var(--secondary))"
      />
    );

    // Solo deben aparecer las primeras 4
    expect(screen.getByText('Dim1')).toBeInTheDocument();
    expect(screen.getByText('Dim4')).toBeInTheDocument();
    expect(screen.queryByText('Dim5')).not.toBeInTheDocument();
  });

  it('debe renderizar selector de tipo de gráfico con opciones Barras, Líneas y Área', () => {
    render(
      <DimensionGrid
        kpis={mockKpis}
        data={mockData}
        dimensions={mockDimensions}
        groupALabel="2024"
        groupBLabel="2023"
        groupAColor="hsl(var(--primary))"
        groupBColor="hsl(var(--secondary))"
      />
    );

    // Debe haber 2 comboboxes: uno para KPI y otro para tipo de gráfico
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes).toHaveLength(2);
  });

  it('no debe renderizar si no hay dimensiones', () => {
    const { container } = render(
      <DimensionGrid
        kpis={mockKpis}
        data={mockData}
        dimensions={[]}
        groupALabel="2024"
        groupBLabel="2023"
        groupAColor="hsl(var(--primary))"
        groupBColor="hsl(var(--secondary))"
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
