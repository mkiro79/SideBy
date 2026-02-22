import { describe, it, expect, beforeEach } from "vitest";
import { UpdateMappingUseCase } from "@/modules/datasets/application/use-cases/UpdateMappingUseCase.js";
import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import type { Dataset } from "@/modules/datasets/domain/Dataset.entity.js";
import { DatasetNotFoundError } from "@/modules/datasets/domain/errors/DatasetNotFoundError.js";
import { UnauthorizedAccessError } from "@/modules/datasets/domain/errors/UnauthorizedAccessError.js";
import { MappingValidationError } from "@/modules/datasets/domain/errors/MappingValidationError.js";

class MockDatasetRepository implements DatasetRepository {
  private readonly datasets: Map<string, Dataset> = new Map();

  async create(dataset: Omit<Dataset, "id">): Promise<Dataset> {
    const newDataset: Dataset = {
      ...dataset,
      id: `test-${Date.now()}`,
    };
    this.datasets.set(newDataset.id, newDataset);
    return newDataset;
  }

  async findById(id: string): Promise<Dataset | null> {
    return this.datasets.get(id) || null;
  }

  async findByOwnerId(ownerId: string): Promise<Dataset[]> {
    return Array.from(this.datasets.values()).filter(
      (d) => d.ownerId === ownerId,
    );
  }

  async update(id: string, updates: Partial<Dataset>): Promise<Dataset> {
    const existing = this.datasets.get(id);
    if (!existing) throw new Error("Dataset not found");
    const updated = {
      ...existing,
      ...updates,
      meta: { ...existing.meta, ...updates.meta },
    };
    this.datasets.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.datasets.delete(id);
  }

  async findAbandoned(_cutoffDate: Date): Promise<Dataset[]> {
    return [];
  }

  async deleteByOwnerId(_ownerId: string): Promise<void> {
    return;
  }

  // Helper para insertar datasets de prueba
  seed(dataset: Dataset): void {
    this.datasets.set(dataset.id, dataset);
  }
}

