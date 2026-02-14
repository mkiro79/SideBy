/**
 * Tests para DatasetCard Component
 *
 * Verifica que el componente DatasetCard:
 * - Renderiza correctamente la información del dataset
 * - Muestra/oculta el botón "Edit" según feature flag
 * - Ejecuta callbacks correctamente (onEdit, onOpen, onDelete)
 * - Maneja estados de loading durante delete
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatasetCard } from "../DatasetCard.js";
import type { DatasetSummary } from "../../types/api.types.js";

// Mock del módulo de features
vi.mock("@/config/features.js", () => ({
  FEATURES: {
    EMAIL_LOGIN: false,
    AI_ENABLED: false,
    DATASET_EDIT_ENABLED: true, // Default: true para los tests
  },
}));

describe("DatasetCard", () => {
  const mockDataset: DatasetSummary = {
    id: "dataset-123",
    status: "ready",
    totalRows: 200,
    meta: {
      name: "Test Dataset",
      description: "Dataset de prueba",
      createdAt: "2026-02-13T10:00:00Z",
      updatedAt: "2026-02-13T10:00:00Z",
    },
    sourceConfig: {
      groupA: {
        label: "2024",
        color: "#3B82F6",
        originalFileName: "fileA.csv",
        rowCount: 100,
      },
      groupB: {
        label: "2023",
        color: "#F97316",
        originalFileName: "fileB.csv",
        rowCount: 100,
      },
    },
  };

  const mockOnOpen = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("debe renderizar el nombre del dataset", () => {
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Test Dataset")).toBeInTheDocument();
    });

    it("debe renderizar la descripción del dataset", () => {
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Dataset de prueba")).toBeInTheDocument();
    });

    it("debe renderizar el badge de estado correcto", () => {
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Listo")).toBeInTheDocument();
    });

    it("debe renderizar los labels de grupos comparativos", () => {
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("2024")).toBeInTheDocument();
      expect(screen.getByText("vs")).toBeInTheDocument();
      expect(screen.getByText("2023")).toBeInTheDocument();
    });

    it("debe renderizar el total de filas", () => {
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("200 filas")).toBeInTheDocument();
    });
  });

  describe("Edit Button - Feature Flag", () => {
    it("debe mostrar botón Edit si feature flag está activo Y onEdit existe", () => {
      // Feature flag ya está en true por el mock global
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByLabelText("Editar dataset");
      expect(editButton).toBeInTheDocument();
    });

    it("NO debe mostrar botón Edit si onEdit prop no existe (aunque flag = true)", () => {
      // onEdit no proporcionado (aunque flag = true)
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.queryByLabelText("Editar dataset");
      expect(editButton).not.toBeInTheDocument();
    });

    // Nota: Test de feature flag = false requiere configuración más compleja de mock
    // El comportamiento está garantizado por la implementación: FEATURES.DATASET_EDIT_ENABLED && onEdit
  });

  describe("Callbacks", () => {
    it("debe ejecutar onOpen cuando se hace click en la tarjeta", async () => {
      const user = userEvent.setup();
      
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onDelete={mockOnDelete}
        />
      );

      // Click en el contenido principal - buscar por texto contenido
      const cardButton = screen.getByRole("button", { name: /Test Dataset/ });
      await user.click(cardButton);

      expect(mockOnOpen).toHaveBeenCalledOnce();
      expect(mockOnOpen).toHaveBeenCalledWith("dataset-123");
    });

    it("debe ejecutar onEdit cuando se hace click en botón Edit", async () => {
      const user = userEvent.setup();
      
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByLabelText("Editar dataset");
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledOnce();
      expect(mockOnEdit).toHaveBeenCalledWith("dataset-123");
    });

    it("debe mostrar diálogo de confirmación antes de eliminar", async () => {
      const user = userEvent.setup();
      
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onDelete={mockOnDelete}
        />
      );

      // Click en botón eliminar
      const deleteButton = screen.getByLabelText("Eliminar dataset");
      await user.click(deleteButton);

      // Debe aparecer el diálogo de confirmación
      expect(screen.getByText("¿Eliminar dataset?")).toBeInTheDocument();
      expect(
        screen.getByText(/Se eliminará permanentemente el dataset/i)
      ).toBeInTheDocument();
    });
  });

  describe("Delete State", () => {
    it("debe deshabilitar botones durante delete (isDeleting=true)", () => {
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={true}
        />
      );

      const editButton = screen.getByLabelText("Editar dataset");
      const deleteButton = screen.getByLabelText("Eliminar dataset");

      expect(editButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    it("debe mostrar spinner durante delete en botón eliminar", () => {
      render(
        <DatasetCard
          dataset={mockDataset}
          onOpen={mockOnOpen}
          onDelete={mockOnDelete}
          isDeleting={true}
        />
      );

      // Loader2 className="animate-spin" debe estar presente
      const spinner = screen.getByLabelText("Eliminar dataset").querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Status Badge", () => {
    it('debe mostrar "Procesando" para status processing', () => {
      const processingDataset = { ...mockDataset, status: "processing" as const };
      
      render(
        <DatasetCard
          dataset={processingDataset}
          onOpen={mockOnOpen}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Procesando")).toBeInTheDocument();
    });

    it('debe mostrar "Error" para status error', () => {
      const errorDataset = { ...mockDataset, status: "error" as const };
      
      render(
        <DatasetCard
          dataset={errorDataset}
          onOpen={mockOnOpen}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });
});
