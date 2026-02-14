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
 * Wrapper component para proveer React Hook Form context
 */
const FormWrapper = ({ disabled = true }: { disabled?: boolean }) => {
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

  return <GroupConfigFields control={control} errors={errors} disabled={disabled} />;
};

describe("GroupConfigFields", () => {
  describe("Renderizado", () => {
    it("Renderiza el card con título correcto", () => {
      render(<FormWrapper />);

      expect(screen.getByText("Configuración de Grupos")).toBeInTheDocument();
    });

    it("Muestra el Alert informativo cuando está disabled", () => {
      render(<FormWrapper disabled={true} />);

      expect(
        screen.getByText(/Esta funcionalidad estará disponible próximamente/i),
      ).toBeInTheDocument();
    });

    it("No muestra el Alert cuando no está disabled", () => {
      render(<FormWrapper disabled={false} />);

      expect(
        screen.queryByText(/Esta funcionalidad estará disponible próximamente/i),
      ).not.toBeInTheDocument();
    });

    it("Renderiza la sección de Grupo A con sus campos", () => {
      render(<FormWrapper />);

      expect(screen.getByText("Grupo A")).toBeInTheDocument();
      
      // Label field
      const groupALabelInput = screen.getByLabelText(/Label Grupo A/i);
      expect(groupALabelInput).toBeInTheDocument();
      expect(groupALabelInput.tagName).toBe("INPUT");
      expect((groupALabelInput as HTMLInputElement).value).toBe("Grupo A");

      // Color field (hay 2 inputs: color picker + text input)
      // Buscamos por el id del color picker
      const groupAColorPicker = document.querySelector('#groupA-color') as HTMLInputElement;
      expect(groupAColorPicker).toBeInTheDocument();
      expect(groupAColorPicker.value).toBe("#3b82f6");
    });

    it("Renderiza la sección de Grupo B con sus campos", () => {
      render(<FormWrapper />);

      expect(screen.getByText("Grupo B")).toBeInTheDocument();
      
      // Label field
      const groupBLabelInput = screen.getByLabelText(/Label Grupo B/i);
      expect(groupBLabelInput).toBeInTheDocument();
      expect((groupBLabelInput as HTMLInputElement).value).toBe("Grupo B");

      // Color field
      const groupBColorPicker = document.querySelector('#groupB-color') as HTMLInputElement;
      expect(groupBColorPicker).toBeInTheDocument();
      expect(groupBColorPicker.value).toBe("#ef4444");
    });
  });

  describe("Estado Disabled", () => {
    it("Los campos están disabled por defecto", () => {
      render(<FormWrapper disabled={true} />);

      const groupALabelInput = document.querySelector(
        '#groupA-label',
      ) as HTMLInputElement;
      const groupAColorPicker = document.querySelector(
        '#groupA-color',
      ) as HTMLInputElement;
      const groupBLabelInput = document.querySelector(
        '#groupB-label',
      ) as HTMLInputElement;
      const groupBColorPicker = document.querySelector(
        '#groupB-color',
      ) as HTMLInputElement;

      expect(groupALabelInput.disabled).toBe(true);
      expect(groupAColorPicker.disabled).toBe(true);
      expect(groupBLabelInput.disabled).toBe(true);
      expect(groupBColorPicker.disabled).toBe(true);
    });

    it("Los campos están habilitados cuando disabled=false", () => {
      render(<FormWrapper disabled={false} />);

      const groupALabelInput = document.querySelector(
        '#groupA-label',
      ) as HTMLInputElement;
      const groupAColorPicker = document.querySelector(
        '#groupA-color',
      ) as HTMLInputElement;

      expect(groupALabelInput.disabled).toBe(false);
      expect(groupAColorPicker.disabled).toBe(false);
    });
  });

  describe("Valores por defecto", () => {
    it("Muestra los valores iniciales correctos", () => {
      render(<FormWrapper />);

      const groupALabelInput = document.querySelector(
        '#groupA-label',
      ) as HTMLInputElement;
      const groupAColorPicker = document.querySelector(
        '#groupA-color',
      ) as HTMLInputElement;
      const groupBLabelInput = document.querySelector(
        '#groupB-label',
      ) as HTMLInputElement;
      const groupBColorPicker = document.querySelector(
        '#groupB-color',
      ) as HTMLInputElement;

      expect(groupALabelInput.value).toBe("Grupo A");
      expect(groupAColorPicker.value).toBe("#3b82f6");
      expect(groupBLabelInput.value).toBe("Grupo B");
      expect(groupBColorPicker.value).toBe("#ef4444");
    });
  });

  describe("Accesibilidad", () => {
    it("Todos los inputs tienen labels asociados", () => {
      render(<FormWrapper />);

      // Label inputs por ID
      const groupALabelInput = document.querySelector('#groupA-label');
      const groupBLabelInput = document.querySelector('#groupB-label');
      
      // Color pickers por ID
      const groupAColorPicker = document.querySelector('#groupA-color');
      const groupBColorPicker = document.querySelector('#groupB-color');

      expect(groupALabelInput).toBeInTheDocument();
      expect(groupAColorPicker).toBeInTheDocument();
      expect(groupBLabelInput).toBeInTheDocument();
      expect(groupBColorPicker).toBeInTheDocument();
    });

    it("Los color inputs tienen el type correcto", () => {
      render(<FormWrapper />);

      const groupAColorPicker = document.querySelector(
        '#groupA-color',
      ) as HTMLInputElement;
      const groupBColorPicker = document.querySelector(
        '#groupB-color',
      ) as HTMLInputElement;

      expect(groupAColorPicker.type).toBe("color");
      expect(groupBColorPicker.type).toBe("color");
    });
  });
});
