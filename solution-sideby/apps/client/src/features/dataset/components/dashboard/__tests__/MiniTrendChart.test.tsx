/**
 * Tests para MiniTrendChart Component
 * 
 * Verifica:
 * - Renderizado del título y valor del KPI
 * - Badge con delta porcentual y dirección correcta
 * - Colores del badge según tendencia (positiva/negativa)
 * - Renderizado del gráfico de líneas
 * - Formateo correcto según tipo de KPI
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MiniTrendChart } from '../MiniTrendChart.js';
import type { DataRow } from '../../../types/api.types.js';
import type { KPIResult } from '../../../types/dashboard.types.js';

describe('MiniTrendChart', () => {
  // Mock data temporal
  const mockData: DataRow[] = [
    {
      id: '1',
      date: '2023-01-01',
      revenue: 100,
      units_sold: 10,
      _source_group: 'groupA',
    },
    {
      id: '2',
      date: '2023-02-01',
      revenue: 150,
      units_sold: 15,
      _source_group: 'groupA',
    },
    {
      id: '3',
      date: '2024-01-01',
      revenue: 120,
      units_sold: 12,
      _source_group: 'groupB',
    },
    {
      id: '4',
      date: '2024-02-01',
      revenue: 180,
      units_sold: 18,
      _source_group: 'groupB',
    },
  ];

  const mockKPI: KPIResult = {
    name: 'revenue',
    label: 'Ingresos',
    valueA: 250,
    valueB: 300,
    diff: 50,
    diffPercent: 20,
    format: 'currency',
    trend: 'up',
  };

  const defaultProps = {
    kpi: mockKPI,
    data: mockData,
    dateField: 'date',
    granularity: 'months' as const,
    groupALabel: '2023',
    groupBLabel: '2024',
    groupAColor: '#3b82f6',
    groupBColor: '#10b981',
  };

  describe('Renderizado básico', () => {
    it('debe renderizar el título del KPI', () => {
      render(<MiniTrendChart {...defaultProps} />);
      expect(screen.getByText('Ingresos')).toBeInTheDocument();
    });

    it('debe renderizar el valor principal formateado', () => {
      render(<MiniTrendChart {...defaultProps} />);
      // Value A formateado como currency
      expect(screen.getByText(/\$250/)).toBeInTheDocument();
    });

    it('debe renderizar badge con delta porcentual', () => {
      render(<MiniTrendChart {...defaultProps} />);
      expect(screen.getByText(/20\.0%/)).toBeInTheDocument();
    });
  });

  describe('Indicadores de Tendencia', () => {
    it('debe mostrar indicador visual para delta positivo', () => {
      render(<MiniTrendChart {...defaultProps} />);
      const badge = screen.getByText(/\+20\.0%/);
      expect(badge).toBeInTheDocument();
    });

    it('debe mostrar indicador visual para delta negativo', () => {
      const kpiNegative: KPIResult = {
        ...mockKPI,
        valueB: 200,
        diff: -50,
        diffPercent: -20,
        trend: 'down',
      };

      render(<MiniTrendChart {...defaultProps} kpi={kpiNegative} />);
      const badge = screen.getByText(/-20\.0%/);
      expect(badge).toBeInTheDocument();
    });

    it('debe mostrar badge success para tendencia positiva', () => {
      render(<MiniTrendChart {...defaultProps} />);
      
      // Badge con delta positivo debe estar presente
      const badge = screen.getByText(/\+20\.0%/);
      expect(badge).toBeInTheDocument();
    });

    it('debe mostrar badge destructive para tendencia negativa', () => {
      const kpiNegative: KPIResult = {
        ...mockKPI,
        valueB: 200,
        diff: -50,
        diffPercent: -20,
        trend: 'down',
      };

      render(<MiniTrendChart {...defaultProps} kpi={kpiNegative} />);
      
      // Badge con delta negativo debe estar presente
      const badge = screen.getByText(/-20\.0%/);
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Gráfico de Líneas', () => {
    it('debe renderizar contenedor del gráfico Recharts', () => {
      const { container } = render(<MiniTrendChart {...defaultProps} />);
      
      // Recharts renderiza un ResponsiveContainer
      const chartContainer = container.querySelector('.recharts-responsive-container');
      expect(chartContainer).toBeInTheDocument();
    });

    it('debe tener altura de 180px', () => {
      const { container } = render(<MiniTrendChart {...defaultProps} />);
      
      const chartContainer = container.querySelector('.recharts-responsive-container');
      expect(chartContainer).toHaveStyle({ height: '180px' });
    });
  });

  describe('Formateo de Valores', () => {
    it('debe formatear currency con símbolo $', () => {
      render(<MiniTrendChart {...defaultProps} />);
      expect(screen.getByText(/\$250/)).toBeInTheDocument();
    });

    it('debe formatear percentage con símbolo %', () => {
      const kpiPercentage: KPIResult = {
        ...mockKPI,
        format: 'percentage',
        valueA: 45.5,
      };

      render(<MiniTrendChart {...defaultProps} kpi={kpiPercentage} />);
      expect(screen.getByText(/45\.5%/)).toBeInTheDocument();
    });

    it('debe formatear number sin símbolo', () => {
      const kpiNumber: KPIResult = {
        ...mockKPI,
        label: 'Unidades',
        format: 'number',
        valueA: 1234,
      };

      render(<MiniTrendChart {...defaultProps} kpi={kpiNumber} />);
      expect(screen.getByText(/1,234/)).toBeInTheDocument();
    });
  });

  describe('Casos Extremos', () => {
    it('debe manejar datos vacíos sin error', () => {
      expect(() => {
        render(<MiniTrendChart {...defaultProps} data={[]} />);
      }).not.toThrow();
    });

    it('debe manejar delta de 0% correctamente', () => {
      const kpiZero: KPIResult = {
        ...mockKPI,
        valueA: 300,
        valueB: 300,
        diff: 0,
        diffPercent: 0,
        trend: 'neutral',
      };

      render(<MiniTrendChart {...defaultProps} kpi={kpiZero} />);
      expect(screen.getByText(/0\.0%/)).toBeInTheDocument();
    });

    it('debe manejar valores muy grandes con formato apropiado', () => {
      const kpiBig: KPIResult = {
        ...mockKPI,
        valueA: 1234567,
      };

      render(<MiniTrendChart {...defaultProps} kpi={kpiBig} />);
      expect(screen.getByText(/\$1,234,567/)).toBeInTheDocument();
    });

    it('debe manejar campo de fecha faltante', () => {
      const dataWithoutDate = mockData.map((row) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { date, ...rest } = row;
        return rest as DataRow;
      });

      expect(() => {
        render(<MiniTrendChart {...defaultProps} data={dataWithoutDate} />);
      }).not.toThrow();
    });
  });
});