describe("UpdateMappingUseCase", () => {
  let repository: MockDatasetRepository;
  let useCase: UpdateMappingUseCase;

  const createTestDataset = (overrides?: Partial<Dataset>): Dataset => ({
    id: "dataset_123",
    ownerId: "user_123",
    status: "processing",
    meta: {
      name: "",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    sourceConfig: {
      groupA: {
        label: "Grupo A",
        color: "#3b82f6",
        originalFileName: "fileA.csv",
        rowCount: 100,
      },
      groupB: {
        label: "Grupo B",
        color: "#ef4444",
        originalFileName: "fileB.csv",
        rowCount: 100,
      },
    },
    data: [
      { _source_group: "groupA", fecha: "2024-01-01", ventas: 1000 },
      { _source_group: "groupB", fecha: "2023-01-01", ventas: 900 },
    ],
    ...overrides,
  });

  beforeEach(() => {
    repository = new MockDatasetRepository();
    useCase = new UpdateMappingUseCase(repository);
  });

  // ========================================
  // CASOS DE ERROR (RED PHASE)
  // ========================================

  describe("Validation Errors", () => {
    it("should throw error if dataset not found", async () => {
      await expect(
        useCase.execute({
          datasetId: "non-existent",
          ownerId: "user_123",
          meta: { name: "Test Dataset" },
          schemaMapping: {
            dimensionField: "fecha",
            kpiFields: [
              {
                id: "kpi_1",
                columnName: "ventas",
                label: "Ventas",
                format: "currency",
              },
            ],
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: ["kpi_1"],
          },
        }),
      ).rejects.toThrow(DatasetNotFoundError);
    });

    it("should throw error if ownerId does not match", async () => {
      repository.seed(createTestDataset({ ownerId: "user_456" }));

      await expect(
        useCase.execute({
          datasetId: "dataset_123",
          ownerId: "user_123", // Different owner
          meta: { name: "Test Dataset" },
          schemaMapping: {
            dimensionField: "fecha",
            kpiFields: [
              {
                id: "kpi_1",
                columnName: "ventas",
                label: "Ventas",
                format: "currency",
              },
            ],
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: ["kpi_1"],
          },
        }),
      ).rejects.toThrow(UnauthorizedAccessError);
    });

    it("should throw error if name is empty", async () => {
      repository.seed(createTestDataset());

      await expect(
        useCase.execute({
          datasetId: "dataset_123",
          ownerId: "user_123",
          meta: { name: "" }, // Empty name
          schemaMapping: {
            dimensionField: "fecha",
            kpiFields: [
              {
                id: "kpi_1",
                columnName: "ventas",
                label: "Ventas",
                format: "currency",
              },
            ],
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: ["kpi_1"],
          },
        }),
      ).rejects.toThrow(MappingValidationError);
    });

    it("should throw error if name exceeds 100 chars", async () => {
      repository.seed(createTestDataset());

      await expect(
        useCase.execute({
          datasetId: "dataset_123",
          ownerId: "user_123",
          meta: { name: "x".repeat(101) }, // 101 characters
          schemaMapping: {
            dimensionField: "fecha",
            kpiFields: [
              {
                id: "kpi_1",
                columnName: "ventas",
                label: "Ventas",
                format: "currency",
              },
            ],
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: ["kpi_1"],
          },
        }),
      ).rejects.toThrow(MappingValidationError);
    });

    it("should throw error if no dimension selected", async () => {
      repository.seed(createTestDataset());

      await expect(
        useCase.execute({
          datasetId: "dataset_123",
          ownerId: "user_123",
          meta: { name: "Test Dataset" },
          schemaMapping: {
            dimensionField: "", // Empty dimension
            kpiFields: [
              {
                id: "kpi_1",
                columnName: "ventas",
                label: "Ventas",
                format: "currency",
              },
            ],
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: ["kpi_1"],
          },
        }),
      ).rejects.toThrow(MappingValidationError);
    });

    it("should throw error if no KPIs selected", async () => {
      repository.seed(createTestDataset());

      await expect(
        useCase.execute({
          datasetId: "dataset_123",
          ownerId: "user_123",
          meta: { name: "Test Dataset" },
          schemaMapping: {
            dimensionField: "fecha",
            kpiFields: [], // No KPIs
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: [],
          },
        }),
      ).rejects.toThrow(MappingValidationError);
    });

    it("should throw error if more than 4 KPIs highlighted", async () => {
      repository.seed(createTestDataset());

      await expect(
        useCase.execute({
          datasetId: "dataset_123",
          ownerId: "user_123",
          meta: { name: "Test Dataset" },
          schemaMapping: {
            dimensionField: "fecha",
            kpiFields: [
              {
                id: "kpi_1",
                columnName: "ventas",
                label: "Ventas",
                format: "currency",
              },
              {
                id: "kpi_2",
                columnName: "visitas",
                label: "Visitas",
                format: "number",
              },
              {
                id: "kpi_3",
                columnName: "conversion",
                label: "Conversión",
                format: "percentage",
              },
              {
                id: "kpi_4",
                columnName: "ingresos",
                label: "Ingresos",
                format: "currency",
              },
              {
                id: "kpi_5",
                columnName: "costos",
                label: "Costos",
                format: "currency",
              },
            ],
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: ["kpi_1", "kpi_2", "kpi_3", "kpi_4", "kpi_5"], // 5 KPIs!
          },
        }),
      ).rejects.toThrow(MappingValidationError);
    });

    it("should throw error if AI context exceeds 500 chars", async () => {
      repository.seed(createTestDataset());

      await expect(
        useCase.execute({
          datasetId: "dataset_123",
          ownerId: "user_123",
          meta: { name: "Test Dataset" },
          schemaMapping: {
            dimensionField: "fecha",
            kpiFields: [
              {
                id: "kpi_1",
                columnName: "ventas",
                label: "Ventas",
                format: "currency",
              },
            ],
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: ["kpi_1"],
          },
          aiConfig: {
            enabled: true,
            userContext: "x".repeat(501), // 501 characters
          },
        }),
      ).rejects.toThrow(MappingValidationError);
    });

    it("should throw error if group label exceeds max length", async () => {
      repository.seed(createTestDataset());

      await expect(
        useCase.execute({
          datasetId: "dataset_123",
          ownerId: "user_123",
          meta: { name: "Test Dataset" },
          schemaMapping: {
            dimensionField: "fecha",
            kpiFields: [
              {
                id: "kpi_1",
                columnName: "ventas",
                label: "Ventas",
                format: "currency",
              },
            ],
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: ["kpi_1"],
          },
          sourceConfig: {
            groupA: {
              label: "x".repeat(51),
            },
          },
        }),
      ).rejects.toThrow(MappingValidationError);
    });

    it("should throw error if group color is invalid", async () => {
      repository.seed(createTestDataset());

      await expect(
        useCase.execute({
          datasetId: "dataset_123",
          ownerId: "user_123",
          meta: { name: "Test Dataset" },
          schemaMapping: {
            dimensionField: "fecha",
            kpiFields: [
              {
                id: "kpi_1",
                columnName: "ventas",
                label: "Ventas",
                format: "currency",
              },
            ],
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: ["kpi_1"],
          },
          sourceConfig: {
            groupB: {
              color: "not-a-hex",
            },
          },
        }),
      ).rejects.toThrow(MappingValidationError);
    });

    it("should throw error if group label is empty or whitespace-only", async () => {
      repository.seed(createTestDataset());

      // Test empty string
      await expect(
        useCase.execute({
          datasetId: "dataset_123",
          ownerId: "user_123",
          meta: { name: "Test Dataset" },
          schemaMapping: {
            dimensionField: "fecha",
            kpiFields: [
              {
                id: "kpi_1",
                columnName: "ventas",
                label: "Ventas",
                format: "currency",
              },
            ],
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: ["kpi_1"],
          },
          sourceConfig: {
            groupA: {
              label: "",
            },
          },
        }),
      ).rejects.toThrow(MappingValidationError);

      // Test whitespace-only string
      await expect(
        useCase.execute({
          datasetId: "dataset_123",
          ownerId: "user_123",
          meta: { name: "Test Dataset" },
          schemaMapping: {
            dimensionField: "fecha",
            kpiFields: [
              {
                id: "kpi_1",
                columnName: "ventas",
                label: "Ventas",
                format: "currency",
              },
            ],
          },
          dashboardLayout: {
            templateId: "sideby_executive",
            highlightedKpis: ["kpi_1"],
          },
          sourceConfig: {
            groupB: {
              label: "   ",
            },
          },
        }),
      ).rejects.toThrow(MappingValidationError);
    });
  });

  // ========================================
  // CASOS DE ÉXITO (GREEN PHASE)
  // ========================================

  describe("Successful Updates", () => {
    it("should update all configuration fields", async () => {
      repository.seed(createTestDataset());

      const result = await useCase.execute({
        datasetId: "dataset_123",
        ownerId: "user_123",
        meta: {
          name: "Ventas 2024 vs 2023",
          description: "Comparación anual de ventas",
        },
        schemaMapping: {
          dimensionField: "fecha",
          dateField: "fecha",
          kpiFields: [
            {
              id: "kpi_1",
              columnName: "ventas",
              label: "Ventas Totales",
              format: "currency",
            },
          ],
          categoricalFields: ["pais"],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: ["kpi_1"],
        },
        aiConfig: {
          enabled: true,
          userContext: "Enfocarse en tendencias de crecimiento",
        },
      });

      expect(result.status).toBe("ready");
      expect(result.datasetId).toBe("dataset_123");

      const updated = await repository.findById("dataset_123");
      expect(updated!.meta.name).toBe("Ventas 2024 vs 2023");
      expect(updated!.meta.description).toBe("Comparación anual de ventas");
      expect(updated!.schemaMapping?.dimensionField).toBe("fecha");
      expect(updated!.dashboardLayout?.highlightedKpis).toEqual(["kpi_1"]);
      expect(updated!.aiConfig?.enabled).toBe(true);
    });

    it("should change status from processing to ready", async () => {
      repository.seed(createTestDataset({ status: "processing" }));

      const result = await useCase.execute({
        datasetId: "dataset_123",
        ownerId: "user_123",
        meta: { name: "Test Dataset" },
        schemaMapping: {
          dimensionField: "fecha",
          kpiFields: [
            {
              id: "kpi_1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: ["kpi_1"],
        },
      });

      expect(result.status).toBe("ready");

      const updated = await repository.findById("dataset_123");
      expect(updated!.status).toBe("ready");
    });

    it("should update updatedAt timestamp", async () => {
      const oldDate = new Date("2024-01-01");
      repository.seed(
        createTestDataset({
          meta: { name: "", createdAt: oldDate, updatedAt: oldDate },
        }),
      );

      await useCase.execute({
        datasetId: "dataset_123",
        ownerId: "user_123",
        meta: { name: "Test Dataset" },
        schemaMapping: {
          dimensionField: "fecha",
          kpiFields: [
            {
              id: "kpi_1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: ["kpi_1"],
        },
      });

      const updated = await repository.findById("dataset_123");
      expect(updated!.meta.updatedAt.getTime()).toBeGreaterThan(
        oldDate.getTime(),
      );
    });

    it("should return datasetId and new status", async () => {
      repository.seed(createTestDataset());

      const result = await useCase.execute({
        datasetId: "dataset_123",
        ownerId: "user_123",
        meta: { name: "Test Dataset" },
        schemaMapping: {
          dimensionField: "fecha",
          kpiFields: [
            {
              id: "kpi_1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: ["kpi_1"],
        },
      });

      expect(result.datasetId).toBe("dataset_123");
      expect(result.status).toBe("ready");
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should update sourceConfig labels and colors", async () => {
      repository.seed(createTestDataset());

      await useCase.execute({
        datasetId: "dataset_123",
        ownerId: "user_123",
        meta: { name: "Test Dataset" },
        schemaMapping: {
          dimensionField: "fecha",
          kpiFields: [
            {
              id: "kpi_1",
              columnName: "ventas",
              label: "Ventas",
              format: "currency",
            },
          ],
        },
        dashboardLayout: {
          templateId: "sideby_executive",
          highlightedKpis: ["kpi_1"],
        },
        sourceConfig: {
          groupA: {
            label: "Actual",
            color: "#3b82f6",
          },
          groupB: {
            label: "Comparativo",
            color: "#6366f1",
          },
        },
      });

      const updated = await repository.findById("dataset_123");
      expect(updated!.sourceConfig.groupA.label).toBe("Actual");
      expect(updated!.sourceConfig.groupA.color).toBe("#3b82f6");
      expect(updated!.sourceConfig.groupB.label).toBe("Comparativo");
      expect(updated!.sourceConfig.groupB.color).toBe("#6366f1");
      expect(updated!.sourceConfig.groupA.originalFileName).toBe("fileA.csv");
      expect(updated!.sourceConfig.groupB.originalFileName).toBe("fileB.csv");
      expect(updated!.sourceConfig.groupA.rowCount).toBe(100);
      expect(updated!.sourceConfig.groupB.rowCount).toBe(100);
    });
  });
});
