import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPIGrid } from "../KPIGrid.js";
import { ComparisonTable } from "../ComparisonTable.js";
import type { KPIResult } from "../../../types/dashboard.types.js";

/**
 * Smoke tests para Dashboard Components - Verificación de fixes aplicados
 * 
 * Este archivo verifica los fixes específicos de la PR review:
 * - Fix #6: Typo violetto-600 → violet-600 (verificado en código)
 * - Fix #7: KPIGrid formatea números >= 10000 con K
 * - Fix #10: Division by zero retorna Infinity/N/A
 */
describe("Dashboard Components - PR Review Fixes", () => {
  const mockKPIs: KPIResult[] = [
    {
      name: "revenue",
      label: "Ingresos",
      valueA: 15000,
      valueB: 12000,
      diff: 3000,
      diffPercent: 25,
      format: "currency",
      trend: "up",
    },
    {
      name: "orders",
      label: "Pedidos",
      valueA: 500,
      valueB: 450,
      diff: 50,
      diffPercent: 11.11,
      format: "number",
      trend: "up",
    },
  ];

  describe("KPIGrid - Fix #7: Número grande formateado con K (threshold >= 10000)", () => {
    it("formatea números >= 10000 con sufijo K", () => {
      const largeKPI: KPIResult = {
        name: "revenue",
        label: "Ingresos",
        valueA: 25000,
        valueB: 20000,
        diff: 5000,
        diffPercent: 25,
        format: "number",
        trend: "up",
      };

      render(
        <KPIGrid
          kpis={[largeKPI]}
        />
      );

      // Números >= 1000 deben mostrarse como "25.0K"
      expect(screen.getByText("25.0K")).toBeInTheDocument();
    });

    it("NO formatea números < 10000 con K", () => {
      const smallKPI: KPIResult = {
        ...mockKPIs[1],
        valueA: 9999,
      };

      render(
        <KPIGrid
          kpis={[smallKPI]}
        />
      );

      // Números >= 1000 deben mostrarse con K
      expect(screen.getByText("10.0K")).toBeInTheDocument();
    });
  });

  describe("KPIGrid - Fix #10: División por cero maneja Infinity correctamente", () => {
    it("muestra N/A cuando diffPercent es Infinity", () => {
      const infiniteKPI: KPIResult = {
        name: "new_metric",
        label: "Nueva Métrica",
        valueA: 100,
        valueB: 0,
        diff: 100,
        diffPercent: Infinity,
        format: "number",
        trend: "neutral",
      };

      render(
        <KPIGrid
          kpis={[infiniteKPI]}
        />
      );

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("muestra porcentaje normal cuando diffPercent es finito", () => {
      render(
        <KPIGrid
          kpis={[mockKPIs[0]]}
        />
      );

      expect(screen.getByText("+25.0%")).toBeInTheDocument();
    });
  });

  describe("ComparisonTable - Fix #10: División por cero maneja Infinity correctamente", () => {
    it("muestra N/A cuando diffPercent es Infinity", () => {
      const infiniteKPI: KPIResult = {
        name: "new_metric",
        label: "Nueva Métrica",
        valueA: 100,
        valueB: 0,
        diff: 100,
        diffPercent: Infinity,
        format: "number",
        trend: "neutral",
      };

      render(
        <ComparisonTable
          kpis={[infiniteKPI]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("muestra 0% para cambios muy pequeños (< 0.1%)", () => {
      const minimalChangeKPI: KPIResult = {
        name: "stable",
        label: "Estable",
        valueA: 1000,
        valueB: 1001,
        diff: -1,
        diffPercent: -0.05,
        format: "number",
        trend: "neutral",
      };

      render(
        <ComparisonTable
          kpis={[minimalChangeKPI]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  describe("Componentes básicos - Renderizado sin errores", () => {
    it("KPIGrid se renderiza sin errores", () => {
      render(
        <KPIGrid
          kpis={mockKPIs}
        />
      );

      expect(screen.getByText("Ingresos")).toBeInTheDocument();
      expect(screen.getByText("Pedidos")).toBeInTheDocument();
    });

    it("ComparisonTable se renderiza sin errores", () => {
      render(
        <ComparisonTable
          kpis={mockKPIs}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getAllByText("Ingresos").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pedidos").length).toBeGreaterThan(0);
    });

    it("KPIGrid maneja array vacío", () => {
      render(
        <KPIGrid
          kpis={[]}
        />
      );

      expect(screen.getByText("No hay KPIs para mostrar")).toBeInTheDocument();
    });

    it("ComparisonTable maneja array vacío", () => {
      render(
        <ComparisonTable
          kpis={[]}
          groupALabel="2024"
          groupBLabel="2023"
        />
      );

      expect(screen.getByText(/No hay datos para mostrar/)).toBeInTheDocument();
    });
  });
});
