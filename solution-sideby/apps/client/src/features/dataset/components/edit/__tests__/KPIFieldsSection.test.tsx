import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KPIFieldsSection } from "../KPIFieldsSection.js";
import {
  datasetEditSchema,
  type DatasetEditFormData,
} from "../../../schemas/datasetEdit.schema.js";

/**
 * Available columns simuladas para los tests
 */
const mockAvailableColumns = [
  "region",
  "fecha",
  "ventas",
  "costos",
  "unidades",
  "margen",
];

/**
 * Wrapper component para proveer React Hook Form context
 */
const FormWrapper = () => {
  const {
    control,
    formState: { errors },
  } = useForm<DatasetEditFormData>({
    resolver: zodResolver(datasetEditSchema),
    mode: "onBlur",
    defaultValues: {
      meta: { name: "Dataset Test", description: "" },
      schemaMapping: {
        dimensionField: "region",
        dateField: "fecha",
        kpiFields: [
          {
            id: "kpi1",
            columnName: "ventas",
            label: "Ventas Totales",
            format: "currency",
          },
          {
            id: "kpi2",
            columnName: "unidades",
            label: "Unidades Vendidas",
            format: "number",
          },
        ],
      },
      dashboardLayout: {
        templateId: "sideby_executive",
        highlightedKpis: [],
      },
      aiConfig: { enabled: false, userContext: "" },
    },
  });

  return (
    <KPIFieldsSection
      control={control}
      errors={errors}
      availableColumns={mockAvailableColumns}
    />
  );
};

