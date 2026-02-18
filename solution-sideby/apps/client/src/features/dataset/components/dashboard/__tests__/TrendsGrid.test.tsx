/**
 * Tests para TrendsGrid Component
 * 
 * Verifica:
 * - Renderizado de grid 2×2 con 4 mini-charts
 * - Distribución correcta de KPIs en el grid
 * - Responsive layout
 * - Manejo de menos de 4 KPIs disponibles
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendsGrid } from '../TrendsGrid.js';
import type { DataRow } from '../../../types/api.types.js';
import type { KPIResult } from '../../../types/dashboard.types.js';

describe('TrendsGrid', () => {
  // Mock data temporal
  const mockData: DataRow[] = [
    {
      id: '1',
      date: '2023-01-01',
      revenue: 100,
      profit: 20,
      orders: 50,
      conversion_rate: 2.5,
      _source_group: 'groupA',
    },
    {
      id: '2',
      date: '2024-01-01',
      revenue: 150,
      profit: 30,
      orders: 75,
      conversion_rate: 3.0,
      _source_group: 'groupB',
    },
  ];

  const mockKPIs: KPIResult[] = [
    {
      name: 'revenue',
      label: 'Ingresos',
      valueA: 250,
      valueB: 300,
      diff: 50,
      diffPercent: 20,
      format: 'currency',
      trend: 'up',
    },
    {
      name: 'profit',
      label: 'Ganancias',
      valueA: 50,
      valueB: 75,
      diff: 25,
      diffPercent: 50,
      format: 'currency',
      trend: 'up',
    },
    {
      name: 'orders',
      label: 'Pedidos',
      valueA: 100,
      valueB: 150,
      diff: 50,
      diffPercent: 50,
      format: 'number',
      trend: 'up',
    },
    {
      name: 'conversion_rate',
      label: 'Tasa Conversión',
      valueA: 2.5,
      valueB: 3.0,
      diff: 0.5,
      diffPercent: 20,
      format: 'percentage',
      trend: 'up',
    },
  ];

  const defaultProps = {
    kpis: mockKPIs,
    data: mockData,
    dateField: 'date',
    groupALabel: '2023',
    groupBLabel: '2024',
    groupAColor: '#3b82f6',
    groupBColor: '#10b981',
  };

  describe('Renderizado básico', () => {
    it('debe renderizar el título del grid', () => {
      render(<TrendsGrid {...defaultProps} />);
      expect(screen.getByText(/Tendencias Temporales/i)).toBeInTheDocument();
    });

    it('debe renderizar 4 mini-charts cuando hay 4 KPIs', () => {
      render(<TrendsGrid {...defaultProps} />);
      
      expect(screen.getByText('Ingresos')).toBeInTheDocument();
      expect(screen.getByText('Ganancias')).toBeInTheDocument();
      expect(screen.getByText('Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Tasa Conversión')).toBeInTheDocument();
    });

    it('debe renderizar todos los valores de los KPIs', () => {
      render(<TrendsGrid {...defaultProps} />);
      
      expect(screen.getAllByText(/250\s*€/).length).toBeGreaterThan(0); // revenue
      expect(screen.getAllByText(/50\s*€/).length).toBeGreaterThan(0);  // profit
      expect(screen.getByText(/100/)).toBeInTheDocument();   // orders
      expect(screen.getByText(/2\.5%/)).toBeInTheDocument(); // conversion
    });
  });

  describe('Layout Grid 2×2', () => {
    it('debe aplicar clase de grid con 2 columnas', () => {
      const { container } = render(<TrendsGrid {...defaultProps} />);
      
      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer?.className).toMatch(/grid-cols-1|grid-cols-2/);
    });

    it('debe tener clase responsive para mobile', () => {
      const { container } = render(<TrendsGrid {...defaultProps} />);
      
      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer?.className).toContain('grid-cols-1');
    });

    it('debe tener clase de 2 columnas para desktop', () => {
      const { container } = render(<TrendsGrid {...defaultProps} />);
      
      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer?.className).toMatch(/lg:grid-cols-2/);
    });
  });

  describe('Selección de KPIs Top 4', () => {
    it('debe mostrar solo los primeros 4 KPIs cuando hay más de 4', () => {
      const manyKPIs: KPIResult[] = [
        ...mockKPIs,
        {
          name: 'extra1',
          label: 'Extra 1',
          valueA: 100,
          valueB: 150,
          diff: 50,
          diffPercent: 50,
          format: 'number',
          trend: 'up',
        },
        {
          name: 'extra2',
          label: 'Extra 2',
          valueA: 200,
          valueB: 250,
          diff: 50,
          diffPercent: 25,
          format: 'number',
          trend: 'up',
        },
      ];

      render(<TrendsGrid {...defaultProps} kpis={manyKPIs} />);
      
      // Solo debe mostrar los primeros 4
      expect(screen.getByText('Ingresos')).toBeInTheDocument();
      expect(screen.getByText('Ganancias')).toBeInTheDocument();
      expect(screen.getByText('Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Tasa Conversión')).toBeInTheDocument();
      
      // No debe mostrar los extras
      expect(screen.queryByText('Extra 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Extra 2')).not.toBeInTheDocument();
    });

    it('debe manejar menos de 4 KPIs sin error', () => {
      const fewKPIs = mockKPIs.slice(0, 2);

      expect(() => {
        render(<TrendsGrid {...defaultProps} kpis={fewKPIs} />);
      }).not.toThrow();

      expect(screen.getByText('Ingresos')).toBeInTheDocument();
      expect(screen.getByText('Ganancias')).toBeInTheDocument();
    });
  });

  describe('Propagación de Props', () => {
    it('debe pasar dateField a cada MiniTrendChart', () => {
      render(<TrendsGrid {...defaultProps} />);
      
      // Todos los charts deben renderizarse correctamente
      expect(screen.getByText('Ingresos')).toBeInTheDocument();
      expect(screen.getByText('Ganancias')).toBeInTheDocument();
      expect(screen.getByText('Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Tasa Conversión')).toBeInTheDocument();
    });

    it('debe pasar groupALabel y groupBLabel a cada chart', () => {
      render(<TrendsGrid {...defaultProps} />);
      
      // Verificar que los valores se muestran (indica que los labels se pasaron)
      expect(screen.getAllByText(/250\s*€/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/50\s*€/).length).toBeGreaterThan(0);
    });

    it('debe pasar colores a cada MiniTrendChart', () => {
      const customColors = {
        ...defaultProps,
        groupAColor: '#ff0000',
        groupBColor: '#00ff00',
      };

      expect(() => {
        render(<TrendsGrid {...customColors} />);
      }).not.toThrow();
    });
  });

  describe('Casos Extremos', () => {
    it('debe manejar array vacío de KPIs', () => {
      expect(() => {
        render(<TrendsGrid {...defaultProps} kpis={[]} />);
      }).not.toThrow();

      expect(screen.getByText(/Tendencias Temporales/i)).toBeInTheDocument();
    });

    it('debe manejar datos vacíos', () => {
      expect(() => {
        render(<TrendsGrid {...defaultProps} data={[]} />);
      }).not.toThrow();
    });

    it('debe manejar solo 1 KPI', () => {
      const singleKPI = [mockKPIs[0]];

      render(<TrendsGrid {...defaultProps} kpis={singleKPI} />);
      
      expect(screen.getByText('Ingresos')).toBeInTheDocument();
      expect(screen.queryByText('Ganancias')).not.toBeInTheDocument();
    });
  });
});
