/**
 * Tests para SummaryTable Component
 * 
 * Tabla sticky con totales de KPIs en la vista Detailed
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryTable } from '../SummaryTable.js';
import type { KPIResult } from '../../../types/dashboard.types.js';

describe('SummaryTable', () => {
  const mockKPIs: KPIResult[] = [
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
      valueA: 1500,
      valueB: 450,
      diff: 1050,
      diffPercent: 11.11,
      format: 'number',
      trend: 'up',
    },
    {
      name: 'churn',
      label: 'Tasa de Abandono',
      valueA: 5,
      valueB: 8,
      diff: -3,
      diffPercent: -37.5,
      format: 'percentage',
      trend: 'down',
    },
  ];

  describe('renderizado básico', () => {
    it('debe renderizar el título del componente', () => {
      render(
        <SummaryTable
          kpis={mockKPIs}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getByText(/Resumen General/i)).toBeInTheDocument();
    });

    it('debe renderizar headers de columnas correctamente', () => {
      render(
        <SummaryTable
          kpis={mockKPIs}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getByText('KPI')).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
      expect(screen.getByText('Delta Abs')).toBeInTheDocument();
      expect(screen.getByText('Delta %')).toBeInTheDocument();
    });

    it('debe renderizar todas las filas de KPIs', () => {
      render(
        <SummaryTable
          kpis={mockKPIs}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getByText('Ingresos')).toBeInTheDocument();
      expect(screen.getByText('Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Tasa de Abandono')).toBeInTheDocument();
    });
  });

  describe('formateo de valores', () => {
    it('debe formatear valores currency correctamente', () => {
      render(
        <SummaryTable
          kpis={[mockKPIs[0]]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      // Valores deben estar formateados en compacto (K)
      expect(screen.getByText(/50\.0K/)).toBeInTheDocument();
      expect(screen.getByText(/40\.0K/)).toBeInTheDocument();
    });

    it('debe formatear valores number correctamente', () => {
      render(
        <SummaryTable
          kpis={[mockKPIs[1]]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getByText(/1\.5K/)).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
    });

    it('debe formatear valores percentage correctamente', () => {
      render(
        <SummaryTable
          kpis={[mockKPIs[2]]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getByText('5.0%')).toBeInTheDocument();
      expect(screen.getByText('8.0%')).toBeInTheDocument();
    });
  });

  describe('cálculo y renderizado de deltas', () => {
    it('debe mostrar delta absoluto positivo con signo +', () => {
      render(
        <SummaryTable
          kpis={[mockKPIs[0]]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      // Delta absoluto (+10.0K €)
      expect(screen.getByText(/\+\s*10\.0K/)).toBeInTheDocument();
    });

    it('debe mostrar delta absoluto negativo correctamente', () => {
      render(
        <SummaryTable
          kpis={[mockKPIs[2]]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      // Delta absoluto (-3)
      expect(screen.getByText(/-3\.0%/)).toBeInTheDocument();
    });

    it('debe mostrar delta porcentual positivo con signo +', () => {
      render(
        <SummaryTable
          kpis={[mockKPIs[0]]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getByText('+25.0%')).toBeInTheDocument();
    });

    it('debe mostrar delta porcentual negativo correctamente', () => {
      render(
        <SummaryTable
          kpis={[mockKPIs[2]]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getByText('-37.5%')).toBeInTheDocument();
    });
  });

  describe('indicadores de tendencia', () => {
    it('debe mostrar icono trending up para valores positivos', () => {
      const { container } = render(
        <SummaryTable
          kpis={[mockKPIs[0]]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      // TrendingUp component tiene className específica
      const trendIcons = container.querySelectorAll('.lucide-trending-up');
      expect(trendIcons.length).toBeGreaterThan(0);
    });

    it('debe mostrar icono trending down para valores negativos', () => {
      const { container } = render(
        <SummaryTable
          kpis={[mockKPIs[2]]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      const trendIcons = container.querySelectorAll('.lucide-trending-down');
      expect(trendIcons.length).toBeGreaterThan(0);
    });
  });

  describe('casos edge', () => {
    it('debe manejar array vacío de KPIs', () => {
      render(
        <SummaryTable
          kpis={[]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      // Debe renderizar tabla vacía sin errores
      expect(screen.getByText(/Resumen General/i)).toBeInTheDocument();
    });

    it('debe manejar división por cero (Infinity)', () => {
      const kpiWithZero: KPIResult = {
        name: 'test',
        label: 'Test KPI',
        valueA: 100,
        valueB: 0,
        diff: 100,
        diffPercent: Infinity,
        format: 'number',
        trend: 'up',
      };

      render(
        <SummaryTable
          kpis={[kpiWithZero]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      // Debe mostrar "N/A" o "∞" en lugar de número
      expect(screen.getByText(/N\/A|∞/i)).toBeInTheDocument();
    });
  });

  describe('estilos y clases CSS', () => {
    it('debe tener clase sticky para posicionamiento', () => {
      const { container } = render(
        <SummaryTable
          kpis={mockKPIs}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      // Buscar elemento con clase sticky
      const stickyElement = container.querySelector('.sticky');
      expect(stickyElement).toBeInTheDocument();
    });

    it('debe aplicar clases de color a valores positivos', () => {
      const { container } = render(
        <SummaryTable
          kpis={[mockKPIs[0]]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      // Buscar elementos con clase de texto verde (positivo)
      const greenText = container.querySelectorAll('.text-green-600');
      expect(greenText.length).toBeGreaterThan(0);
    });

    it('debe aplicar clases de color a valores negativos', () => {
      const { container } = render(
        <SummaryTable
          kpis={[mockKPIs[2]]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      // Buscar elementos con clase de texto rojo (negativo)
      const redText = container.querySelectorAll('.text-red-600');
      expect(redText.length).toBeGreaterThan(0);
    });
  });
});
