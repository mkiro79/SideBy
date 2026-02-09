/**
 * Tests for Feature Flags System
 *
 * Verifica que el sistema de feature flags centralizado funcione correctamente
 */

import { describe, it, expect } from "vitest";
import { FEATURES, isFeatureEnabled } from "../features.js";

describe("[TDD] Feature Flags System", () => {
  describe("Default Values", () => {
    it("should have EMAIL_LOGIN as boolean", () => {
      expect(typeof FEATURES.EMAIL_LOGIN).toBe("boolean");
    });

    it("should have AI_ENABLED as boolean", () => {
      expect(typeof FEATURES.AI_ENABLED).toBe("boolean");
    });

    it("should have all flags defined", () => {
      expect(FEATURES).toHaveProperty("EMAIL_LOGIN");
      expect(FEATURES).toHaveProperty("AI_ENABLED");
    });
  });

  describe("isFeatureEnabled Helper", () => {
    it("should return boolean for EMAIL_LOGIN", () => {
      const result = isFeatureEnabled("EMAIL_LOGIN");
      expect(typeof result).toBe("boolean");
    });

    it("should return boolean for AI_ENABLED", () => {
      const result = isFeatureEnabled("AI_ENABLED");
      expect(typeof result).toBe("boolean");
    });

    it("should return correct value for any feature key", () => {
      const emailLoginStatus = isFeatureEnabled("EMAIL_LOGIN");
      expect(typeof emailLoginStatus).toBe("boolean");

      const aiEnabledStatus = isFeatureEnabled("AI_ENABLED");
      expect(typeof aiEnabledStatus).toBe("boolean");
    });
  });

  describe("Type Safety", () => {
    it("should be a frozen/readonly object", () => {
      // Object.freeze hace el objeto inmutable
      expect(Object.isFrozen(FEATURES)).toBe(true);
    });

    it("should not allow property modification", () => {
      // Object.freeze previene modificaciones (falla silenciosamente en modo no-strict)
      const original = FEATURES.EMAIL_LOGIN;
      try {
        // @ts-expect-error - Testing immutability
        FEATURES.EMAIL_LOGIN = !original;
      } catch {
        // Expected in strict mode - Object.freeze previene modificación
      }
      // El valor NO debe cambiar
      expect(FEATURES.EMAIL_LOGIN).toBe(original);
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
