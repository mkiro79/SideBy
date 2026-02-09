/**
 * Tests for Auto-Classification Utility
 *
 * Tests para detectar automáticamente tipos de columnas en CSVs:
 * - Date columns (YYYY-MM-DD, DD/MM/YYYY, ISO8601)
 * - Numeric columns (numbers or empty values)
 * - String columns (default for everything else)
 */

import { describe, it, expect } from "vitest";
import { autoClassifyColumns } from "../autoClassify.js";

describe("[TDD] autoClassifyColumns", () => {
  // ==========================================================================
  // DATE DETECTION TESTS
  // ==========================================================================

  describe("Date Column Detection", () => {
    it("[RED] should detect YYYY-MM-DD format as date column", () => {
      const headers = ["fecha", "ventas"];
      const rows = [
        { fecha: "2024-01-15", ventas: "1000" },
        { fecha: "2024-02-20", ventas: "1500" },
        { fecha: "2024-03-10", ventas: "1200" },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.dateColumns).toContain("fecha");
      expect(result.dateColumns).toHaveLength(1);
    });

    it("[RED] should detect DD/MM/YYYY format as date column", () => {
      const headers = ["date", "amount"];
      const rows = [
        { date: "15/01/2024", amount: "1000" },
        { date: "20/02/2024", amount: "1500" },
        { date: "10/03/2024", amount: "1200" },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.dateColumns).toContain("date");
    });

    it("[RED] should detect ISO8601 format as date column", () => {
      const headers = ["timestamp", "value"];
      const rows = [
        { timestamp: "2024-01-15T10:30:00Z", value: "100" },
        { timestamp: "2024-02-20T14:45:00Z", value: "150" },
        { timestamp: "2024-03-10T08:15:00Z", value: "120" },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.dateColumns).toContain("timestamp");
    });

    it("[RED] should not detect date if less than 80% of values match", () => {
      const headers = ["mixed"];
      const rows = [
        { mixed: "2024-01-15" },
        { mixed: "not a date" },
        { mixed: "also not" },
        { mixed: "nope" },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.dateColumns).not.toContain("mixed");
      expect(result.stringColumns).toContain("mixed");
    });

    it("[RED] should return empty array if no date columns found", () => {
      const headers = ["name", "value"];
      const rows = [
        { name: "Product A", value: "100" },
        { name: "Product B", value: "200" },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.dateColumns).toEqual([]);
    });
  });

  // ==========================================================================
  // NUMERIC DETECTION TESTS
  // ==========================================================================

  describe("Numeric Column Detection", () => {
    it("[RED] should detect pure number columns as numeric", () => {
      const headers = ["region", "ventas", "visitas"];
      const rows = [
        { region: "Norte", ventas: 45000, visitas: 12000 },
        { region: "Sur", ventas: 38000, visitas: 8000 },
        { region: "Este", ventas: 52000, visitas: 15000 },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.numericColumns).toContain("ventas");
      expect(result.numericColumns).toContain("visitas");
      expect(result.numericColumns).toHaveLength(2);
    });

    it("[RED] should detect string numbers as numeric", () => {
      const headers = ["product", "price"];
      const rows = [
        { product: "Widget", price: "45.99" },
        { product: "Gadget", price: "123.50" },
        { product: "Tool", price: "89.00" },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.numericColumns).toContain("price");
    });

    it("[RED] should allow empty values in numeric columns", () => {
      const headers = ["metric"];
      const rows = [
        { metric: 100 },
        { metric: null },
        { metric: 200 },
        { metric: "" },
        { metric: 150 },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.numericColumns).toContain("metric");
    });

    it("[RED] should not detect numeric if less than 90% are numbers", () => {
      const headers = ["mixed"];
      const rows = [
        { mixed: 100 },
        { mixed: "text" },
        { mixed: 200 },
        { mixed: "more text" },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.numericColumns).not.toContain("mixed");
      expect(result.stringColumns).toContain("mixed");
    });

    it("[RED] should detect integers and floats as numeric", () => {
      const headers = ["integer", "float"];
      const rows = [
        { integer: 42, float: 3.14 },
        { integer: 100, float: 2.718 },
        { integer: 7, float: 1.414 },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.numericColumns).toContain("integer");
      expect(result.numericColumns).toContain("float");
    });
  });

  // ==========================================================================
  // STRING DETECTION TESTS (Default Fallback)
  // ==========================================================================

  describe("String Column Detection", () => {
    it("[RED] should classify text columns as strings", () => {
      const headers = ["name", "category", "description"];
      const rows = [
        { name: "Product A", category: "Electronics", description: "A device" },
        { name: "Product B", category: "Furniture", description: "A chair" },
        { name: "Product C", category: "Clothing", description: "A shirt" },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.stringColumns).toContain("name");
      expect(result.stringColumns).toContain("category");
      expect(result.stringColumns).toContain("description");
      expect(result.stringColumns).toHaveLength(3);
    });

    it("[RED] should use string as fallback for ambiguous columns", () => {
      const headers = ["weird"];
      const rows = [
        { weird: { nested: "object" } },
        { weird: [1, 2, 3] },
        { weird: true },
      ];

      const result = autoClassifyColumns(headers, rows);

      expect(result.stringColumns).toContain("weird");
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS (Multi-Type)
  // ==========================================================================

  describe("Mixed Column Types", () => {
    it("[RED] should correctly classify all three types in one dataset", () => {
      const headers = ["fecha", "region", "ventas", "producto"];
      const rows = [
        {
          fecha: "2024-01-15",
          region: "Norte",
          ventas: 45000,
          producto: "Widget",
        },
        {
          fecha: "2024-02-20",
          region: "Sur",
          ventas: 38000,
          producto: "Gadget",
        },
        {
          fecha: "2024-03-10",
          region: "Este",
          ventas: 52000,
          producto: "Tool",
        },
      ];

      const result = autoClassifyColumns(headers, rows);

      // Date
      expect(result.dateColumns).toEqual(["fecha"]);

      // Numeric
      expect(result.numericColumns).toEqual(["ventas"]);

      // String
      expect(result.stringColumns).toContain("region");
      expect(result.stringColumns).toContain("producto");
      expect(result.stringColumns).toHaveLength(2);
    });

    it("[RED] should handle empty dataset gracefully", () => {
      const headers = ["col1", "col2"];
      const rows: Record<string, unknown>[] = [];

      const result = autoClassifyColumns(headers, rows);

      // Con 0 filas, todos los headers deberían caer a string por defecto
      expect(result.stringColumns).toEqual(["col1", "col2"]);
    });

    it("[RED] should sample only first 50 rows for performance", () => {
      const headers = ["id", "value"];
      const rows = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        value: i * 10,
      }));

      const result = autoClassifyColumns(headers, rows);

      // Debería clasificar correctamente incluso con 100 filas
      expect(result.numericColumns).toContain("id");
      expect(result.numericColumns).toContain("value");
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("[RED] should handle columns with all null values", () => {
      const headers = ["null_col"];
      const rows = [{ null_col: null }, { null_col: null }, { null_col: null }];

      const result = autoClassifyColumns(headers, rows);

      // Con todos null, debería considerarse numérico (nulls permitidos en 90%)
      expect(result.numericColumns).toContain("null_col");
    });

    it("[RED] should handle single row dataset", () => {
      const headers = ["fecha", "valor"];
      const rows = [{ fecha: "2024-01-15", valor: 100 }];

      const result = autoClassifyColumns(headers, rows);

      expect(result.dateColumns).toContain("fecha");
      expect(result.numericColumns).toContain("valor");
    });

    it("[RED] should preserve header order in results", () => {
      const headers = ["a", "b", "c"];
      const rows = [
        { a: "2024-01-01", b: 100, c: "text" },
        { a: "2024-01-02", b: 200, c: "more" },
      ];

      const result = autoClassifyColumns(headers, rows);

      // Verificar que el orden se mantiene
      expect(result.dateColumns[0]).toBe("a");
      expect(result.numericColumns[0]).toBe("b");
      expect(result.stringColumns[0]).toBe("c");
    });
  });
});
