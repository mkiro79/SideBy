import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GeneralInfoFields } from "../GeneralInfoFields.js";
import {
  datasetEditSchema,
  type DatasetEditFormData,
} from "../../../schemas/datasetEdit.schema.js";

/**
 * Wrapper component para proveer React Hook Form context
 * Necesario porque GeneralInfoFields usa Controller que requiere FormProvider
 */
const FormWrapper = () => {
  const {
    control,
    formState: { errors },
  } = useForm<DatasetEditFormData>({
    resolver: zodResolver(datasetEditSchema),
    mode: "onBlur", // Validar en blur para los tests
    defaultValues: {
      meta: {
        name: "",
        description: "",
      },
      schemaMapping: {
        dimensionField: "",
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
      aiConfig: {
        enabled: false,
        userContext: "",
      },
    },
  });

  return <GeneralInfoFields control={control} errors={errors} />;
};

describe("GeneralInfoFields", () => {
  describe("Renderizado", () => {
    it("Renderiza el card con título correcto", () => {
      render(<FormWrapper />);

      expect(
        screen.getByText("Información General"),
      ).toBeInTheDocument();
    });

    it("Renderiza el campo Name con label y asterisco requerido", () => {
      render(<FormWrapper />);

      const label = screen.getByText(/Nombre/);
      expect(label).toBeInTheDocument();

      // Verificar que tiene el indicador de requerido (*)
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("Renderiza el campo Description con label (opcional)", () => {
      render(<FormWrapper />);

      const label = screen.getByText(/Descripci/);
      expect(label).toBeInTheDocument();

      // Verificar que tiene el indicador de opcional
      expect(screen.getByText("(opcional)")).toBeInTheDocument();
    });

    it("Renderiza Input para name y Textarea para description", () => {
      render(<FormWrapper />);

      // Input para name
      const nameInput = screen.getByLabelText(/Nombre/);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput.tagName).toBe("INPUT");

      // Textarea para description
      const descriptionTextarea = screen.getByLabelText(/Descripción/);
      expect(descriptionTextarea).toBeInTheDocument();
      expect(descriptionTextarea.tagName).toBe("TEXTAREA");
    });
  });

  describe("Validación", () => {
    it("Muestra error cuando name está vacío después de blur", async () => {
      const user = userEvent.setup();

      render(<FormWrapper />);

      const nameInput = screen.getByLabelText(/Nombre/);

      // Focus y blur sin escribir nada (para trigger validación)
      await user.click(nameInput);
      await user.tab(); // Blur

      // Esperar a que aparezca el mensaje de error
      // Nota: El mensaje exacto depende del schema Zod
      const errorElement = await screen.findByText(
        /El nombre debe tener al menos 3 caracteres/i,
      );
      expect(errorElement).toBeInTheDocument();
    });

    it("Muestra error cuando name tiene menos de 3 caracteres", async () => {
      const user = userEvent.setup();

      render(<FormWrapper />);

      const nameInput = screen.getByLabelText(/Nombre/);

      // Escribir solo 2 caracteres
      await user.type(nameInput, "ab");
      await user.tab(); // Blur para trigger validación

      // Esperar a que aparezca el mensaje de error
      const errorElement = await screen.findByText(
        /El nombre debe tener al menos 3 caracteres/i,
      );
      expect(errorElement).toBeInTheDocument();
    });

    it("No muestra error cuando name es válido (>= 3 caracteres)", async () => {
      const user = userEvent.setup();

      render(<FormWrapper />);

      const nameInput = screen.getByLabelText(/Nombre/);

      // Escribir un nombre válido
      await user.type(nameInput, "Dataset Test");

      // No debería haber elementos con clase de error
      expect(
        screen.queryByText(/El nombre debe tener al menos 3 caracteres/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Interacciones", () => {
    it("Permite escribir en el campo name", async () => {
      const user = userEvent.setup();

      render(<FormWrapper />);

      const nameInput = screen.getByLabelText(/Nombre/);

      await user.type(nameInput, "Mi Dataset");

      expect(nameInput).toHaveValue("Mi Dataset");
    });

    it("Permite escribir en el campo description", async () => {
      const user = userEvent.setup();

      render(<FormWrapper />);

      const descriptionTextarea = screen.getByLabelText(/Descripción/);

      await user.type(descriptionTextarea, "Esta es una descripción de prueba");

      expect(descriptionTextarea).toHaveValue(
        "Esta es una descripción de prueba",
      );
    });

    it("Description puede dejarse vacío (campo opcional)", async () => {
      const user = userEvent.setup();

      render(<FormWrapper />);

      const descriptionTextarea = screen.getByLabelText(/Descripción/);

      // Focus y blur sin escribir
      await user.click(descriptionTextarea);
      await user.tab();

      // No debería aparecer ningún error
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