describe("KPIFieldsSection", () => {
  describe("Renderizado", () => {
    it("Renderiza el card con título correcto", () => {
      render(<FormWrapper />);

      expect(screen.getByText("Campos KPI y Dimensión")).toBeInTheDocument();
    });

    it("Renderiza el campo Dimension Field con select", () => {
      render(<FormWrapper />);

      expect(screen.getByText(/Campo de Dimensión/i)).toBeInTheDocument();
      
      // Verificar que hay un trigger del Select (button con role combobox)
      const dimensionSelect = screen.getByRole("combobox", { name: /Campo de Dimensión/i });
      expect(dimensionSelect).toBeInTheDocument();
    });

    it("Renderiza el campo Date Field con select (opcional)", () => {
      render(<FormWrapper />);

      expect(screen.getByText(/Campo de Fecha/i)).toBeInTheDocument();
      expect(screen.getByText("(opcional)")).toBeInTheDocument();
      
      const dateSelect = screen.getByRole("combobox", { name: /Campo de Fecha/i });
      expect(dateSelect).toBeInTheDocument();
    });

    it("Renderiza la tabla de KPI Fields", () => {
      render(<FormWrapper />);

      expect(screen.getByText("Campos KPI")).toBeInTheDocument();
      
      // Headers de la tabla
      expect(screen.getByText("Nombre Original")).toBeInTheDocument();
      expect(screen.getByText("Label")).toBeInTheDocument();
      expect(screen.getByText("Formato")).toBeInTheDocument();
    });

    it("Renderiza las filas de KPI existentes", () => {
      render(<FormWrapper />);

      // Verificar que aparecen los nombres originales de las columnas
      expect(screen.getByText("ventas")).toBeInTheDocument();
      expect(screen.getByText("unidades")).toBeInTheDocument();
      
      // Verificar que los inputs de label tienen los valores correctos
      const labelInputs = screen.getAllByRole("textbox");
      const ventasLabelInput = labelInputs.find(
        (input) => (input as HTMLInputElement).value === "Ventas Totales",
      );
      const unidadesLabelInput = labelInputs.find(
        (input) => (input as HTMLInputElement).value === "Unidades Vendidas",
      );

      expect(ventasLabelInput).toBeDefined();
      expect(unidadesLabelInput).toBeDefined();
    });
  });

  describe("Dimension Field Select", () => {
    it("Muestra el valor seleccionado actual", () => {
      render(<FormWrapper />);

      const dimensionSelect = screen.getByRole("combobox", { name: /Campo de Dimensión/i });
      
      // El trigger del Select muestra el valor actual
      expect(dimensionSelect).toHaveTextContent("region");
    });

    it("Tiene el indicador de campo requerido", () => {
      render(<FormWrapper />);

      // Buscar el asterisco rojo (*)
      const labels = screen.getAllByText("*");
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe("Date Field Select", () => {
    it("Muestra el valor seleccionado actual", () => {
      render(<FormWrapper />);

      const dateSelect = screen.getByRole("combobox", { name: /Campo de Fecha/i });
      
      // El trigger del Select muestra el valor actual
      expect(dateSelect).toHaveTextContent("fecha");
    });

    it("Muestra indicador de campo opcional", () => {
      render(<FormWrapper />);

      expect(screen.getByText("(opcional)")).toBeInTheDocument();
    });
  });

  describe("KPI Fields Table", () => {
    it("Cada fila muestra el nombre original en monospace", () => {
      render(<FormWrapper />);

      const ventasCell = screen.getByText("ventas");
      const unidadesCell = screen.getByText("unidades");

      expect(ventasCell).toBeInTheDocument();
      expect(unidadesCell).toBeInTheDocument();
      
      // Verificar que tienen la clase font-mono (styling)
      expect(ventasCell.className).toContain("font-mono");
      expect(unidadesCell.className).toContain("font-mono");
    });

    it("Cada fila tiene un input editable para el label", () => {
      render(<FormWrapper />);

      const labelInputs = screen.getAllByRole("textbox");
      
      // Deberían haber 2 inputs (uno por cada KPI)
      expect(labelInputs.length).toBeGreaterThanOrEqual(2);
      
      // Verificar valores
      const ventasLabelInput = labelInputs.find(
        (input) => (input as HTMLInputElement).value === "Ventas Totales",
      ) as HTMLInputElement;
      const unidadesLabelInput = labelInputs.find(
        (input) => (input as HTMLInputElement).value === "Unidades Vendidas",
      ) as HTMLInputElement;

      expect(ventasLabelInput).toBeDefined();
      expect(unidadesLabelInput).toBeDefined();
      
      // Verificar que son editables
      expect(ventasLabelInput.readOnly).toBe(false);
      expect(unidadesLabelInput.readOnly).toBe(false);
    });

    it("Cada fila tiene un select para el formato", () => {
      render(<FormWrapper />);

      // Buscar todos los combobox (dimension + date + 2 format selects)
      const allSelects = screen.getAllByRole("combobox");
      
      // Debería haber al menos 4 selects: dimension, date, format1, format2
      expect(allSelects.length).toBeGreaterThanOrEqual(4);
      
      // Verificar que hay selects con valores de formato
      const currencySelect = allSelects.find(
        (select) => select.textContent?.includes("Moneda"),
      );
      const numberSelect = allSelects.find(
        (select) => select.textContent?.includes("Número"),
      );

      expect(currencySelect).toBeDefined();
      expect(numberSelect).toBeDefined();
    });
  });

  describe("Valores iniciales", () => {
    it("Los campos tienen los valores por defecto correctos", () => {
      render(<FormWrapper />);

      // Dimension field
      const dimensionSelect = screen.getByRole("combobox", { name: /Campo de Dimensión/i });
      expect(dimensionSelect).toHaveTextContent("region");

      // Date field
      const dateSelect = screen.getByRole("combobox", { name: /Campo de Fecha/i });
      expect(dateSelect).toHaveTextContent("fecha");

      // KPI Fields en la tabla
      expect(screen.getByText("ventas")).toBeInTheDocument();
      expect(screen.getByText("unidades")).toBeInTheDocument();
    });
  });

  describe("Estructura de tabla", () => {
    it("Renderiza la tabla con estructura semántica correcta", () => {
      render(<FormWrapper />);

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // Headers
      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(3); // Nombre Original, Label, Formato

      // Rows (2 KPIs)
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeGreaterThanOrEqual(3); // Header + 2 data rows
    });

    it("Muestra mensaje cuando no hay KPI fields", () => {
      // Crear un wrapper sin KPI fields
      const EmptyFormWrapper = () => {
        const {
          control,
          formState: { errors },
        } = useForm<DatasetEditFormData>({
          resolver: zodResolver(datasetEditSchema),
          defaultValues: {
            meta: { name: "Dataset Test", description: "" },
            schemaMapping: {
              dimensionField: "region",
              dateField: "",
              kpiFields: [],
            },
            dashboardLayout: {
              templateId: "sideby_executive",
              highlightedKpis: [],
            },
            aiConfig: { enabled: false, userContext: "" },
          },
        });

        return (
          <KPIFieldsSection
            control={control}
            errors={errors}
            availableColumns={mockAvailableColumns}
          />
        );
      };

      render(<EmptyFormWrapper />);

      expect(
        screen.getByText("No hay campos KPI configurados"),
      ).toBeInTheDocument();
    });
  });
});
