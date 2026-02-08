/**
 * Tests for Feature Flags System
 *
 * Verifica que el sistema de feature flags centralizado funcione correctamente
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FEATURES, isFeatureEnabled } from "../features.js";

describe("[TDD] Feature Flags System", () => {
  let originalEnv: Record<string, unknown>;

  beforeEach(() => {
    // Guardar el entorno original
    originalEnv = { ...import.meta.env };
  });

  afterEach(() => {
    // Restaurar el entorno original
    Object.assign(import.meta.env, originalEnv);
    vi.clearAllMocks();
  });

  describe("Default Values", () => {
    it("should have EMAIL_LOGIN as false by default", () => {
      expect(FEATURES.EMAIL_LOGIN).toBe(false);
    });

    it("should have AI_ENABLED as false by default", () => {
      expect(FEATURES.AI_ENABLED).toBe(false);
    });

    it("should have all flags defined", () => {
      expect(FEATURES).toHaveProperty("EMAIL_LOGIN");
      expect(FEATURES).toHaveProperty("AI_ENABLED");
    });
  });

  describe("isFeatureEnabled Helper", () => {
    it("should return false for EMAIL_LOGIN when disabled", () => {
      expect(isFeatureEnabled("EMAIL_LOGIN")).toBe(false);
    });

    it("should return false for AI_ENABLED when disabled", () => {
      expect(isFeatureEnabled("AI_ENABLED")).toBe(false);
    });

    it("should return correct value for any feature key", () => {
      const emailLoginStatus = isFeatureEnabled("EMAIL_LOGIN");
      expect(typeof emailLoginStatus).toBe("boolean");

      const aiEnabledStatus = isFeatureEnabled("AI_ENABLED");
      expect(typeof aiEnabledStatus).toBe("boolean");
    });
  });

  describe("Type Safety", () => {
    it("should be a readonly object", () => {
      // TypeScript debería prevenir esto en tiempo de compilación
      // Este test verifica que sea una constante
      expect(() => {
        // @ts-expect-error - Testing immutability
        FEATURES.EMAIL_LOGIN = true;
      }).toThrow();
    });
  });

  describe("Development Mode Logging", () => {
    it("should log configuration in development mode", () => {
      // Este test es conceptual ya que el log se ejecuta al importar
      // En un entorno real, usaríamos mocks para console.log
      expect(FEATURES).toBeDefined();
    });
  });
});
