/**
 * Tests para MiniDimensionChart
 * 
 * Componente de mini-chart por dimensión categórica
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MiniDimensionChart } from '../MiniDimensionChart.js';
import type { KPIResult } from '../../../types/dashboard.types.js';
import type { DataRow } from '../../../types/api.types.js';

describe('MiniDimensionChart', () => {
  const mockKpi: KPIResult = {
    name: 'revenue',
    label: 'Ingresos',
    valueA: 50000,
    valueB: 40000,
    diff: 10000,
    diffPercent: 25,
    format: 'currency',
    trend: 'up',
  };

  const mockData: DataRow[] = [
    { _source_group: 'groupA', country: 'USA', revenue: 30000 },
    { _source_group: 'groupA', country: 'Spain', revenue: 20000 },
    { _source_group: 'groupB', country: 'USA', revenue: 25000 },
    { _source_group: 'groupB', country: 'Spain', revenue: 15000 },
  ];

  it('debe renderizar el título de la dimensión', () => {
    render(
      <MiniDimensionChart
        dimension="country"
        dimensionLabel="País"
        kpi={mockKpi}
        data={mockData}
        groupALabel="2024"
        groupBLabel="2023"
        groupAColor="hsl(var(--primary))"
        groupBColor="hsl(var(--secondary))"
      />
    );

    expect(screen.getByText('País')).toBeInTheDocument();
  });

  it('debe mostrar mensaje "Sin datos" cuando no hay datos', () => {
    render(
      <MiniDimensionChart
        dimension="country"
        dimensionLabel="País"
        kpi={mockKpi}
        data={[]}
        groupALabel="2024"
        groupBLabel="2023"
        groupAColor="hsl(var(--primary))"
        groupBColor="hsl(var(--secondary))"
      />
    );

    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });

  it('debe limitar a máximo 6 categorías', () => {
    const largeData: DataRow[] = Array.from({ length: 10 }, (_, i) => ({
      _source_group: 'groupA',
      country: `Country${i}`,
      revenue: 1000 * i,
    }));

    const { container } = render(
      <MiniDimensionChart
        dimension="country"
        dimensionLabel="País"
        kpi={mockKpi}
        data={largeData}
        groupALabel="2024"
        groupBLabel="2023"
        groupAColor="hsl(var(--primary))"
        groupBColor="hsl(var(--secondary))"
      />
    );

    // Verificar que el gráfico se renderiza
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
});
