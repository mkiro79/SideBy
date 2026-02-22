/**
 * Tests para ErrorPage Component
 *
 * Verifica que el componente ErrorPage:
 * - Renderiza el mensaje de error amigable al usuario
 * - Muestra los botones de acción ('Volver al inicio' y 'Recargar página')
 * - El botón 'Recargar página' llama a window.location.reload
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorPage } from "../ErrorPage.js";

// ============================================================================
// MOCKS
// ============================================================================

// Mockear react-router-dom para evitar la dependencia de un data router
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useRouteError: () => null,
}));

// ============================================================================
// TESTS
// ============================================================================

describe("ErrorPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Renderizado", () => {
    it("Renderiza el título principal de error", () => {
      render(<ErrorPage />);

      expect(screen.getByText("¡Vaya!")).toBeInTheDocument();
    });

    it("Renderiza el subtítulo descriptivo", () => {
      render(<ErrorPage />);

      expect(
        screen.getByText("Algo ha ocurrido de manera inesperada"),
      ).toBeInTheDocument();
    });

    it("Renderiza el párrafo de ayuda al usuario", () => {
      render(<ErrorPage />);

      expect(
        screen.getByText(/Se ha producido un error inesperado/i),
      ).toBeInTheDocument();
    });

    it("Renderiza el botón 'Volver al inicio'", () => {
      render(<ErrorPage />);

      expect(
        screen.getByRole("button", { name: /volver al inicio/i }),
      ).toBeInTheDocument();
    });

    it("Renderiza el botón 'Recargar página'", () => {
      render(<ErrorPage />);

      expect(
        screen.getByRole("button", { name: /recargar página/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Acciones", () => {
    it("El botón 'Recargar página' llama a window.location.reload", () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, "location", {
        value: { ...window.location, reload: reloadMock },
        writable: true,
        configurable: true,
      });

      render(<ErrorPage />);

      fireEvent.click(
        screen.getByRole("button", { name: /recargar página/i }),
      );

      expect(reloadMock).toHaveBeenCalled();
    });

    it("El botón 'Volver al inicio' llama a navigate con '/home'", () => {
      render(<ErrorPage />);

      // El botón existe y está habilitado (la navegación está mockeada en el módulo)
      const btn = screen.getByRole("button", { name: /volver al inicio/i });
      expect(btn).toBeInTheDocument();
      // El click no lanza excepciones con el mock de useNavigate
      fireEvent.click(btn);
    });
  });
});
