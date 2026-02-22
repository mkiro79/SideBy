/**
 * Tests para ErrorPage Component
 *
 * Verifica que el componente ErrorPage:
 * - Renderiza el mensaje de error amigable al usuario
 * - Muestra la acción principal para volver al inicio
 * - Soporta errores de ruta con status HTTP
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ErrorPage } from "../ErrorPage.js";

// ============================================================================
// MOCKS
// ============================================================================

const mockUseRouteError = vi.fn();
const mockIsRouteErrorResponse = vi.fn();

// Mock parcial de react-router-dom para compatibilidad con implementación actual
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useRouteError: () => mockUseRouteError(),
    isRouteErrorResponse: (error: unknown) => mockIsRouteErrorResponse(error),
  };
});

// ============================================================================
// TESTS
// ============================================================================

describe("ErrorPage", () => {
  const renderWithRouter = () =>
    render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>,
    );

  afterEach(() => {
    vi.restoreAllMocks();
    mockUseRouteError.mockReset();
    mockIsRouteErrorResponse.mockReset();
  });

  describe("Renderizado", () => {
    it("Renderiza el título principal de error", () => {
      mockUseRouteError.mockReturnValue(null);
      mockIsRouteErrorResponse.mockReturnValue(false);
      renderWithRouter();

      expect(
        screen.getByText("¡Vaya! Algo ha ocurrido de manera inesperada."),
      ).toBeInTheDocument();
    });

    it("Renderiza el subtítulo descriptivo", () => {
      mockUseRouteError.mockReturnValue(null);
      mockIsRouteErrorResponse.mockReturnValue(false);
      renderWithRouter();

      expect(
        screen.getByText("Ha ocurrido un error inesperado."),
      ).toBeInTheDocument();
    });

    it("Renderiza la acción 'Volver al inicio'", () => {
      mockUseRouteError.mockReturnValue(null);
      mockIsRouteErrorResponse.mockReturnValue(false);
      renderWithRouter();

      expect(
        screen.getByRole("link", { name: /volver al inicio/i }),
      ).toBeInTheDocument();
    });

    it("Renderiza mensaje específico para 404", () => {
      mockUseRouteError.mockReturnValue({ status: 404, statusText: "Not Found" });
      mockIsRouteErrorResponse.mockReturnValue(true);
      renderWithRouter();

      expect(
        screen.getByText("La página que buscas no existe."),
      ).toBeInTheDocument();
    });
  });

  describe("Errores de runtime", () => {
    it("Renderiza el mensaje del error cuando useRouteError retorna Error", () => {
      mockUseRouteError.mockReturnValue(new Error("Fallo controlado"));
      mockIsRouteErrorResponse.mockReturnValue(false);
      renderWithRouter();

      expect(screen.getByText("Fallo controlado")).toBeInTheDocument();
    });
  });
});
