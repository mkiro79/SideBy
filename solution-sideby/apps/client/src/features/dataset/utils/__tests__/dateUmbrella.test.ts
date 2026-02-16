/**
 * Tests para Date Umbrella System
 *
 * Sistema para alinear fechas de diferentes períodos (años) en un eje común
 * para permitir comparaciones válidas "side-by-side"
 */

import { describe, it, expect } from "vitest";
import { createDateUmbrella } from "../dateUmbrella.js";
import type { DataRow } from "../../types/api.types.js";

describe("createDateUmbrella", () => {
  // ============================================================================
  // GRANULARIDAD: MESES
  // ============================================================================

  describe("Granularidad: months", () => {
    it("debe alinear fechas por mes calendario ignorando el año", () => {
      // Arrange: Datos de 2023 vs 2024, mismo patrón mensual
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-15", revenue: 100 },
        { _source_group: "groupA", date: "2023-02-15", revenue: 200 },
        { _source_group: "groupA", date: "2023-03-15", revenue: 300 },
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-01-15", revenue: 150 },
        { _source_group: "groupB", date: "2024-02-15", revenue: 250 },
        { _source_group: "groupB", date: "2024-03-15", revenue: 350 },
      ];

      // Act
      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "months",
        true,
      );

      // Assert
      expect(result).toHaveLength(3);

      // Enero (01)
      expect(result[0].umbrellaKey).toBe("01");
      expect(result[0].label).toContain("Ene");
      expect(result[0].groupA?.value).toBe(100);
      expect(result[0].groupA?.year).toBe("2023");
      expect(result[0].groupB?.value).toBe(150);
      expect(result[0].groupB?.year).toBe("2024");

      // Febrero (02)
      expect(result[1].umbrellaKey).toBe("02");
      expect(result[1].label).toContain("Feb");
      expect(result[1].groupA?.value).toBe(200);
      expect(result[1].groupB?.value).toBe(250);

      // Marzo (03)
      expect(result[2].umbrellaKey).toBe("03");
      expect(result[2].label).toContain("Mar");
      expect(result[2].groupA?.value).toBe(300);
      expect(result[2].groupB?.value).toBe(350);
    });

    it("debe omitir gaps cuando ambos grupos no tienen datos (omitGaps=true)", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-15", revenue: 100 },
        // Febrero no tiene datos en ningún grupo
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-03-15", revenue: 300 },
      ];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "months",
        true,
      );

      // Solo debe devolver Enero (groupA) y Marzo (groupB)
      expect(result).toHaveLength(2);
      expect(result[0].umbrellaKey).toBe("01");
      expect(result[0].groupA?.value).toBe(100);
      expect(result[0].groupB).toBeNull();

      expect(result[1].umbrellaKey).toBe("03");
      expect(result[1].groupA).toBeNull();
      expect(result[1].groupB?.value).toBe(300);
    });

    it("debe incluir gaps cuando omitGaps=false", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-15", revenue: 100 },
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-03-15", revenue: 300 },
      ];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "months",
        false,
      );

      // Debe incluir Enero, Febrero (gap), Marzo
      expect(result).toHaveLength(3);
      expect(result[0].umbrellaKey).toBe("01");
      expect(result[1].umbrellaKey).toBe("02");
      expect(result[1].groupA).toBeNull();
      expect(result[1].groupB).toBeNull();
      expect(result[2].umbrellaKey).toBe("03");
    });

    it("debe agregar múltiples valores del mismo mes", () => {
      // Múltiples transacciones en el mismo mes
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-05", revenue: 50 },
        { _source_group: "groupA", date: "2023-01-15", revenue: 100 },
        { _source_group: "groupA", date: "2023-01-25", revenue: 150 },
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-01-10", revenue: 75 },
        { _source_group: "groupB", date: "2024-01-20", revenue: 125 },
      ];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "months",
        true,
      );

      // Solo un punto para Enero con valores agregados
      expect(result).toHaveLength(1);
      expect(result[0].umbrellaKey).toBe("01");
      expect(result[0].groupA?.value).toBe(300); // 50 + 100 + 150
      expect(result[0].groupB?.value).toBe(200); // 75 + 125
    });

    it("debe generar labels de meses en español", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-15", revenue: 100 },
        { _source_group: "groupA", date: "2023-06-15", revenue: 200 },
        { _source_group: "groupA", date: "2023-12-15", revenue: 300 },
      ];

      const groupB: DataRow[] = [];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "months",
        true,
      );

      expect(result[0].label).toBe("Ene");
      expect(result[1].label).toBe("Jun");
      expect(result[2].label).toBe("Dic");
    });
  });

  // ============================================================================
  // GRANULARIDAD: DÍAS
  // ============================================================================

  describe("Granularidad: days", () => {
    it("debe alinear fechas por día del mes ignorando el año", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-15", revenue: 100 },
        { _source_group: "groupA", date: "2023-01-16", revenue: 110 },
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-01-15", revenue: 150 },
        { _source_group: "groupB", date: "2024-01-16", revenue: 160 },
      ];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "days",
        true,
      );

      expect(result).toHaveLength(2);
      expect(result[0].umbrellaKey).toBe("01/15");
      expect(result[0].groupA?.value).toBe(100);
      expect(result[0].groupB?.value).toBe(150);

      expect(result[1].umbrellaKey).toBe("01/16");
      expect(result[1].groupA?.value).toBe(110);
      expect(result[1].groupB?.value).toBe(160);
    });

    it("debe agregar múltiples transacciones del mismo día", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-15T08:00:00", revenue: 50 },
        { _source_group: "groupA", date: "2023-01-15T14:00:00", revenue: 75 },
        { _source_group: "groupA", date: "2023-01-15T18:00:00", revenue: 25 },
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-01-15T10:00:00", revenue: 100 },
      ];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "days",
        true,
      );

      expect(result).toHaveLength(1);
      expect(result[0].umbrellaKey).toBe("01/15");
      expect(result[0].groupA?.value).toBe(150); // 50 + 75 + 25
      expect(result[0].groupB?.value).toBe(100);
    });
  });

  // ============================================================================
  // GRANULARIDAD: SEMANAS
  // ============================================================================

  describe("Granularidad: weeks", () => {
    it("debe alinear fechas por número de semana ISO", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-02", revenue: 100 }, // Week 1
        { _source_group: "groupA", date: "2023-01-09", revenue: 200 }, // Week 2
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-01-01", revenue: 150 }, // Week 1
        { _source_group: "groupB", date: "2024-01-08", revenue: 250 }, // Week 2
      ];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "weeks",
        true,
      );

      expect(result).toHaveLength(2);
      expect(result[0].umbrellaKey).toBe("Week 01");
      expect(result[0].groupA?.value).toBe(100);
      expect(result[0].groupB?.value).toBe(150);

      expect(result[1].umbrellaKey).toBe("Week 02");
      expect(result[1].groupA?.value).toBe(200);
      expect(result[1].groupB?.value).toBe(250);
    });

    it("debe agregar múltiples valores de la misma semana", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-02", revenue: 50 }, // Week 1
        { _source_group: "groupA", date: "2023-01-03", revenue: 60 }, // Week 1
        { _source_group: "groupA", date: "2023-01-04", revenue: 70 }, // Week 1
      ];

      const groupB: DataRow[] = [];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "weeks",
        true,
      );

      expect(result).toHaveLength(1);
      expect(result[0].umbrellaKey).toBe("Week 01");
      expect(result[0].groupA?.value).toBe(180); // 50 + 60 + 70
    });
  });

  // ============================================================================
  // GRANULARIDAD: TRIMESTRES
  // ============================================================================

  describe("Granularidad: quarters", () => {
    it("debe alinear fechas por trimestre", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-15", revenue: 100 }, // Q1
        { _source_group: "groupA", date: "2023-04-15", revenue: 200 }, // Q2
        { _source_group: "groupA", date: "2023-07-15", revenue: 300 }, // Q3
        { _source_group: "groupA", date: "2023-10-15", revenue: 400 }, // Q4
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-02-15", revenue: 150 }, // Q1
        { _source_group: "groupB", date: "2024-05-15", revenue: 250 }, // Q2
        { _source_group: "groupB", date: "2024-08-15", revenue: 350 }, // Q3
        { _source_group: "groupB", date: "2024-11-15", revenue: 450 }, // Q4
      ];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "quarters",
        true,
      );

      expect(result).toHaveLength(4);

      expect(result[0].umbrellaKey).toBe("Q1");
      expect(result[0].groupA?.value).toBe(100);
      expect(result[0].groupB?.value).toBe(150);

      expect(result[1].umbrellaKey).toBe("Q2");
      expect(result[1].groupA?.value).toBe(200);
      expect(result[1].groupB?.value).toBe(250);

      expect(result[2].umbrellaKey).toBe("Q3");
      expect(result[2].groupA?.value).toBe(300);
      expect(result[2].groupB?.value).toBe(350);

      expect(result[3].umbrellaKey).toBe("Q4");
      expect(result[3].groupA?.value).toBe(400);
      expect(result[3].groupB?.value).toBe(450);
    });

    it("debe agregar múltiples valores del mismo trimestre", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-15", revenue: 100 }, // Q1
        { _source_group: "groupA", date: "2023-02-15", revenue: 150 }, // Q1
        { _source_group: "groupA", date: "2023-03-15", revenue: 200 }, // Q1
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-01-10", revenue: 120 }, // Q1
        { _source_group: "groupB", date: "2024-03-20", revenue: 180 }, // Q1
      ];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "quarters",
        true,
      );

      expect(result).toHaveLength(1);
      expect(result[0].umbrellaKey).toBe("Q1");
      expect(result[0].groupA?.value).toBe(450); // 100 + 150 + 200
      expect(result[0].groupB?.value).toBe(300); // 120 + 180
    });
  });

  // ============================================================================
  // EDGE CASES Y MANEJO DE ERRORES
  // ============================================================================

  describe("Edge cases", () => {
    it("debe manejar arrays vacíos", () => {
      const result = createDateUmbrella(
        [],
        [],
        "date",
        "revenue",
        "months",
        true,
      );
      expect(result).toHaveLength(0);
    });

    it("debe manejar groupA vacío y groupB con datos", () => {
      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-01-15", revenue: 150 },
      ];

      const result = createDateUmbrella(
        [],
        groupB,
        "date",
        "revenue",
        "months",
        true,
      );

      expect(result).toHaveLength(1);
      expect(result[0].groupA).toBeNull();
      expect(result[0].groupB?.value).toBe(150);
    });

    it("debe manejar groupB vacío y groupA con datos", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-15", revenue: 100 },
      ];

      const result = createDateUmbrella(
        groupA,
        [],
        "date",
        "revenue",
        "months",
        true,
      );

      expect(result).toHaveLength(1);
      expect(result[0].groupA?.value).toBe(100);
      expect(result[0].groupB).toBeNull();
    });

    it("debe ignorar filas con fechas inválidas", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "invalid-date", revenue: 100 },
        { _source_group: "groupA", date: "2023-01-15", revenue: 200 },
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-01-15", revenue: 150 },
      ];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "months",
        true,
      );

      // Solo debe procesar la fila válida
      expect(result).toHaveLength(1);
      expect(result[0].groupA?.value).toBe(200);
    });

    it("debe ignorar filas sin campo de fecha", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", revenue: 100 }, // Sin campo 'date'
        { _source_group: "groupA", date: "2023-01-15", revenue: 200 },
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-01-15", revenue: 150 },
      ];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "months",
        true,
      );

      expect(result).toHaveLength(1);
      expect(result[0].groupA?.value).toBe(200);
    });

    it("debe manejar valores no numéricos en el valor KPI", () => {
      const groupA: DataRow[] = [
        {
          _source_group: "groupA",
          date: "2023-01-15",
          revenue: "not-a-number",
        },
        { _source_group: "groupA", date: "2023-01-16", revenue: 100 },
      ];

      const groupB: DataRow[] = [
        { _source_group: "groupB", date: "2024-01-15", revenue: 150 },
      ];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "days",
        true,
      );

      // Debe convertir valores inválidos a 0
      expect(result).toHaveLength(2);
      expect(result[0].groupA?.value).toBe(0);
      expect(result[1].groupA?.value).toBe(100);
    });

    it("debe mantener la originalDate más reciente al agregar", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-01-05", revenue: 50 },
        { _source_group: "groupA", date: "2023-01-25", revenue: 100 }, // Más reciente
      ];

      const groupB: DataRow[] = [];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "months",
        true,
      );

      expect(result).toHaveLength(1);
      const jan25 = new Date("2023-01-25");
      expect(result[0].groupA?.originalDate.getTime()).toBe(jan25.getTime());
    });
  });

  // ============================================================================
  // INTEGRACIÓN CON DATOS REALES
  // ============================================================================

  describe("Integración con estructura real de datos", () => {
    it("debe funcionar con la estructura de performance_daily CSVs", () => {
      // Simular estructura real: Date,Month,Year,Country,Product,Revenue,...
      const groupA: DataRow[] = [
        {
          _source_group: "groupA",
          Date: "01/01/2023",
          Month: "January",
          Year: "2023",
          Country: "Spain",
          Product: "Basic",
          Revenue: 100,
          MarketingSpend: 50,
        },
        {
          _source_group: "groupA",
          Date: "02/01/2023",
          Month: "January",
          Year: "2023",
          Country: "Spain",
          Product: "Basic",
          Revenue: 150,
          MarketingSpend: 75,
        },
      ];

      const groupB: DataRow[] = [
        {
          _source_group: "groupB",
          Date: "01/01/2024",
          Month: "January",
          Year: "2024",
          Country: "Spain",
          Product: "Basic",
          Revenue: 200,
          MarketingSpend: 100,
        },
      ];

      // Probar con campo 'Date' (capitalizado, formato DD/MM/YYYY)
      const result = createDateUmbrella(
        groupA,
        groupB,
        "Date",
        "Revenue",
        "days",
        true,
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].groupA?.value).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // ORDENAMIENTO
  // ============================================================================

  describe("Ordenamiento de resultados", () => {
    it("debe devolver resultados ordenados cronológicamente", () => {
      const groupA: DataRow[] = [
        { _source_group: "groupA", date: "2023-03-15", revenue: 300 },
        { _source_group: "groupA", date: "2023-01-15", revenue: 100 },
        { _source_group: "groupA", date: "2023-02-15", revenue: 200 },
      ];

      const groupB: DataRow[] = [];

      const result = createDateUmbrella(
        groupA,
        groupB,
        "date",
        "revenue",
        "months",
        true,
      );

      // Debe estar ordenado: Enero, Febrero, Marzo
      expect(result[0].umbrellaKey).toBe("01");
      expect(result[1].umbrellaKey).toBe("02");
      expect(result[2].umbrellaKey).toBe("03");
    });
  });
});
