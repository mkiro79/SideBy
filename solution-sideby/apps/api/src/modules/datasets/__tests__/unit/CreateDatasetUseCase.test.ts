import { describe, it, expect, beforeEach } from "vitest";
import { CreateDatasetUseCase } from "@/modules/datasets/application/use-cases/CreateDatasetUseCase.js";
import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import type { Dataset } from "@/modules/datasets/domain/Dataset.entity.js";
import { DatasetValidationError } from "@/modules/datasets/domain/validation.rules.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Mock del repositorio para tests unitarios.
 * Simula el comportamiento del repositorio sin tocar la BD real.
 */
class MockDatasetRepository implements DatasetRepository {
  private readonly datasets: Map<string, Dataset> = new Map();
  private idCounter = 1;

  async create(dataset: Omit<Dataset, "id">): Promise<Dataset> {
    const newDataset: Dataset = {
      ...dataset,
      id: `test-dataset-${this.idCounter++}`,
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
    const updated = { ...existing, ...updates };
    this.datasets.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.datasets.delete(id);
  }

  async findAbandoned(cutoffDate: Date): Promise<Dataset[]> {
    return Array.from(this.datasets.values()).filter(
      (d) => d.status === "processing" && d.meta.createdAt < cutoffDate,
    );
  }

  // Helper para tests
  reset(): void {
    this.datasets.clear();
    this.idCounter = 1;
  }
}

describe("CreateDatasetUseCase", () => {
  let repository: MockDatasetRepository;
  let useCase: CreateDatasetUseCase;

  // Cargar archivos de fixture
  const loadFixture = (filename: string): Buffer => {
    const fixturePath = path.join(__dirname, "../fixtures", filename);
    return fs.readFileSync(fixturePath);
  };

  beforeEach(() => {
    repository = new MockDatasetRepository();
    useCase = new CreateDatasetUseCase(repository);
  });

  // ========================================
  // CASOS DE ERROR (RED PHASE)
  // ========================================

  describe("Validation Errors", () => {
    it("should throw error if fileA is not CSV/Excel", async () => {
      const invalidFile = {
        buffer: Buffer.from("fake content"),
        originalName: "document.txt",
        mimetype: "text/plain",
        size: 1024,
      };

      const validFile = {
        buffer: loadFixture("sales_2023.csv"),
        originalName: "sales_2023.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      await expect(
        useCase.execute({
          ownerId: "user_123",
          fileA: invalidFile,
          fileB: validFile,
        }),
      ).rejects.toThrow(DatasetValidationError);
    });

    it("should throw error if fileB is not CSV/Excel", async () => {
      const validFile = {
        buffer: loadFixture("sales_2024.csv"),
        originalName: "sales_2024.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const invalidFile = {
        buffer: Buffer.from("fake content"),
        originalName: "document.pdf",
        mimetype: "application/pdf",
        size: 1024,
      };

      await expect(
        useCase.execute({
          ownerId: "user_123",
          fileA: validFile,
          fileB: invalidFile,
        }),
      ).rejects.toThrow(DatasetValidationError);
    });

    it("should throw error if file size exceeds 10MB", async () => {
      const validFile = {
        buffer: loadFixture("sales_2024.csv"),
        originalName: "sales_2024.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const largeFile = {
        buffer: Buffer.from("x".repeat(100)),
        originalName: "large.csv",
        mimetype: "text/csv",
        size: 11 * 1024 * 1024, // 11MB
      };

      await expect(
        useCase.execute({
          ownerId: "user_123",
          fileA: largeFile,
          fileB: validFile,
        }),
      ).rejects.toThrow(DatasetValidationError);
    });

    it("should throw error if headers do not match between files", async () => {
      const fileA = {
        buffer: loadFixture("different_headers_A.csv"),
        originalName: "fileA.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const fileB = {
        buffer: loadFixture("different_headers_B.csv"),
        originalName: "fileB.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      await expect(
        useCase.execute({
          ownerId: "user_123",
          fileA,
          fileB,
        }),
      ).rejects.toThrow(DatasetValidationError);
    });

    it("should throw error if files have no data rows", async () => {
      const emptyFile = {
        buffer: Buffer.from("fecha,pais,ventas\n"), // Solo headers
        originalName: "empty.csv",
        mimetype: "text/csv",
        size: 100,
      };

      await expect(
        useCase.execute({
          ownerId: "user_123",
          fileA: emptyFile,
          fileB: emptyFile,
        }),
      ).rejects.toThrow(DatasetValidationError);
    });
  });

  // ========================================
  // CASOS DE ÉXITO (GREEN PHASE)
  // ========================================

  describe("Successful Creation", () => {
    it("should create dataset with status=processing", async () => {
      const fileA = {
        buffer: loadFixture("sales_2024.csv"),
        originalName: "sales_2024.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const fileB = {
        buffer: loadFixture("sales_2023.csv"),
        originalName: "sales_2023.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const result = await useCase.execute({
        ownerId: "user_123",
        fileA,
        fileB,
      });

      expect(result.status).toBe("processing");
      expect(result.datasetId).toBeDefined();
      expect(result.datasetId).toMatch(/^test-dataset-\d+$/);
    });

    it("should unify data with _source_group tags", async () => {
      const fileA = {
        buffer: loadFixture("sales_2024.csv"),
        originalName: "sales_2024.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const fileB = {
        buffer: loadFixture("sales_2023.csv"),
        originalName: "sales_2023.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const result = await useCase.execute({
        ownerId: "user_123",
        fileA,
        fileB,
      });

      // Verificar que el dataset fue creado correctamente
      const savedDataset = await repository.findById(result.datasetId);
      expect(savedDataset).toBeDefined();
      expect(savedDataset!.data.length).toBeGreaterThan(0);

      // Verificar que todas las filas tienen _source_group
      const allHaveSourceGroup = savedDataset!.data.every(
        (row) =>
          row._source_group === "groupA" || row._source_group === "groupB",
      );
      expect(allHaveSourceGroup).toBe(true);

      // Verificar que hay filas de ambos grupos
      const hasGroupA = savedDataset!.data.some(
        (row) => row._source_group === "groupA",
      );
      const hasGroupB = savedDataset!.data.some(
        (row) => row._source_group === "groupB",
      );
      expect(hasGroupA).toBe(true);
      expect(hasGroupB).toBe(true);
    });

    it("should store sourceConfig with original filenames", async () => {
      const fileA = {
        buffer: loadFixture("sales_2024.csv"),
        originalName: "sales_2024.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const fileB = {
        buffer: loadFixture("sales_2023.csv"),
        originalName: "ventas_historicas.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const result = await useCase.execute({
        ownerId: "user_123",
        fileA,
        fileB,
        groupALabel: "Año Actual",
        groupBLabel: "Año Anterior",
      });

      const savedDataset = await repository.findById(result.datasetId);
      expect(savedDataset!.sourceConfig.groupA.originalFileName).toBe(
        "sales_2024.csv",
      );
      expect(savedDataset!.sourceConfig.groupB.originalFileName).toBe(
        "ventas_historicas.csv",
      );
      expect(savedDataset!.sourceConfig.groupA.label).toBe("Año Actual");
      expect(savedDataset!.sourceConfig.groupB.label).toBe("Año Anterior");
    });

    it("should return datasetId and row counts", async () => {
      const fileA = {
        buffer: loadFixture("sales_2024.csv"),
        originalName: "sales_2024.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const fileB = {
        buffer: loadFixture("sales_2023.csv"),
        originalName: "sales_2023.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const result = await useCase.execute({
        ownerId: "user_123",
        fileA,
        fileB,
      });

      expect(result.datasetId).toBeDefined();
      expect(result.rowCount).toBe(10); // 5 + 5 filas
      expect(result.groupA.rowCount).toBe(5);
      expect(result.groupB.rowCount).toBe(5);
      expect(result.groupA.fileName).toBe("sales_2024.csv");
      expect(result.groupB.fileName).toBe("sales_2023.csv");
    });

