import { describe, it, expect } from "vitest";
import {
  datasetEditSchema,
  type DatasetEditFormData,
} from "../datasetEdit.schema.js";

describe("datasetEditSchema", () => {
  describe("Validación de meta", () => {
    it("Acepta name y description válidos", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción del dataset de prueba",
        },
        schemaMapping: {
          dimensionField: "region",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("Rechaza name vacío", () => {
      const invalidData: Partial<DatasetEditFormData> = {
        meta: {
          name: "",
          description: "Descripción válida",
        },
      };

      const result = datasetEditSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("name");
      }
    });

    it("Rechaza name demasiado corto (< 3 caracteres)", () => {
      const invalidData: Partial<DatasetEditFormData> = {
        meta: {
          name: "ab",
          description: "Descripción válida",
        },
      };

      const result = datasetEditSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("name");
      }
    });

    it("Acepta description opcional vacía", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "",
        },
        schemaMapping: {
          dimensionField: "region",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("Validación de sourceConfig (opcional)", () => {
    it("Acepta sourceConfig con grupos válidos", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        sourceConfig: {
          groupA: {
            label: "Grupo A",
            color: "#ff0000",
          },
          groupB: {
            label: "Grupo B",
            color: "#0000ff",
          },
        },
        schemaMapping: {
          dimensionField: "region",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("Rechaza color inválido (formato incorrecto)", () => {
      const invalidData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        sourceConfig: {
          groupA: {
            label: "Grupo A",
            color: "rojo", // Formato inválido
          },
          groupB: {
            label: "Grupo B",
            color: "#0000ff",
          },
        },
        schemaMapping: {
          dimensionField: "region",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path.join(".")).toContain("groupA.color");
      }
    });

    it("Acepta ausencia de sourceConfig (opcional)", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        // sourceConfig no está presente
        schemaMapping: {
          dimensionField: "region",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("Validación de schemaMapping", () => {
    it("Acepta dimensionField válido", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        schemaMapping: {
          dimensionField: "categoria",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("Acepta dateField opcional vacío", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        schemaMapping: {
          dimensionField: "categoria",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("Acepta kpiFields con configuración completa", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        schemaMapping: {
          dimensionField: "categoria",
          dateField: "fecha",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas_totales",
              label: "Ventas Totales",
              format: "currency",
            },
            {
              id: "kpi2",
              columnName: "cantidad_unidades",
              label: "Cantidad",
              format: "number",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("Rechaza kpiField con format inválido", () => {
      const invalidData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        schemaMapping: {
          dimensionField: "categoria",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "invalido", // Debe ser: number | currency | percentage
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path.join(".")).toContain("format");
      }
    });
  });

  describe("Validación de dashboardLayout", () => {
    it("Acepta templateId válido", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        schemaMapping: {
          dimensionField: "categoria",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("Acepta highlightedKpis vacío", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        schemaMapping: {
          dimensionField: "categoria",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("Acepta highlightedKpis con valores", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        schemaMapping: {
          dimensionField: "categoria",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: ["ventas_totales", "margen_neto"],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("Validación de aiConfig", () => {
    it("Acepta enabled false con userContext vacío", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        schemaMapping: {
          dimensionField: "categoria",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: false,
          userContext: "",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("Acepta enabled true con userContext válido", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        schemaMapping: {
          dimensionField: "categoria",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: true,
          userContext: "Este dataset contiene ventas mensuales por región",
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("Rechaza userContext demasiado largo (> 1000 caracteres)", () => {
      const invalidData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        schemaMapping: {
          dimensionField: "categoria",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: true,
          userContext: "A".repeat(1001), // Más de 1000 caracteres
        },
      };

      const result = datasetEditSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("userContext");
      }
    });

    it("Acepta userContext en el límite (1000 caracteres)", () => {
      const validData: DatasetEditFormData = {
        meta: {
          name: "Dataset Test",
          description: "Descripción",
        },
        schemaMapping: {
          dimensionField: "categoria",
          dateField: "",
          kpiFields: [
            {
              id: "kpi1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: [],
        },
        aiConfig: {
          enabled: true,
          userContext: "A".repeat(1000), // Exactamente 1000
        },
      };

      const result = datasetEditSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
