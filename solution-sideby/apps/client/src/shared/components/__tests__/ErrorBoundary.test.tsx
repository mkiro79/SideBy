/**
 * Tests para ErrorBoundary Component
 *
 * Verifica que el componente ErrorBoundary:
 * - Renderiza correctamente los children cuando no hay error
 * - Captura errores y muestra la UI de fallback predeterminada
 * - Muestra el fallback personalizado cuando se proporciona
 * - El botón "Volver al inicio" llama a window.location.replace con '/home'
 * - El botón "Recargar página" llama a window.location.reload
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary.js";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Componente que lanza un error al renderizarse (para simular errores en tests)
 */
const BrokenComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Contenido sin error</div>;
};

// Suprimir los errores de consola que React imprime al capturar errores en tests
const suppressConsoleError = () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  return spy;
};

// ============================================================================
// TESTS
// ============================================================================

describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = suppressConsoleError();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Renderizado sin errores", () => {
    it("Renderiza correctamente los children cuando no hay error", () => {
      render(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={false} />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Contenido sin error")).toBeInTheDocument();
    });
  });

  describe("Captura de errores - fallback por defecto", () => {
    it("Muestra la UI de error cuando un hijo lanza una excepción", () => {
      render(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText("¡Vaya!")).toBeInTheDocument();
    });

    it("Muestra el mensaje de error descriptivo", () => {
      render(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText("Algo ha ocurrido de manera inesperada"),
      ).toBeInTheDocument();
    });

    it("Muestra el botón 'Volver al inicio'", () => {
      render(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByRole("button", { name: /volver al inicio/i }),
      ).toBeInTheDocument();
    });

    it("Muestra el botón 'Recargar página'", () => {
      render(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(
        screen.getByRole("button", { name: /recargar página/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Botones de acción", () => {
    it("El botón 'Volver al inicio' llama a window.location.replace con '/home'", () => {
      // Usar Object.defineProperty para mock de window.location
      const replaceMock = vi.fn();
      Object.defineProperty(window, "location", {
        value: { ...window.location, replace: replaceMock },
        writable: true,
        configurable: true,
      });

      render(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      fireEvent.click(screen.getByRole("button", { name: /volver al inicio/i }));

      expect(replaceMock).toHaveBeenCalledWith("/home");
    });

    it("El botón 'Recargar página' llama a window.location.reload", () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, "location", {
        value: { ...window.location, reload: reloadMock },
        writable: true,
        configurable: true,
      });

      render(
        <ErrorBoundary>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /recargar página/i }),
      );

      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe("Fallback personalizado", () => {
    it("Muestra el fallback personalizado cuando se proporciona via prop", () => {
      render(
        <ErrorBoundary fallback={<div>Error personalizado</div>}>
          <BrokenComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Error personalizado")).toBeInTheDocument();
      expect(screen.queryByText("¡Vaya!")).not.toBeInTheDocument();
    });
  });
});
