import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AIInsights } from "../AIInsights.js";
import type { DatasetInsightsResponse } from "../../../types/api.types.js";

describe("AIInsights", () => {
  it("debe mostrar mensaje cuando los filtros cambian y requiere regenerar", () => {
    render(
      <AIInsights
        enabled={true}
        hasRequested={false}
        isLoading={false}
        isError={false}
        onGenerate={vi.fn()}
        resetReason="Los filtros cambiaron, vuelve a generar el resumen."
      />,
    );

    expect(
      screen.getByText(/los filtros cambiaron, vuelve a generar el resumen/i),
    ).toBeInTheDocument();
  });

  it("debe mostrar botón para generar insights cuando aún no se solicitó", () => {
    render(
      <AIInsights
        enabled={true}
        hasRequested={false}
        isLoading={false}
        isError={false}
        onGenerate={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /generar resumen con ia/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/la generación de insights puede tardar unos segundos/i),
    ).toBeInTheDocument();
  });

  it("debe ejecutar onGenerate al hacer click", async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();

    render(
      <AIInsights
        enabled={true}
        hasRequested={false}
        isLoading={false}
        isError={false}
        onGenerate={onGenerate}
      />,
    );

    await user.click(screen.getByRole("button", { name: /generar resumen con ia/i }));

    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it("debe mostrar insights y narrativa cuando hay datos", () => {
    const data: DatasetInsightsResponse = {
      insights: [
        {
          id: "1",
          datasetId: "dataset-1",
          type: "warning",
          severity: 4,
          icon: "⚠️",
          title: "Caída de revenue",
          message: "Revenue disminuyó 35%",
          metadata: { kpi: "Revenue", change: -35 },
          generatedBy: "rule-engine",
          confidence: 0.95,
          generatedAt: new Date().toISOString(),
        },
      ],
      businessNarrative: {
        summary: "Se detecta una caída relevante en ingresos.",
        recommendedActions: ["Revisar campañas", "Analizar canales"],
        language: "es",
        generatedBy: "ai-model",
        confidence: 0.82,
        generatedAt: new Date().toISOString(),
      },
      meta: {
        total: 1,
        generatedAt: new Date().toISOString(),
        cacheStatus: "hit",
        generationSource: "mixed",
        generationTimeMs: 350,
      },
    };

    render(
      <AIInsights
        enabled={true}
        hasRequested={true}
        isLoading={false}
        isError={false}
        onGenerate={vi.fn()}
        data={data}
      />,
    );

    expect(screen.getByText("Caída de revenue")).toBeInTheDocument();
    expect(screen.getByText(/revisar campañas/i)).toBeInTheDocument();
    expect(screen.getByText(/desde caché/i)).toBeInTheDocument();
  });
});
