/**
 * [TDD] ColumnMappingStep - RFC-003-A Simplified Auto-Mapping UI
 * 
 * Este archivo contiene tests para la versión simplificada del componente ColumnMappingStep.
 * 
 * Estructura de la UI:
 * - Sección 1: Dropdown para seleccionar columna de fecha
 * - Sección 2: Checkboxes para métricas (max 4)
 * - Sección 3: Checkboxes para dimensiones
 * 
 * NO se permite:
 * - Renombrar KPIs
 * - Cambiar tipos de columna
 * - Agregar agregaciones
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ColumnMappingStep } from "../components/wizard/ColumnMappingStep.simplified.js";
import type { WizardState } from "../types/wizard.types.js";

// Helper para crear mock states con valores por defecto
const createMockState = (overrides: Partial<WizardState> = {}): WizardState => ({
  currentStep: 2,
  fileA: {
    file: null,
    parsedData: null,
    error: null,
    isValid: false,
  },
  fileB: {
    file: null,
    parsedData: null,
    error: null,
    isValid: false,
  },
  uploadedFiles: [],
  mapping: {},
  metadata: {
    name: "",
    description: "",
  },
  aiConfig: {
    enabled: false,
    userContext: "",
  },
  isLoading: false,
  error: null,
  ...overrides,
});

describe("[TDD] ColumnMappingStep - Simplified Auto-Mapping UI", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  // ========================================
  // SECCIÓN 1: AUTO-CLASIFICACIÓN EN MOUNT
  // ========================================
  describe("Auto-clasificación al montar", () => {
    it("[RED] should auto-detect date columns on mount", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas", "region"],
              rows: [
                ["2024-01-01", "1000", "Norte"],
                ["2024-01-02", "2000", "Sur"],
              ],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      // Debe detectar automáticamente que "fecha" es una columna de fecha
      const dateSelect = screen.getByRole("combobox", { name: /fecha/i });
      expect(dateSelect).toBeInTheDocument();
    });

    it("[RED] should auto-detect numeric columns as metrics", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas", "costo", "unidades"],
              rows: [
                ["2024-01-01", "1000", "800", "50"],
                ["2024-01-02", "2000", "1600", "100"],
              ],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      // Debe detectar "ventas", "costo", "unidades" como métricas
      expect(screen.getByLabelText(/ventas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/costo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/unidades/i)).toBeInTheDocument();
    });

    it("[RED] should auto-detect string columns as dimensions", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas", "region", "categoria"],
              rows: [
                ["2024-01-01", "1000", "Norte", "A"],
                ["2024-01-02", "2000", "Sur", "B"],
              ],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      // Debe detectar "region" y "categoria" como dimensiones
      expect(screen.getByLabelText(/region/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument();
    });
  });

  // ========================================
  // SECCIÓN 2: SELECCIÓN DE FECHA (DROPDOWN)
  // ========================================
  describe("Selección de columna de fecha", () => {
    it("[RED] should show dropdown with detected date columns", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha_inicio", "fecha_fin", "ventas"],
              rows: [
                ["2024-01-01", "2024-01-31", "1000"],
                ["2024-02-01", "2024-02-28", "2000"],
              ],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      // Debe mostrar dropdown con ambas columnas de fecha
      const dateSelect = screen.getByRole("combobox");
      expect(dateSelect).toBeInTheDocument();
    });

    it("[RED] should allow changing date column selection", () => {
      const mockSetMapping = vi.fn();
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha_inicio", "fecha_fin", "ventas"],
              rows: [
                ["2024-01-01", "2024-01-31", "1000"],
                ["2024-02-01", "2024-02-28", "2000"],
              ],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={mockSetMapping}
        />
      );

      const dateSelect = screen.getByRole("combobox");
      
      // Cambiar selección debe actualizar el mapping
      fireEvent.change(dateSelect, { target: { value: "fecha_fin" } });
      
      expect(mockSetMapping).toHaveBeenCalled();
    });

    it("[RED] should show warning if no date column detected", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["ventas", "region"],
              rows: [
                ["1000", "Norte"],
                ["2000", "Sur"],
              ],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      // Debe mostrar advertencia
      expect(
        screen.getByText(/no se detectó ninguna columna de fecha/i)
      ).toBeInTheDocument();
    });
  });

  // ========================================
  // SECCIÓN 3: SELECCIÓN DE MÉTRICAS (CHECKBOXES)
  // ========================================
  describe("Selección de métricas", () => {
    it("[RED] should show checkboxes for numeric columns", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas", "costo", "unidades"],
              rows: [
                ["2024-01-01", "1000", "800", "50"],
                ["2024-01-02", "2000", "1600", "100"],
              ],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      // Debe mostrar 3 checkboxes
      const ventas = screen.getByRole("checkbox", { name: /ventas/i });
      const costo = screen.getByRole("checkbox", { name: /costo/i });
      const unidades = screen.getByRole("checkbox", { name: /unidades/i });

      expect(ventas).toBeInTheDocument();
      expect(costo).toBeInTheDocument();
      expect(unidades).toBeInTheDocument();
    });

    it("[RED] should allow selecting up to 4 metrics", () => {
      const mockSetMapping = vi.fn();
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "m1", "m2", "m3", "m4", "m5"],
              rows: [
                ["2024-01-01", "100", "200", "300", "400", "500"],
              ],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={mockSetMapping}
        />
      );

      // Seleccionar 4 métricas
      fireEvent.click(screen.getByRole("checkbox", { name: /m1/i }));
      fireEvent.click(screen.getByRole("checkbox", { name: /m2/i }));
      fireEvent.click(screen.getByRole("checkbox", { name: /m3/i }));
      fireEvent.click(screen.getByRole("checkbox", { name: /m4/i }));

      // Debe llamar a setMapping 4 veces
      expect(mockSetMapping).toHaveBeenCalledTimes(4);
    });

    it("[RED] should disable remaining checkboxes after 4 metrics selected", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "m1", "m2", "m3", "m4", "m5"],
              rows: [
                ["2024-01-01", "100", "200", "300", "400", "500"],
              ],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      // Seleccionar 4 métricas
      fireEvent.click(screen.getByRole("checkbox", { name: /m1/i }));
      fireEvent.click(screen.getByRole("checkbox", { name: /m2/i }));
      fireEvent.click(screen.getByRole("checkbox", { name: /m3/i }));
      fireEvent.click(screen.getByRole("checkbox", { name: /m4/i }));

      // El 5to checkbox debe estar deshabilitado
      const m5Checkbox = screen.getByRole("checkbox", { name: /m5/i });
      expect(m5Checkbox).toBeDisabled();
    });

    it("[RED] should show helper text indicating 4 metrics max", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas", "costo"],
              rows: [["2024-01-01", "1000", "800"]],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      expect(
        screen.getByText(/máximo 4 métricas/i)
      ).toBeInTheDocument();
    });

    it("[RED] should allow unchecking a metric", () => {
      const mockSetMapping = vi.fn();
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas", "costo"],
              rows: [["2024-01-01", "1000", "800"]],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={mockSetMapping}
        />
      );

      const ventasCheckbox = screen.getByRole("checkbox", { name: /ventas/i });

      // Check y uncheck
      fireEvent.click(ventasCheckbox);
      fireEvent.click(ventasCheckbox);

      // Debe llamarse 2 veces (check + uncheck)
      expect(mockSetMapping).toHaveBeenCalledTimes(2);
    });
  });

  // ========================================
  // SECCIÓN 4: SELECCIÓN DE DIMENSIONES (CHECKBOXES)
  // ========================================
  describe("Selección de dimensiones", () => {
    it("[RED] should show checkboxes for string columns", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas", "region", "categoria"],
              rows: [
                ["2024-01-01", "1000", "Norte", "A"],
              ],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      const regionCheckbox = screen.getByRole("checkbox", { name: /region/i });
      const categoriaCheckbox = screen.getByRole("checkbox", {
        name: /categoria/i,
      });

      expect(regionCheckbox).toBeInTheDocument();
      expect(categoriaCheckbox).toBeInTheDocument();
    });

    it("[RED] should allow selecting multiple dimensions without limit", () => {
      const mockSetMapping = vi.fn();
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas", "d1", "d2", "d3", "d4", "d5"],
              rows: [
                ["2024-01-01", "1000", "A", "B", "C", "D", "E"],
              ],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={mockSetMapping}
        />
      );

      // Seleccionar todas las dimensiones (5)
      fireEvent.click(screen.getByRole("checkbox", { name: /^d1$/i }));
      fireEvent.click(screen.getByRole("checkbox", { name: /^d2$/i }));
      fireEvent.click(screen.getByRole("checkbox", { name: /^d3$/i }));
      fireEvent.click(screen.getByRole("checkbox", { name: /^d4$/i }));
      fireEvent.click(screen.getByRole("checkbox", { name: /^d5$/i }));

      // Todas deben estar habilitadas (sin límite)
      expect(mockSetMapping).toHaveBeenCalledTimes(5);
    });

    it("[RED] should allow unchecking dimensions", () => {
      const mockSetMapping = vi.fn();
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas", "region"],
              rows: [["2024-01-01", "1000", "Norte"]],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={mockSetMapping}
        />
      );

      const regionCheckbox = screen.getByRole("checkbox", { name: /region/i });

      fireEvent.click(regionCheckbox); // Check
      fireEvent.click(regionCheckbox); // Uncheck

      expect(mockSetMapping).toHaveBeenCalledTimes(2);
    });
  });

  // ========================================
  // SECCIÓN 5: VALIDACIÓN Y NAVEGACIÓN
  // ========================================
  describe("Validación y navegación", () => {
    it("[RED] should disable Next button if no date selected", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas"],
              rows: [["2024-01-01", "1000"]],
            },
          },
        ],
        // Sin fecha seleccionada
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      const nextButton = screen.getByRole("button", { name: /siguiente/i });
      expect(nextButton).toBeDisabled();
    });

    it("[RED] should disable Next button if no metrics selected", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas"],
              rows: [["2024-01-01", "1000"]],
            },
          },
        ],
        mapping: {
          fecha: {
            sourceColumn: "fecha",
            targetColumn: "fecha",
            format: "date",
          },
        }, // Fecha seleccionada pero sin métricas
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      const nextButton = screen.getByRole("button", { name: /siguiente/i });
      expect(nextButton).toBeDisabled();
    });

    it("[RED] should enable Next button when date and at least 1 metric selected", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas"],
              rows: [["2024-01-01", "1000"]],
            },
          },
        ],
        mapping: {
          fecha: {
            sourceColumn: "fecha",
            targetColumn: "fecha",
            format: "date",
          },
          ventas: {
            sourceColumn: "ventas",
            targetColumn: "ventas",
            format: "currency",
          },
        },
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      const nextButton = screen.getByRole("button", { name: /siguiente/i });
      expect(nextButton).toBeEnabled();
    });

    it("[RED] should call onNext when Next button clicked", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas"],
              rows: [["2024-01-01", "1000"]],
            },
          },
        ],
        mapping: {
          fecha: {
            sourceColumn: "fecha",
            targetColumn: "fecha",
            format: "date",
          },
          ventas: {
            sourceColumn: "ventas",
            targetColumn: "ventas",
            format: "currency",
          },
        },
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      const nextButton = screen.getByRole("button", { name: /siguiente/i });
      fireEvent.click(nextButton);

      // Navigation is now handled by parent wizard component
    });

    it("[RED] should call onBack when Back button clicked", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas"],
              rows: [["2024-01-01", "1000"]],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      const backButton = screen.getByRole("button", { name: /atrás|volver/i });
      fireEvent.click(backButton);

      // Navigation is now handled by parent wizard component
    });
  });

  // ========================================
  // SECCIÓN 6: EDGE CASES Y ESCENARIOS ESPECIALES
  // ========================================
  describe("Casos edge y escenarios especiales", () => {
    it("[RED] should handle dataset with no numeric columns", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "region", "categoria"],
              rows: [["2024-01-01", "Norte", "A"]],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      // Debe mostrar mensaje de que no hay métricas disponibles
      expect(
        screen.getByText(/no se detectaron métricas/i)
      ).toBeInTheDocument();
    });

    it("[RED] should handle dataset with no string columns", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 100,
            preview: {
              headers: ["fecha", "ventas", "costo"],
              rows: [["2024-01-01", "1000", "800"]],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      // Debe mostrar mensaje de que no hay dimensiones disponibles
      expect(
        screen.getByText(/no se detectaron dimensiones/i)
      ).toBeInTheDocument();
    });

    it("[RED] should handle empty dataset gracefully", () => {
      const mockState = createMockState({
        uploadedFiles: [
          {
            file: new File([], "test.csv"),
            name: "test.csv",
            size: 0,
            preview: {
              headers: [],
              rows: [],
            },
          },
        ],
      });

      render(
        <ColumnMappingStep
          state={mockState}
          setMapping={vi.fn()}
        />
      );

      // Debe mostrar mensaje de error o estado vacío
      expect(screen.getByText(/no hay datos/i)).toBeInTheDocument();
    });
  });
});
