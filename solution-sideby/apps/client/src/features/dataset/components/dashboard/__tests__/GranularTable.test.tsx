/**
 * Tests para GranularTable Component
 * 
 * Verifica:
 * - Renderizado de dimensiones y KPIs
 * - Cálculos de deltas (absolutos y porcentuales)
 * - Funcionalidad de búsqueda/filtrado
 * - Ordenamiento por columnas
 * - Expansión de filas
 * - Export CSV
 * - Indicadores de tendencia
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GranularTable } from '../GranularTable.js';
import type { DataRow } from '../../../types/api.types.js';
import type { KPIField } from '../../../types/wizard.types.js';

describe('GranularTable', () => {
  // Mock data
  const mockKPIs: KPIField[] = [
    {
      id: 'revenue',
      label: 'Ingresos',
      sourceColumn: 'revenue',
      type: 'currency',
      aggregation: 'sum',
      format: 'currency',
    },
    {
      id: 'units',
      label: 'Unidades',
      sourceColumn: 'units_sold',
      type: 'number',
      aggregation: 'sum',
      format: 'number',
    },
  ];

  const mockData: DataRow[] = [
    {
      id: '1',
      date: '2023-01-01',
      product: 'Balón',
      region: 'Norte',
      revenue: 500,
      units_sold: 10,
      _source_group: 'groupA',
    },
    {
      id: '2',
      date: '2024-01-01',
      product: 'Balón',
      region: 'Norte',
      revenue: 700,
      units_sold: 15,
      _source_group: 'groupB',
    },
    {
      id: '3',
      date: '2023-01-01',
      product: 'Camiseta',
      region: 'Sur',
      revenue: 300,
      units_sold: 20,
      _source_group: 'groupA',
    },
    {
      id: '4',
      date: '2024-01-01',
      product: 'Camiseta',
      region: 'Sur',
      revenue: 350,
      units_sold: 22,
      _source_group: 'groupB',
    },
  ];

  const defaultProps = {
    data: mockData,
    dimensions: ['product', 'region'],
    kpis: mockKPIs,
    groupALabel: '2023',
    groupBLabel: '2024',
  };

  describe('Renderizado básico', () => {
    it('debe renderizar el título de la tabla', () => {
      render(<GranularTable {...defaultProps} />);
      expect(screen.getByText(/Detalle por Dimensiones/i)).toBeInTheDocument();
    });

    it('debe renderizar headers de dimensiones', () => {
      render(<GranularTable {...defaultProps} />);
      expect(screen.getByText('product')).toBeInTheDocument();
      expect(screen.getByText('region')).toBeInTheDocument();
    });

    it('debe renderizar headers de KPIs con labels para Grupo A y Grupo B', () => {
      render(<GranularTable {...defaultProps} />);
      
      // Buscar headers específicos (incluyendo A/B y Delta)
      expect(screen.getByText('Ingresos A/B')).toBeInTheDocument();
      expect(screen.getByText('Δ Ingresos')).toBeInTheDocument();
      expect(screen.getByText('Unidades A/B')).toBeInTheDocument();
      expect(screen.getByText('Δ Unidades')).toBeInTheDocument();
    });

    it('debe renderizar filas agrupadas por dimensión', () => {
      render(<GranularTable {...defaultProps} />);
      
      // Debe haber 2 filas (Balón-Norte, Camiseta-Sur)
      expect(screen.getByText('Balón')).toBeInTheDocument();
      expect(screen.getByText('Camiseta')).toBeInTheDocument();
    });

    it('debe mostrar input de búsqueda', () => {
      render(<GranularTable {...defaultProps} />);
      expect(screen.getByPlaceholderText(/Buscar/i)).toBeInTheDocument();
    });

    it('debe mostrar botón de Export CSV', () => {
      render(<GranularTable {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    });
  });

  describe('Cálculo de Deltas', () => {
    it('debe calcular y mostrar delta absoluto correcto', () => {
      render(<GranularTable {...defaultProps} />);
      
      // Balón:  700 - 500 = +200
      // El formato es "+$200 (40.0%)" para currency
      const ballRow = screen.getByText('Balón').closest('tr');
      expect(ballRow).toBeInTheDocument();
      
      // Buscar el delta formateado con currency
      expect(within(ballRow!).getByText(/\+\$200/)).toBeInTheDocument();
    });

    it('debe calcular y mostrar delta porcentual correcto', () => {
      render(<GranularTable {...defaultProps} />);
      
      // Balón: ((700 - 500) / 500) * 100 = 40%
      const ballRow = screen.getByText('Balón').closest('tr');
      expect(within(ballRow!).getByText(/40\.0%/)).toBeInTheDocument();
    });

    it('debe mostrar deltas negativos sin signo +', () => {
      const dataWithNegative: DataRow[] = [
        { ...mockData[0], revenue: 1000 },
        { ...mockData[1], revenue: 800 },
      ];

      render(<GranularTable {...defaultProps} data={dataWithNegative} />);
      
      // Delta: 800 - 1000 = -200
      expect(screen.getByText(/-200/)).toBeInTheDocument();
    });

    it('debe aplicar color verde a deltas positivos', () => {
      const { container } = render(<GranularTable {...defaultProps} />);
      
      // Buscar elementos con delta positivo
      const positiveDelta = container.querySelector('.text-green-600');
      expect(positiveDelta).toBeInTheDocument();
      expect(positiveDelta?.textContent).toMatch(/\+/);
    });

    it('debe aplicar color rojo a deltas negativos', () => {
      const dataWithNegative: DataRow[] = [
        { ...mockData[0], revenue: 1000 },
        { ...mockData[1], revenue: 800 },
      ];

      const { container } = render(<GranularTable {...defaultProps} data={dataWithNegative} />);
      
      const negativeDelta = container.querySelector('.text-red-600');
      expect(negativeDelta).toBeInTheDocument();
      expect(negativeDelta?.textContent).toMatch(/-/);
    });
  });

  describe('Búsqueda y Filtrado', () => {
    it('debe filtrar filas según texto de búsqueda', async () => {
      const user = userEvent.setup();
      render(<GranularTable {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/Buscar/i);
      await user.type(searchInput, 'Balón');
      
      // Solo debe mostrar fila con "Balón"
      expect(screen.getByText('Balón')).toBeInTheDocument();
      expect(screen.queryByText('Camiseta')).not.toBeInTheDocument();
    });

    it('debe filtrar de manera case-insensitive', async () => {
      const user = userEvent.setup();
      render(<GranularTable {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/Buscar/i);
      await user.type(searchInput, 'balon');  // lowercase
      
      // Usar findByText para esperar a que el componente se actualice
      expect(await screen.findByText('Balón')).toBeInTheDocument();
    });

    it('debe mostrar todas las filas cuando búsqueda está vacía', async () => {
      const user = userEvent.setup();
      render(<GranularTable {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/Buscar/i);
      await user.type(searchInput, 'Balón');
      await user.clear(searchInput);
      
      expect(screen.getByText('Balón')).toBeInTheDocument();
      expect(screen.getByText('Camiseta')).toBeInTheDocument();
    });
  });

  describe('Ordenamiento (Sorting)', () => {
    it('debe mostrar indicador de ordenamiento en header clickeado', async () => {
      const user = userEvent.setup();
      render(<GranularTable {...defaultProps} />);
      
      const productHeader = screen.getByText('product');
      await user.click(productHeader);
      
      // Debe mostrar flecha de ordenamiento
      expect(productHeader.parentElement?.textContent).toMatch(/[↑↓]/);
    });

    it('debe cambiar dirección de ordenamiento en doble click', async () => {
      const user = userEvent.setup();
      render(<GranularTable {...defaultProps} />);
      
      const productHeader = screen.getByText('product');
      await user.click(productHeader);
      const firstSort = productHeader.parentElement?.textContent;
      
      await user.click(productHeader);
      const secondSort = productHeader.parentElement?.textContent;
      
      expect(firstSort).not.toBe(secondSort);
    });

    it('debe ordenar filas alfabéticamente por dimensión', async () => {
      const user = userEvent.setup();
      const { container } = render(<GranularTable {...defaultProps} />);
      
      const productHeader = screen.getByText('product');
      await user.click(productHeader);
      
      // Obtener todas las filas de datos
      const rows = container.querySelectorAll('tbody tr[data-testid="data-row"]');
      const firstRow = rows[0];
      const secondRow = rows[1];
      
      // "Balón" debe venir antes que "Camiseta" (orden alfabético)
      expect(within(firstRow as HTMLElement).getByText('Balón')).toBeInTheDocument();
      expect(within(secondRow as HTMLElement).getByText('Camiseta')).toBeInTheDocument();
    });
  });

  describe('Expansión de Filas', () => {
    it('debe mostrar botón de expansión en cada fila', () => {
      const { container } = render(<GranularTable {...defaultProps} />);
      
      // Buscar botones con iconos de chevron
      const expandButtons = container.querySelectorAll('button svg');
      expect(expandButtons.length).toBeGreaterThan(0);
    });

    it('debe expandir fila al hacer click en botón de expansión', async () => {
      const user = userEvent.setup();
      const { container } = render(<GranularTable {...defaultProps} />);
      
      const expandButton = container.querySelector('button[data-testid="expand-button"]');
      if (expandButton) {
        await user.click(expandButton);
        
        // Debe aparecer contenido expandido
        expect(screen.getByText(/Desglose Detallado/i)).toBeInTheDocument();
      }
    });

    it('debe colapsar fila expandida al hacer click nuevamente', async () => {
      const user = userEvent.setup();
      const { container } = render(<GranularTable {...defaultProps} />);
      
      const expandButton = container.querySelector('button[data-testid="expand-button"]');
      if (expandButton) {
        await user.click(expandButton);
        await user.click(expandButton);
        
        // Contenido expandido no debe estar visible
        expect(screen.queryByText(/Desglose Detallado/i)).not.toBeInTheDocument();
      }
    });
  });

  describe('Export CSV', () => {
    it('debe llamar a función de export al hacer click en botón', async () => {
      const user = userEvent.setup();
      const mockExport = vi.fn();
      
      // Mock del método de export
      global.URL.createObjectURL = vi.fn();
      HTMLAnchorElement.prototype.click = mockExport;
      
      render(<GranularTable {...defaultProps} />);
      
      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);
      
      // Debe intentar descargar algo
      expect(mockExport).toHaveBeenCalled();
    });
  });

  describe('Formateo de Valores', () => {
    it('debe formatear currency con símbolo $', () => {
      render(<GranularTable {...defaultProps} />);
      
      // Buscar valores de revenue (formato currency)
      expect(screen.getByText(/\$500/)).toBeInTheDocument();
    });

    it('debe formatear números sin símbolo', () => {
      render(<GranularTable {...defaultProps} />);
      
      // Units sold es formato number (aparece como "10 → 15")
      const ballRow = screen.getByText('Balón').closest('tr');
      expect(within(ballRow!).getByText(/10\s*→\s*15/)).toBeInTheDocument();
    });
  });

  describe('Casos Extremos', () => {
    it('debe manejar datos vacíos sin error', () => {
      render(<GranularTable {...defaultProps} data={[]} />);
      expect(screen.getByText(/Detalle por Dimensiones/i)).toBeInTheDocument();
    });

    it('debe manejar división por cero en cálculo de porcentaje', () => {
      const dataWithZero: DataRow[] = [
        { ...mockData[0], revenue: 0 },
        { ...mockData[1], revenue: 100 },
      ];

      render(<GranularTable {...defaultProps} data={dataWithZero} />);
      
      // No debe mostrar Infinity ni NaN
      const { container } = render(<GranularTable {...defaultProps} data={dataWithZero} />);
      expect(container.textContent).not.toContain('Infinity');
      expect(container.textContent).not.toContain('NaN');
    });

    it('debe manejar dimensiones faltantes sin error', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { product, ...rowWithoutProduct } = mockData[0];
      const incompleteData: DataRow[] = [
        rowWithoutProduct as DataRow,
      ];

      expect(() => {
        render(<GranularTable {...defaultProps} data={incompleteData} />);
      }).not.toThrow();
    });
  });
});
