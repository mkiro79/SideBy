import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GroupConfigFields } from "../GroupConfigFields.js";
import {
  datasetEditSchema,
  type DatasetEditFormData,
} from "../../../schemas/datasetEdit.schema.js";

/**
 * Wrapper que provee el contexto de React Hook Form al componente
 */
const FormWrapper = () => {
  const {
    control,
    formState: { errors },
  } = useForm<DatasetEditFormData>({
    resolver: zodResolver(datasetEditSchema),
    defaultValues: {
      meta: { name: "Dataset Test", description: "" },
      sourceConfig: {
        groupA: {
          label: "Grupo A",
          color: "#3b82f6",
        },
        groupB: {
          label: "Grupo B",
          color: "#ef4444",
        },
      },
      schemaMapping: {
        dimensionField: "region",
        dateField: "",
        kpiFields: [
          {
            id: "kpi1",
            columnName: "ventas",
            label: "Ventas",
            format: "currency",
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

  return <GroupConfigFields control={control} errors={errors} />;
};

describe("GroupConfigFields", () => {
  describe("Renderizado", () => {
    it("Renderiza el card con título correcto", () => {
      render(<FormWrapper />);

      expect(screen.getByText("Configuración de grupos")).toBeInTheDocument();
    });

    it("Muestra el subtítulo descriptivo", () => {
      render(<FormWrapper />);

      expect(
        screen.getByText(/Personaliza etiquetas y colores/i),
      ).toBeInTheDocument();
    });

    it("Renderiza la sección de Grupo A con sus campos", () => {
      render(<FormWrapper />);

      expect(screen.getByText("Grupo A")).toBeInTheDocument();

      const groupALabelInput = document.querySelector("#groupA-label") as HTMLInputElement;
      expect(groupALabelInput).toBeInTheDocument();
      expect(groupALabelInput.value).toBe("Grupo A");

      const groupAColorPicker = document.querySelector("#groupA-color") as HTMLInputElement;
      expect(groupAColorPicker).toBeInTheDocument();
      expect(groupAColorPicker.value).toBe("#3b82f6");
    });

    it("Renderiza la sección de Grupo B con sus campos", () => {
      render(<FormWrapper />);

      expect(screen.getByText("Grupo B")).toBeInTheDocument();

      const groupBLabelInput = document.querySelector("#groupB-label") as HTMLInputElement;
      expect(groupBLabelInput).toBeInTheDocument();
      expect(groupBLabelInput.value).toBe("Grupo B");

      const groupBColorPicker = document.querySelector("#groupB-color") as HTMLInputElement;
      expect(groupBColorPicker).toBeInTheDocument();
      expect(groupBColorPicker.value).toBe("#ef4444");
    });
  });

  describe("Estado habilitado", () => {
    it("Los campos de label están habilitados", () => {
      render(<FormWrapper />);

      const groupALabelInput = document.querySelector("#groupA-label") as HTMLInputElement;
      const groupBLabelInput = document.querySelector("#groupB-label") as HTMLInputElement;

      expect(groupALabelInput.disabled).toBe(false);
      expect(groupBLabelInput.disabled).toBe(false);
    });

    it("Los color pickers están habilitados", () => {
      render(<FormWrapper />);

      const groupAColorPicker = document.querySelector("#groupA-color") as HTMLInputElement;
      const groupBColorPicker = document.querySelector("#groupB-color") as HTMLInputElement;

      expect(groupAColorPicker.disabled).toBe(false);
      expect(groupBColorPicker.disabled).toBe(false);
    });
  });

  describe("Contador de caracteres", () => {
    it("Muestra el contador de caracteres para Grupo A y B", () => {
      render(<FormWrapper />);

      // "Grupo A" = 7 chars, "Grupo B" = 7 chars  "7/50 caracteres"
      const counters = screen.getAllByText(/\/50 caracteres/);
      expect(counters.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Valores por defecto", () => {
    it("Muestra los valores iniciales correctos en todos los campos", () => {
      render(<FormWrapper />);

      const groupALabelInput = document.querySelector("#groupA-label") as HTMLInputElement;
      const groupAColorPicker = document.querySelector("#groupA-color") as HTMLInputElement;
      const groupBLabelInput = document.querySelector("#groupB-label") as HTMLInputElement;
      const groupBColorPicker = document.querySelector("#groupB-color") as HTMLInputElement;

      expect(groupALabelInput.value).toBe("Grupo A");
      expect(groupAColorPicker.value).toBe("#3b82f6");
      expect(groupBLabelInput.value).toBe("Grupo B");
      expect(groupBColorPicker.value).toBe("#ef4444");
    });
  });

  describe("Accesibilidad", () => {
    it("Todos los inputs principales existen en el DOM", () => {
      render(<FormWrapper />);

      expect(document.querySelector("#groupA-label")).toBeInTheDocument();
      expect(document.querySelector("#groupB-label")).toBeInTheDocument();
      expect(document.querySelector("#groupA-color")).toBeInTheDocument();
      expect(document.querySelector("#groupB-color")).toBeInTheDocument();
    });

    it("Los color inputs tienen el type correcto", () => {
      render(<FormWrapper />);

      const groupAColorPicker = document.querySelector("#groupA-color") as HTMLInputElement;
      const groupBColorPicker = document.querySelector("#groupB-color") as HTMLInputElement;

      expect(groupAColorPicker.type).toBe("color");
      expect(groupBColorPicker.type).toBe("color");
    });
  });
});
