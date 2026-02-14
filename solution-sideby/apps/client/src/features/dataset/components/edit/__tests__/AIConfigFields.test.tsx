import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
          /Permite al sistema generar insights automáticos usando IA/i,
        ),
      ).toBeInTheDocument();
    });

    it("No muestra el textarea cuando enabled=false", () => {
      render(<FormWrapper initialEnabled={false} />);

      const textarea = screen.queryByRole("textbox", {
        name: /Contexto adicional para la IA/i,
      });
      expect(textarea).not.toBeInTheDocument();
    });

    it("Muestra el textarea cuando enabled=true", () => {
      render(<FormWrapper initialEnabled={true} />);

      const textarea = screen.getByRole("textbox", {
        name: /Contexto adicional para la IA/i,
      });
      expect(textarea).toBeInTheDocument();
    });
  });

  describe("Interacciones con checkbox", () => {
    it("El checkbox inicia desmarcado por defecto", () => {
      render(<FormWrapper initialEnabled={false} />);

      const checkbox = screen.getByRole("checkbox", {
        name: /Habilitar análisis con IA/i,
      }) as HTMLInputElement;

      expect(checkbox.checked).toBe(false);
    });

    it("El checkbox inicia marcado si initialEnabled=true", () => {
      render(<FormWrapper initialEnabled={true} />);

      const checkbox = screen.getByRole("checkbox", {
        name: /Habilitar análisis con IA/i,
      }) as HTMLInputElement;

      expect(checkbox.checked).toBe(true);
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
          name: /Contexto adicional para la IA/i,
        }),
      ).not.toBeInTheDocument();

      // Click en el checkbox
      await user.click(checkbox);

      // Ahora debería aparecer el textarea
      await waitFor(() => {
        expect(
          screen.getByRole("textbox", {
            name: /Contexto adicional para la IA/i,
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
      expect(
        screen.getByRole("textbox", {
          name: /Contexto adicional para la IA/i,
        }),
      ).toBeInTheDocument();

      // Click para desmarcar
      await user.click(checkbox);

      // El textarea debería desaparecer
      await waitFor(() => {
        expect(
          screen.queryByRole("textbox", {
            name: /Contexto adicional para la IA/i,
          }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Textarea de userContext", () => {
    it("Permite escribir en el textarea", async () => {
      const user = userEvent.setup();
      render(<FormWrapper initialEnabled={true} />);

      const textarea = screen.getByRole("textbox", {
        name: /Contexto adicional para la IA/i,
      }) as HTMLTextAreaElement;

      await user.type(
        textarea,
        "Este dataset contiene ventas mensuales por región",
      );

      expect(textarea.value).toBe(
        "Este dataset contiene ventas mensuales por región",
      );
    });

    it("Muestra el contador de caracteres (0/1000) inicialmente", async () => {
      render(<FormWrapper initialEnabled={true} />);

      // Esperar a que aparezca el contador
      await waitFor(() => {
        const counter = screen.getByText(/0 \/ 1000/);
        expect(counter).toBeInTheDocument();
      });
    });

    it("Actualiza el contador al escribir", async () => {
      const user = userEvent.setup();
      render(<FormWrapper initialEnabled={true} />);

      const textarea = screen.getByRole("textbox", {
        name: /Contexto adicional para la IA/i,
      });

      // Escribir texto de 50 caracteres "A" * 50
      await user.type(textarea, "A".repeat(50));

      // El contador debería mostrar 50 / 1000
      await waitFor(() => {
        const counter = screen.getByText(/50 \/ 1000/);
        expect(counter).toBeInTheDocument();
      });
    });

    it("Muestra placeholder apropiado", () => {
      render(<FormWrapper initialEnabled={true} />);

      const textarea = screen.getByRole("textbox", {
        name: /Contexto adicional para la IA/i,
      });

      expect(textarea).toHaveAttribute(
        "placeholder",
        expect.stringContaining("información adicional"),
      );
    });
  });

  describe("Validación", () => {
    it("Muestra error si userContext excede 1000 caracteres", async () => {
      const user = userEvent.setup();
      render(<FormWrapper initialEnabled={true} />);

      const textarea = screen.getByRole("textbox", {
        name: /Contexto adicional para la IA/i,
      });

      // Escribir más de 1000 caracteres
      const longText = "A".repeat(1001);
      await user.type(textarea, longText);
      await user.tab(); // Blur para trigger validación

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

    it("El textarea tiene un label accesible cuando está visible", () => {
      render(<FormWrapper initialEnabled={true} />);

      const textarea = screen.getByRole("textbox", {
        name: /Contexto adicional para la IA/i,
      });

      expect(textarea).toHaveAccessibleName();
    });

    it("El textarea tiene el indicador de opcional", () => {
      render(<FormWrapper initialEnabled={true} />);

      expect(screen.getByText("(opcional)")).toBeInTheDocument();
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
