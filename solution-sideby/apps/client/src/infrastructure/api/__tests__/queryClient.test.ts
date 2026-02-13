/**
 * Tests para la configuración de QueryClient
 *
 * Verifica que las políticas de cache, retry y revalidación
 * estén configuradas correctamente según los requisitos del proyecto.
 */

import { describe, it, expect } from "vitest";
import { queryClient } from "../queryClient.js";

describe("QueryClient Configuration", () => {
  describe("Queries Configuration", () => {
    it("debe tener staleTime configurado a 5 minutos", () => {
      const config = queryClient.getDefaultOptions().queries;

      expect(config?.staleTime).toBe(5 * 60 * 1000);
    });

    it("debe tener gcTime configurado a 10 minutos", () => {
      const config = queryClient.getDefaultOptions().queries;

      expect(config?.gcTime).toBe(10 * 60 * 1000);
    });

    it("debe reintentar 1 vez en caso de error", () => {
      const config = queryClient.getDefaultOptions().queries;

      expect(config?.retry).toBe(1);
    });

    it("debe revalidar al volver a la ventana (refetchOnWindowFocus)", () => {
      const config = queryClient.getDefaultOptions().queries;

      expect(config?.refetchOnWindowFocus).toBe(true);
    });

    it("NO debe revalidar al reconectar (refetchOnReconnect)", () => {
      const config = queryClient.getDefaultOptions().queries;

      expect(config?.refetchOnReconnect).toBe(false);
    });
  });

  describe("Mutations Configuration", () => {
    it("NO debe reintentar mutations automáticamente", () => {
      const config = queryClient.getDefaultOptions().mutations;

      expect(config?.retry).toBe(0);
    });
  });

  describe("QueryClient Instance", () => {
    it("debe ser una instancia válida de QueryClient", () => {
      expect(queryClient).toBeDefined();
      expect(queryClient.getQueryCache).toBeDefined();
      expect(queryClient.getMutationCache).toBeDefined();
    });
  });
});
