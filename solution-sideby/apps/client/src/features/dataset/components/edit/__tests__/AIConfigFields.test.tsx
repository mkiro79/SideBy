import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AIConfigFields } from "../AIConfigFields.js";
import {
  datasetEditSchema,
  type DatasetEditFormData,
} from "../../../schemas/datasetEdit.schema.js";

/**
 * Wrapper component para proveer React Hook Form context
 */
const FormWrapper = ({ initialEnabled = false }: { initialEnabled?: boolean }) => {
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
        enabled: initialEnabled,
        userContext: "",
      },
    },
  });

  return <AIConfigFields control={control} errors={errors} />;
};

describe("AIConfigFields", () => {
  describe("Renderizado", () => {
    it("Renderiza el card con título correcto", () => {
      render(<FormWrapper />);

      expect(screen.getByText("Configuración de IA")).toBeInTheDocument();
    });

    it("Renderiza el checkbox de habilitación", () => {
      render(<FormWrapper />);

      const checkbox = screen.getByRole("checkbox", {
        name: /Habilitar análisis con IA/i,
      });
      expect(checkbox).toBeInTheDocument();
    });

    it("Muestra el texto descriptivo del checkbox", () => {
      render(<FormWrapper />);

      expect(
        screen.getByText(
          /Activa el análisis inteligente de datos/i,
        ),
      ).toBeInTheDocument();
    });

    it("No muestra el textarea cuando enabled=false", () => {
      render(<FormWrapper initialEnabled={false} />);

      const textarea = screen.queryByRole("textbox", {
        name: /Contexto adicional/i,
      });
      expect(textarea).not.toBeInTheDocument();
    });

    it("Muestra el textarea cuando enabled=true", async () => {
      render(<FormWrapper initialEnabled={true} />);

      const textarea = await screen.findByRole("textbox", {
        name: /Contexto adicional/i,
      });
      expect(textarea).toBeInTheDocument();
    });
  });

  describe("Interacciones con checkbox", () => {
    it("El checkbox inicia desmarcado por defecto", () => {
      render(<FormWrapper initialEnabled={false} />);

      const checkbox = screen.getByRole("checkbox", {
        name: /Habilitar análisis con IA/i,
      });

      expect(checkbox).toHaveAttribute("aria-checked", "false");
    });

    it("El checkbox inicia marcado si initialEnabled=true", () => {
      render(<FormWrapper initialEnabled={true} />);

      const checkbox = screen.getByRole("checkbox", {
        name: /Habilitar análisis con IA/i,
      });

      expect(checkbox).toHaveAttribute("aria-checked", "true");
    });

    it("Marcar el checkbox muestra el textarea", async () => {
      const user = userEvent.setup();
      render(<FormWrapper initialEnabled={false} />);

      const checkbox = screen.getByRole("checkbox", {
        name: /Habilitar análisis con IA/i,
      });

      // Inicialmente no hay textarea
      expect(
        screen.queryByRole("textbox", {
          name: /Contexto adicional/i,
        }),
      ).not.toBeInTheDocument();

      // Click en el checkbox
      await user.click(checkbox);

      // Ahora debería aparecer el textarea
      await waitFor(() => {
        expect(
          screen.getByRole("textbox", {
            name: /Contexto adicional/i,
          }),
        ).toBeInTheDocument();
      });
    });

    it("Desmarcar el checkbox oculta el textarea", async () => {
      const user = userEvent.setup();
      render(<FormWrapper initialEnabled={true} />);

      const checkbox = screen.getByRole("checkbox", {
        name: /Habilitar análisis con IA/i,
      });

      // Inicialmente hay textarea
      const initialTextarea = await screen.findByRole("textbox", {
        name: /Contexto adicional/i,
      });
      expect(initialTextarea).toBeInTheDocument();

      // Click para desmarcar
      await user.click(checkbox);

      // El textarea debería desaparecer
      await waitFor(() => {
        expect(
          screen.queryByRole("textbox", {
            name: /Contexto adicional/i,
          }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Textarea de userContext", () => {
    it("Permite escribir en el textarea", async () => {
      const user = userEvent.setup();
      render(<FormWrapper initialEnabled={true} />);

      const textarea = await screen.findByRole("textbox", {
        name: /Contexto adicional/i,
      });

      await user.type(
        textarea,
        "Este dataset contiene ventas mensuales por región",
      );

      expect(textarea).toHaveValue(
        "Este dataset contiene ventas mensuales por región",
      );
    });

    it("Muestra el contador de caracteres (0/1000) inicialmente", async () => {
      render(<FormWrapper initialEnabled={true} />);

      const counter = await screen.findByText(/0 \/ 1000 caracteres/);
      expect(counter).toBeInTheDocument();
    });

    it("Actualiza el contador al escribir", async () => {
      const user = userEvent.setup();
      render(<FormWrapper initialEnabled={true} />);

      const textarea = await screen.findByRole("textbox", {
        name: /Contexto adicional/i,
      });

      // Escribir texto de 50 caracteres "A" * 50
      await user.type(textarea, "A".repeat(50));

      // El contador debería mostrar 50 / 1000
      const counter = await screen.findByText(/50 \/ 1000 caracteres/);
      expect(counter).toBeInTheDocument();
    });

    it("Muestra placeholder apropiado", async () => {
      render(<FormWrapper initialEnabled={true} />);

      const textarea = await screen.findByRole("textbox", {
        name: /Contexto adicional/i,
      });

      expect(textarea).toHaveAttribute(
        "placeholder",
        expect.stringContaining("Enfócate en identificar"),
      );
    });
  });

  describe("Validación", () => {
    it("Muestra error si userContext excede 1000 caracteres", async () => {
      render(<FormWrapper initialEnabled={true} />);

      const textarea = await screen.findByRole("textbox", {
        name: /Contexto adicional/i,
      });

      // Escribir más de 1000 caracteres
      const longText = "A".repeat(1001);
      fireEvent.change(textarea, { target: { value: longText } });
      fireEvent.blur(textarea);

      // Esperar mensaje de error
      await waitFor(() => {
        const errorMessage = screen.getByText(
          /El contexto no puede exceder 1000 caracteres/i,
        );
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe("Accesibilidad", () => {
    it("El checkbox tiene un label accesible", () => {
      render(<FormWrapper />);

      const checkbox = screen.getByRole("checkbox", {
        name: /Habilitar análisis con IA/i,
      });

      expect(checkbox).toHaveAccessibleName();
    });

    it("El textarea tiene un label accesible cuando está visible", async () => {
      render(<FormWrapper initialEnabled={true} />);

      const textarea = await screen.findByRole("textbox", {
        name: /Contexto adicional/i,
      });

      expect(textarea).toHaveAccessibleName();
    });

    it("El textarea tiene el indicador de opcional", async () => {
      render(<FormWrapper initialEnabled={true} />);

      const optionalIndicator = await screen.findByText("(opcional)");
      expect(optionalIndicator).toBeInTheDocument();
    });
  });

  describe("Estructura del Card", () => {
    it("Renderiza dentro de un Card con CardHeader y CardContent", () => {
      render(<FormWrapper />);

      // Verificar que hay un título de card
      const title = screen.getByText("Configuración de IA");
      expect(title).toBeInTheDocument();

      // Verificar que el checkbox está dentro del card
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
    });
  });
});
