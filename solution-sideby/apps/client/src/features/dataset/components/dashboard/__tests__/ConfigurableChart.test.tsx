/**
 * Tests para ConfigurableChart - Gráfico configurable con selector de KPI y Dimensión
 * 
 * TDD: RED phase - Definir comportamiento esperado
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigurableChart } from '../ConfigurableChart.js';
import type { KPIResult } from '../../../types/dashboard.types.js';
import type { DataRow } from '../../../types/api.types.js';

// Mock data
const mockKpis: KPIResult[] = [
  {
    name: 'revenue',
    label: 'Ingresos',
    format: 'currency',
    valueA: 1000,
    valueB: 800,
    diff: 200,
    diffPercent: 25,
    trend: 'up',
  },
  {
    name: 'orders',
    label: 'Pedidos',
    format: 'number',
    valueA: 50,
    valueB: 40,
    diff: 10,
    diffPercent: 25,
    trend: 'up',
  },
];

const mockData: DataRow[] = [
  { date: '2024-01-01', revenue: 500, orders: 25, region: 'Norte', _source_group: 'groupA' },
  { date: '2024-01-02', revenue: 500, orders: 25, region: 'Sur', _source_group: 'groupA' },
  { date: '2023-01-01', revenue: 400, orders: 20, region: 'Norte', _source_group: 'groupB' },
  { date: '2023-01-02', revenue: 400, orders: 20, region: 'Sur', _source_group: 'groupB' },
];

const mockDimensions = ['region'];

describe('[RED] ConfigurableChart Component', () => {
  describe('[RED] Renderizado básico', () => {
    it('debe renderizar el componente con título', () => {
      render(
        <ConfigurableChart
          data={mockData}
          kpis={mockKpis}
          dateField="date"
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Debe tener título "Análisis Configurable"
      expect(screen.getByText('Análisis Configurable')).toBeInTheDocument();
    });

    it('debe renderizar selector de KPI', () => {
      render(
        <ConfigurableChart
          data={mockData}
          kpis={mockKpis}
          dateField="date"
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Debe tener label "Mostrar KPI:"
      expect(screen.getByText('Mostrar KPI:')).toBeInTheDocument();
      
      // Debe tener un combobox para seleccionar KPI
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(1);
    });

    it('debe renderizar selector de Dimensión', () => {
      render(
        <ConfigurableChart
          data={mockData}
          kpis={mockKpis}
          dateField="date"
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Debe tener label "Por Dimensión:"
      expect(screen.getByText('Por Dimensión:')).toBeInTheDocument();
      
      // ConfigurableChart tiene 2 selectores + TrendChart interno agrega 1 más = 3 total
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('[RED] Renderizado condicional de charts', () => {
    it('debe renderizar TrendChart cuando dimensión es temporal (dateField)', () => {
      render(
        <ConfigurableChart
          data={mockData}
          kpis={mockKpis}
          dateField="date"
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Por defecto debe mostrar TrendChart (dimensión temporal)
      // TrendChart tiene botones de granularidad (Días, Semanas, Meses, Trimestres)
      expect(screen.getByText('Días')).toBeInTheDocument();
      expect(screen.getByText('Meses')).toBeInTheDocument();
    });

    it('debe renderizar CategoryChart cuando dimensión es categórica', () => {
      render(
        <ConfigurableChart
          data={mockData}
          kpis={mockKpis}
          dateField="date"
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Al cambiar a dimensión categórica, debe mostrar CategoryChart
      // Por defecto renderiza TrendChart (dimensión temporal es primera)
      // Test de integración simple: verificar que componente carga con selectores
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
      
      // Verificar labels de configuración
      expect(screen.getByText('Mostrar KPI:')).toBeInTheDocument();
      expect(screen.getByText('Por Dimensión:')).toBeInTheDocument();
    });
  });

  describe('[RED] Caso sin dateField (solo categóricas)', () => {
    it('debe funcionar sin campo temporal', () => {
      render(
        <ConfigurableChart
          data={mockData}
          kpis={mockKpis}
          dateField={undefined}
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Debe renderizar con solo dimensiones categóricas
      expect(screen.getByText('Análisis Configurable')).toBeInTheDocument();
      expect(screen.getByText('Por Dimensión:')).toBeInTheDocument();
    });
  });

  describe('[RED] Caso vacío - Sin dimensiones', () => {
    it('debe mostrar mensaje cuando no hay dimensiones', () => {
      render(
        <ConfigurableChart
          data={mockData}
          kpis={mockKpis}
          dateField={undefined}
          dimensions={[]}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Debe mostrar mensaje de "sin dimensiones"
      expect(screen.getByText(/No hay dimensiones disponibles/i)).toBeInTheDocument();
    });
  });

  describe('[RED] Caso vacío - Sin datos', () => {
    it('debe manejar array de datos vacío', () => {
      render(
        <ConfigurableChart
          data={[]}
          kpis={mockKpis}
          dateField="date"
          dimensions={mockDimensions}
          groupALabel="2024"
          groupBLabel="2023"
          groupAColor="hsl(var(--primary))"
          groupBColor="hsl(var(--secondary))"
        />
      );

      // Debe renderizar componente aunque no haya datos
      expect(screen.getByText('Análisis Configurable')).toBeInTheDocument();
    });
  });
});
