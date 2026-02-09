/**
 * Tests para inferKPIFormat utility
 */

import { describe, it, expect } from "vitest";
import { inferKPIFormat } from "../inferKPIFormat.js";

describe("inferKPIFormat", () => {
  describe("Currency detection", () => {
    it("debe detectar columnas de precio como currency", () => {
      expect(inferKPIFormat("precio")).toBe("currency");
      expect(inferKPIFormat("precio_unitario")).toBe("currency");
      expect(inferKPIFormat("price")).toBe("currency");
    });

    it("debe detectar columnas de ventas como currency", () => {
      expect(inferKPIFormat("ventas")).toBe("currency");
      expect(inferKPIFormat("total_ventas")).toBe("currency");
      expect(inferKPIFormat("sales")).toBe("currency");
      expect(inferKPIFormat("revenue")).toBe("currency");
    });

    it("debe detectar columnas de costos/gastos como currency", () => {
      expect(inferKPIFormat("costo")).toBe("currency");
      expect(inferKPIFormat("gasto")).toBe("currency");
      expect(inferKPIFormat("cost")).toBe("currency");
    });

    it("debe detectar columnas de ingresos como currency", () => {
      expect(inferKPIFormat("ingreso")).toBe("currency");
      expect(inferKPIFormat("ingresos_totales")).toBe("currency");
    });

    it("debe detectar columnas con símbolos de moneda", () => {
      expect(inferKPIFormat("total_$")).toBe("currency");
      expect(inferKPIFormat("monto_€")).toBe("currency");
      expect(inferKPIFormat("amount_usd")).toBe("currency");
    });

    it("debe detectar columnas de montos/importes como currency", () => {
      expect(inferKPIFormat("monto")).toBe("currency");
      expect(inferKPIFormat("importe")).toBe("currency");
      expect(inferKPIFormat("amount")).toBe("currency");
    });
  });

  describe("Percentage detection", () => {
    it("debe detectar columnas de tasa como percentage", () => {
      expect(inferKPIFormat("tasa")).toBe("percentage");
      expect(inferKPIFormat("tasa_conversion")).toBe("percentage");
      expect(inferKPIFormat("rate")).toBe("percentage");
    });

    it("debe detectar columnas de porcentaje como percentage", () => {
      expect(inferKPIFormat("porcentaje")).toBe("percentage");
      expect(inferKPIFormat("percent")).toBe("percentage");
      expect(inferKPIFormat("descuento_%")).toBe("percentage");
    });

    it("debe detectar columnas de conversión como percentage", () => {
      expect(inferKPIFormat("conversion")).toBe("percentage");
      expect(inferKPIFormat("tasa_conversion")).toBe("percentage");
    });

    it("debe detectar columnas de margen como percentage", () => {
      expect(inferKPIFormat("margen")).toBe("percentage");
      expect(inferKPIFormat("margin")).toBe("percentage");
      expect(inferKPIFormat("margen_bruto")).toBe("percentage");
    });

    it("debe detectar columnas de crecimiento como percentage", () => {
      expect(inferKPIFormat("crecimiento")).toBe("percentage");
      expect(inferKPIFormat("growth")).toBe("percentage");
      expect(inferKPIFormat("variacion")).toBe("percentage");
    });
  });

  describe("Number default fallback", () => {
    it("debe usar number como default para métricas genéricas", () => {
      expect(inferKPIFormat("cantidad")).toBe("number");
      expect(inferKPIFormat("total")).toBe("number");
      expect(inferKPIFormat("count")).toBe("number");
      expect(inferKPIFormat("suma")).toBe("number");
    });

    it("debe usar number para columnas sin patrones específicos", () => {
      expect(inferKPIFormat("metrica_1")).toBe("number");
      expect(inferKPIFormat("valor")).toBe("number");
      expect(inferKPIFormat("resultado")).toBe("number");
    });
  });

  describe("Case insensitivity", () => {
    it("debe ser case-insensitive", () => {
      expect(inferKPIFormat("PRECIO")).toBe("currency");
      expect(inferKPIFormat("Precio")).toBe("currency");
      expect(inferKPIFormat("TASA")).toBe("percentage");
      expect(inferKPIFormat("Tasa")).toBe("percentage");
    });
  });
});
