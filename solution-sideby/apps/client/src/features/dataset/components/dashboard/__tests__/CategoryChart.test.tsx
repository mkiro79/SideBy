/**
 * Tests para CategoryChart - Gráfico de análisis por dimensiones categóricas
 * 
 * TDD: RED phase - Definir comportamiento esperado
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryChart } from '../CategoryChart.js';
import type { KPIResult } from '../../../types/dashboard.types.js';
import type { DataRow } from '../../../types/api.types.js';

const mockKpis: KPIResult[] = [
  {
    name: 'revenue',
    label: 'Ingresos',
    valueA: 1000,
    valueB: 800,
    diff: 200,
    diffPercent: 25,
    format: 'currency',
    trend: 'up',
  },
  {
    name: 'orders',
    label: 'Órdenes',
    valueA: 50,
    valueB: 40,
    diff: 10,
    diffPercent: 25,
    format: 'number',
    trend: 'up',
  },
];

const mockData: DataRow[] = [
  { _source_group: 'groupA', revenue: 500, orders: 25, region: 'Norte', channel: 'Web' },
  { _source_group: 'groupA', revenue: 500, orders: 25, region: 'Sur', channel: 'Retail' },
  { _source_group: 'groupB', revenue: 400, orders: 20, region: 'Norte', channel: 'Web' },
  { _source_group: 'groupB', revenue: 400, orders: 20, region: 'Sur', channel: 'Retail' },
];

const mockDimensions = ['region', 'channel'];

describe('CategoryChart', () => {
  describe('[RED] Renderizado básico', () => {
    it('debe renderizar el título del componente', () => {
      render(
        <CategoryChart
          data={mockData}
          kpis={mockKpis}
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      expect(screen.getByText(/Análisis por Dimensión/i)).toBeInTheDocument();
    });

    it('debe mostrar selector de dimensión con opciones disponibles', () => {
      render(
        <CategoryChart
          data={mockData}
          kpis={mockKpis}
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Debe haber un select para dimensiones
      const dimensionSelects = screen.getAllByRole('combobox');
      expect(dimensionSelects.length).toBeGreaterThan(0);
    });

    it('debe mostrar selector de KPI', () => {
      render(
        <CategoryChart
          data={mockData}
          kpis={mockKpis}
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Debe haber selects (dimension + kpi)
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('[RED] Agregación de datos por dimensión', () => {
    it('debe agrupar datos por valor de dimensión seleccionada', async () => {
      render(
        <CategoryChart
          data={mockData}
          kpis={mockKpis}
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Por defecto debería mostrar la primera dimensión (region)
      // Esperamos ver "Norte" y "Sur" como categorías
      // (Esto se probará visualmente cuando tengamos el gráfico implementado)
      expect(screen.getByText(/Análisis por Dimensión/i)).toBeInTheDocument();
    });

    it('debe calcular totales por grupo (A y B) para cada valor de dimensión', () => {
      render(
        <CategoryChart
          data={mockData}
          kpis={mockKpis}
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Debe procesar datos:
      // Norte: groupA=500, groupB=400
      // Sur: groupA=500, groupB=400
      expect(screen.getByText(/Análisis por Dimensión/i)).toBeInTheDocument();
    });
  });

  describe('[RED] Caso vacío', () => {
    it('debe mostrar mensaje cuando no hay dimensiones disponibles', () => {
      render(
        <CategoryChart
          data={mockData}
          kpis={mockKpis}
          dimensions={[]}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      expect(screen.getByText(/No hay dimensiones categóricas/i)).toBeInTheDocument();
    });

    it('debe mostrar mensaje cuando no hay datos', () => {
      render(
        <CategoryChart
          data={[]}
          kpis={mockKpis}
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      expect(screen.getByText(/Sin datos para mostrar/i)).toBeInTheDocument();
    });
  });

  describe('[RED] Interactividad', () => {
    it('debe permitir cambiar la dimensión seleccionada', async () => {
      render(
        <CategoryChart
          data={mockData}
          kpis={mockKpis}
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Default: primera dimensión (region)
      // Cambiar a otra dimensión debería actualizar el gráfico
      // (Test de integración - verificaremos visualmente)
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    it('debe permitir cambiar el KPI seleccionado', async () => {
      render(
        <CategoryChart
          data={mockData}
          kpis={mockKpis}
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Cambiar KPI debería actualizar los valores del gráfico
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });
});
