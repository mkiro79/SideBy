/**
 * Tests para CSV Parser Utility
 *
 * Valida que unifyDatasets agregue tags _source_group correctamente
 * y concatene ambos datasets en formato Long (RFC-002, RFC-003)
 */

import { describe, it, expect } from "vitest";
import { unifyDatasets } from "../csvParser.js";
import type { ParsedFileData } from "../../types/wizard.types.js";

describe("csvParser - unifyDatasets (Long Format)", () => {
  it("debe agregar tag _source_group a cada fila de ambos datasets", () => {
    const dataA: ParsedFileData = {
      headers: ["region", "ventas", "clientes"],
      rows: [
        { region: "Norte", ventas: 1000, clientes: 50 },
        { region: "Sur", ventas: 800, clientes: 40 },
      ],
      rowCount: 2,
    };

    const dataB: ParsedFileData = {
      headers: ["region", "ventas", "clientes"],
      rows: [
        { region: "Norte", ventas: 900, clientes: 45 },
        { region: "Sur", ventas: 750, clientes: 38 },
      ],
      rowCount: 2,
    };

    const result = unifyDatasets(dataA, dataB);

    // Verifica que haya 4 filas (2 de A + 2 de B)
    expect(result).toHaveLength(4);

    // Verifica que las primeras 2 filas sean del grupo A
    expect(result[0]).toEqual({
      region: "Norte",
      ventas: 1000,
      clientes: 50,
      _source_group: "groupA",
    });
    expect(result[1]).toEqual({
      region: "Sur",
      ventas: 800,
      clientes: 40,
      _source_group: "groupA",
    });

    // Verifica que las siguientes 2 filas sean del grupo B
    expect(result[2]).toEqual({
      region: "Norte",
      ventas: 900,
      clientes: 45,
      _source_group: "groupB",
    });
    expect(result[3]).toEqual({
      region: "Sur",
      ventas: 750,
      clientes: 38,
      _source_group: "groupB",
    });
  });

  it("debe mantener todas las columnas originales sin modificarlas", () => {
    const dataA: ParsedFileData = {
      headers: ["fecha", "ventas", "costos", "margen"],
      rows: [{ fecha: "2024-01", ventas: 1000, costos: 600, margen: 0.4 }],
      rowCount: 1,
    };

    const dataB: ParsedFileData = {
      headers: ["fecha", "ventas", "costos", "margen"],
      rows: [{ fecha: "2023-01", ventas: 900, costos: 550, margen: 0.39 }],
      rowCount: 1,
    };

    const result = unifyDatasets(dataA, dataB);

    expect(result).toHaveLength(2);

    // Verifica que todas las columnas originales estén presentes
    expect(result[0]).toHaveProperty("fecha");
    expect(result[0]).toHaveProperty("ventas");
    expect(result[0]).toHaveProperty("costos");
    expect(result[0]).toHaveProperty("margen");
    expect(result[0]).toHaveProperty("_source_group");

    // Verifica que no haya sufijos _current o _comparative
    expect(result[0]).not.toHaveProperty("ventas_current");
    expect(result[0]).not.toHaveProperty("ventas_comparative");
  });

  it("debe manejar correctamente datasets de diferentes tamaños", () => {
    const dataA: ParsedFileData = {
      headers: ["region", "ventas"],
      rows: [
        { region: "Norte", ventas: 1000 },
        { region: "Sur", ventas: 800 },
      ],
      rowCount: 2,
    };

    const dataB: ParsedFileData = {
      headers: ["region", "ventas"],
      rows: [
        { region: "Norte", ventas: 900 },
        { region: "Sur", ventas: 750 },
        { region: "Este", ventas: 1100 },
      ],
      rowCount: 3,
    };

    const result = unifyDatasets(dataA, dataB);

    // Total de filas = 2 + 3 = 5
    expect(result).toHaveLength(5);

    // Primeras 2 filas son de groupA
    expect(result[0]._source_group).toBe("groupA");
    expect(result[1]._source_group).toBe("groupA");

    // Últimas 3 filas son de groupB
    expect(result[2]._source_group).toBe("groupB");
    expect(result[3]._source_group).toBe("groupB");
    expect(result[4]._source_group).toBe("groupB");
  });

  it("debe preservar el orden original de cada dataset", () => {
    const dataA: ParsedFileData = {
      headers: ["id", "valor"],
      rows: [
        { id: 3, valor: 300 },
        { id: 1, valor: 100 },
        { id: 2, valor: 200 },
      ],
      rowCount: 3,
    };

    const dataB: ParsedFileData = {
      headers: ["id", "valor"],
      rows: [
        { id: 2, valor: 250 },
        { id: 3, valor: 350 },
        { id: 1, valor: 150 },
      ],
      rowCount: 3,
    };

    const result = unifyDatasets(dataA, dataB);

    // Verifica que el orden de A se preserve (primeras 3 filas)
    expect(result[0].id).toBe(3);
    expect(result[1].id).toBe(1);
    expect(result[2].id).toBe(2);

    // Verifica que el orden de B se preserve (últimas 3 filas)
    expect(result[3].id).toBe(2);
    expect(result[4].id).toBe(3);
    expect(result[5].id).toBe(1);
  });

  it('debe manejar valores especiales (null, undefined, 0, "")', () => {
    const dataA: ParsedFileData = {
      headers: ["categoria", "valor", "activo"],
      rows: [
        { categoria: "A", valor: 0, activo: true },
        { categoria: null, valor: 100, activo: false },
        { categoria: "", valor: 200, activo: true },
      ],
      rowCount: 3,
    };

    const dataB: ParsedFileData = {
      headers: ["categoria", "valor", "activo"],
      rows: [{ categoria: "B", valor: null, activo: true }],
      rowCount: 1,
    };

    const result = unifyDatasets(dataA, dataB);

    expect(result).toHaveLength(4);

    // Verifica que los valores especiales se preserven
    expect(result[0]).toEqual({
      categoria: "A",
      valor: 0,
      activo: true,
      _source_group: "groupA",
    });

    expect(result[1]).toEqual({
      categoria: null,
      valor: 100,
      activo: false,
      _source_group: "groupA",
    });

    expect(result[3]).toEqual({
      categoria: "B",
      valor: null,
      activo: true,
      _source_group: "groupB",
    });
  });

  it("debe manejar datasets vacíos correctamente", () => {
    const dataEmpty: ParsedFileData = {
      headers: ["col1", "col2"],
      rows: [],
      rowCount: 0,
    };

    const dataWithRows: ParsedFileData = {
      headers: ["col1", "col2"],
      rows: [{ col1: "a", col2: 1 }],
      rowCount: 1,
    };

    // dataA vacío, dataB con datos
    const result1 = unifyDatasets(dataEmpty, dataWithRows);
    expect(result1).toHaveLength(1);
    expect(result1[0]._source_group).toBe("groupB");

    // dataA con datos, dataB vacío
    const result2 = unifyDatasets(dataWithRows, dataEmpty);
    expect(result2).toHaveLength(1);
    expect(result2[0]._source_group).toBe("groupA");

    // Ambos vacíos
    const result3 = unifyDatasets(dataEmpty, dataEmpty);
    expect(result3).toHaveLength(0);
  });

  it("debe funcionar con datasets grandes (performance test)", () => {
    // Crear datasets con 1000 filas cada uno
    const rows = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      valor: Math.random() * 1000,
    }));

    const dataA: ParsedFileData = {
      headers: ["id", "valor"],
      rows: rows.slice(0, 1000),
      rowCount: 1000,
    };

    const dataB: ParsedFileData = {
      headers: ["id", "valor"],
      rows: rows.slice(0, 1000),
      rowCount: 1000,
    };

    const startTime = performance.now();
    const result = unifyDatasets(dataA, dataB);
    const endTime = performance.now();

    expect(result).toHaveLength(2000);
    expect(endTime - startTime).toBeLessThan(100); // Debe completarse en menos de 100ms

    // Verifica distribución de grupos
    const groupACount = result.filter(
      (r) => r._source_group === "groupA",
    ).length;
    const groupBCount = result.filter(
      (r) => r._source_group === "groupB",
    ).length;
    expect(groupACount).toBe(1000);
    expect(groupBCount).toBe(1000);
  });
});
