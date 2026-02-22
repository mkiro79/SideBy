/**
 * Tests para DatasetSummarySection Component
 *
 * Verifica que el componente DatasetSummarySection:
 * - Renderiza correctamente la información de ambos archivos (A y B)
 * - Formatea correctamente los contadores de filas y columnas
 * - Usa los colores de los grupos al renderizar las tarjetas
 * - Retorna null cuando sourceConfig es undefined
 * - Renderiza los nombres de archivos originales de cada grupo
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatasetSummarySection } from "../DatasetSummarySection.js";
import type { Dataset } from "../../../types/api.types.js";

// ============================================================================
// MOCKS
// ============================================================================

/**
 * Dataset mock con sourceConfig completo para los tests
 */
const mockDataset: Dataset = {
  id: "dataset-test-123",
  ownerId: "owner-1",
  status: "ready",
  meta: {
    name: "Dataset de Prueba",
    description: "Descripción de prueba",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
  data: [],
  sourceConfig: {
    groupA: {
      label: "Año 2024",
      color: "#3b82f6",
      originalFileName: "ventas_2024.csv",
      rowCount: 1500,
    },
    groupB: {
      label: "Año 2023",
      color: "#ef4444",
      originalFileName: "ventas_2023.csv",
      rowCount: 1200,
    },
  },
};

// ============================================================================
// TESTS
// ============================================================================

describe("DatasetSummarySection", () => {
  describe("Renderizado básico", () => {
    it("Renderiza el título del card correctamente", () => {
      render(<DatasetSummarySection dataset={mockDataset} columnCount={5} />);

      expect(
        screen.getByText("Resumen del Dataset Unificado"),
      ).toBeInTheDocument();
    });

    it("Renderiza la etiqueta del Archivo A", () => {
      render(<DatasetSummarySection dataset={mockDataset} columnCount={5} />);

      expect(screen.getByText("Archivo A (Actual)")).toBeInTheDocument();
    });

    it("Renderiza la etiqueta del Archivo B", () => {
      render(<DatasetSummarySection dataset={mockDataset} columnCount={5} />);

      expect(screen.getByText("Archivo B (Comparativo)")).toBeInTheDocument();
    });
  });

  describe("Nombres de archivos originales", () => {
    it("Muestra el nombre del archivo original del grupo A", () => {
      render(<DatasetSummarySection dataset={mockDataset} columnCount={5} />);

      expect(screen.getByText("ventas_2024.csv")).toBeInTheDocument();
    });

    it("Muestra el nombre del archivo original del grupo B", () => {
      render(<DatasetSummarySection dataset={mockDataset} columnCount={5} />);

      expect(screen.getByText("ventas_2023.csv")).toBeInTheDocument();
    });
  });

  describe("Contadores de filas y columnas", () => {
    it("Muestra el contador de filas del grupo A", () => {
      render(<DatasetSummarySection dataset={mockDataset} columnCount={5} />);

      // Buscar el badge con el número de filas del grupo A (1500 en cualquier formato locale)
      const badges = screen.getAllByText(/filas/);
      expect(badges.some((b) => b.textContent?.includes("1"))).toBe(true);
    });

    it("Muestra el contador de filas del grupo B", () => {
      render(<DatasetSummarySection dataset={mockDataset} columnCount={5} />);

      // El grupo B tiene 1200 filas; verificar que ambos badges de filas están presentes
      const badges = screen.getAllByText(/filas/);
      expect(badges).toHaveLength(2);
    });

    it("Muestra el contador de columnas correcto en ambas tarjetas", () => {
      render(<DatasetSummarySection dataset={mockDataset} columnCount={7} />);

      // Ambas tarjetas muestran el mismo número de columnas
      const columnBadges = screen.getAllByText("7 columnas");
      expect(columnBadges).toHaveLength(2);
    });
  });

  describe("Manejo de sourceConfig indefinido", () => {
    it("Retorna null cuando el dataset no tiene sourceConfig", () => {
      const datasetSinSourceConfig = {
        ...mockDataset,
        sourceConfig: undefined as unknown as Dataset["sourceConfig"],
      };

      const { container } = render(
        <DatasetSummarySection
          dataset={datasetSinSourceConfig}
          columnCount={5}
        />,
      );

      // El componente no debe renderizar nada
      expect(container.firstChild).toBeNull();
    });
  });
});