    it("should use default labels and colors if not provided", async () => {
      const fileA = {
        buffer: loadFixture("sales_2024.csv"),
        originalName: "sales_2024.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const fileB = {
        buffer: loadFixture("sales_2023.csv"),
        originalName: "sales_2023.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const result = await useCase.execute({
        ownerId: "user_123",
        fileA,
        fileB,
      });

      const savedDataset = await repository.findById(result.datasetId);
      expect(savedDataset!.sourceConfig.groupA.label).toBe("Grupo A");
      expect(savedDataset!.sourceConfig.groupB.label).toBe("Grupo B");
      expect(savedDataset!.sourceConfig.groupA.color).toMatch(
        /^#[0-9a-f]{6}$/i,
      );
      expect(savedDataset!.sourceConfig.groupB.color).toMatch(
        /^#[0-9a-f]{6}$/i,
      );
    });

    it("should set ownerId correctly", async () => {
      const fileA = {
        buffer: loadFixture("sales_2024.csv"),
        originalName: "sales_2024.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const fileB = {
        buffer: loadFixture("sales_2023.csv"),
        originalName: "sales_2023.csv",
        mimetype: "text/csv",
        size: 1024,
      };

      const result = await useCase.execute({
        ownerId: "user_xyz_789",
        fileA,
        fileB,
      });

      const savedDataset = await repository.findById(result.datasetId);
      expect(savedDataset!.ownerId).toBe("user_xyz_789");
    });
  });
});
