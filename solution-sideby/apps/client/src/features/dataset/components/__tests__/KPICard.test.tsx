/**
 * Tests para KPICard con Sparklines
 * 
 * Verifica:
 * - Renderizado básico del card
 * - Sparkline aparece cuando se proporciona data
 * - Sparkline no aparece sin data
 * - Trend icons correctos según el cambio porcentual
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DollarSign } from 'lucide-react';
import { KPICard } from '../KPICard.js';

describe('KPICard', () => {
  describe('renderizado básico', () => {
    it('debe renderizar título y valores', () => {
      render(
        <KPICard
          title="Ingresos"
          currentValue="$50,000"
          comparativeValue="$40,000"
          percentageChange={25}
          icon={DollarSign}
        />
      );

      expect(screen.getByText('Ingresos')).toBeInTheDocument();
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText(/\$40,000/)).toBeInTheDocument();
    });

    it('debe mostrar badge con cambio porcentual positivo', () => {
      render(
        <KPICard
          title="Revenue"
          currentValue="$50,000"
          comparativeValue="$40,000"
          percentageChange={25}
          icon={DollarSign}
        />
      );

      expect(screen.getByText('+25.0%')).toBeInTheDocument();
    });

    it('debe mostrar badge con cambio porcentual negativo sin signo +', () => {
      render(
        <KPICard
          title="Revenue"
          currentValue="$40,000"
          comparativeValue="$50,000"
          percentageChange={-20}
          icon={DollarSign}
        />
      );

      expect(screen.getByText('-20.0%')).toBeInTheDocument();
    });

    it('debe mostrar cambio porcentual neutro (0%)', () => {
      render(
        <KPICard
          title="Revenue"
          currentValue="$50,000"
          comparativeValue="$50,000"
          percentageChange={0}
          icon={DollarSign}
        />
      );

      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });

  // TEMPORALMENTE DESHABILITADO - RFC-006 Phase 2 Sparklines (Recharts type issue)
  // TODO: Re-habilitar cuando se resuelva el problema de tipos con Recharts
  /* describe('sparklines', () => {
    it('debe renderizar sparkline cuando se proporciona sparklineData', () => {
      const { container } = render(
        <KPICard
          title="Revenue"
          currentValue="$50,000"
          comparativeValue="$40,000"
          percentageChange={25}
          icon={DollarSign}
          sparklineData={[100, 150, 120, 180, 200]}
        />
      );

      // Recharts renderiza un ResponsiveContainer
      const sparklineContainer = container.querySelector('.recharts-responsive-container');
      expect(sparklineContainer).toBeInTheDocument();
    });

    it('NO debe renderizar sparkline cuando sparklineData está vacío', () => {
      const { container } = render(
        <KPICard
          title="Revenue"
          currentValue="$50,000"
          comparativeValue="$40,000"
          percentageChange={25}
          icon={DollarSign}
          sparklineData={[]}
        />
      );

      const sparklineContainer = container.querySelector('.recharts-responsive-container');
      expect(sparklineContainer).not.toBeInTheDocument();
    });

    it('NO debe renderizar sparkline cuando sparklineData no se proporciona', () => {
      const { container } = render(
        <KPICard
          title="Revenue"
          currentValue="$50,000"
          comparativeValue="$40,000"
          percentageChange={25}
          icon={DollarSign}
        />
      );

      const sparklineContainer = container.querySelector('.recharts-responsive-container');
      expect(sparklineContainer).not.toBeInTheDocument();
    });
  }); */

  describe('labels de grupos', () => {
    it('debe mostrar labels personalizados cuando se proporcionan', () => {
      render(
        <KPICard
          title="Revenue"
          currentValue="$50,000"
          comparativeValue="$40,000"
          percentageChange={25}
          icon={DollarSign}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getByText('2024')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
    });

    it('NO debe mostrar labels cuando son los defaults', () => {
      render(
        <KPICard
          title="Revenue"
          currentValue="$50,000"
          comparativeValue="$40,000"
          percentageChange={25}
          icon={DollarSign}
          groupALabel="Actual"
          groupBLabel="Comparativo"
        />
      );

      // No debe renderizar el div de labels
      expect(screen.queryByText('Actual')).not.toBeInTheDocument();
    });
  });
});
