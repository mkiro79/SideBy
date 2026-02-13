import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import type {
  CreateDatasetInput,
  CreateDatasetOutput,
} from "@/modules/datasets/application/dtos/dataset.dtos.js";
import type { Dataset } from "@/modules/datasets/domain/Dataset.entity.js";
import { CsvParser } from "@/modules/datasets/infrastructure/parsers/CsvParser.js";
import { DataUnifier } from "@/modules/datasets/infrastructure/parsers/DataUnifier.js";
import { DatasetRules } from "@/modules/datasets/domain/validation.rules.js";
import logger from "@/utils/logger.js";

/**
 * Caso de Uso: Crear Dataset.
 *
 * Responsabilidades:
 * 1. Validar archivos subidos (formato, tamaño, tipo MIME)
 * 2. Parsear ambos archivos CSV
 * 3. Validar que los headers coincidan exactamente
 * 4. Unificar los datos añadiendo tags _source_group
 * 5. Validar límites de filas
 * 6. Crear y persistir la entidad Dataset con status="processing"
 * 7. Retornar información del dataset creado
 *
 * @example
 * ```typescript
 * const useCase = new CreateDatasetUseCase(repository);
 * const result = await useCase.execute({
 *   ownerId: "user_123",
 *   fileA: { buffer, originalName, mimetype, size },
 *   fileB: { buffer, originalName, mimetype, size }
 * });
 * ```
 */
export class CreateDatasetUseCase {
  private readonly csvParser: CsvParser;
  private readonly dataUnifier: DataUnifier;

  constructor(private readonly repository: DatasetRepository) {
    this.csvParser = new CsvParser();
    this.dataUnifier = new DataUnifier();
  }

  async execute(input: CreateDatasetInput): Promise<CreateDatasetOutput> {
    logger.info(
      {
        ownerId: input.ownerId,
        fileAName: input.fileA.originalName,
        fileBName: input.fileB.originalName,
      },
      "CreateDatasetUseCase: Starting execution",
    );

    // PASO 1: Parsear ambos archivos
    const parsedA = await this.csvParser.parse(input.fileA);
    const parsedB = await this.csvParser.parse(input.fileB);

    logger.info(
      {
        fileARows: parsedA.rowCount,
        fileBRows: parsedB.rowCount,
        headers: parsedA.headers,
      },
      "Files parsed successfully",
    );

    // PASO 2: Validar que los headers coincidan
    this.csvParser.validateHeadersMatch(parsedA.headers, parsedB.headers);

    // PASO 3: Unificar datos con tags _source_group
    const unifiedData = this.dataUnifier.unify(parsedA.rows, parsedB.rows);

    // PASO 4: Validar datos unificados
    this.dataUnifier.validateUnifiedData(unifiedData);

    // PASO 5: Construir configuración de grupos
    const groupALabel = input.groupALabel || "Grupo A";
    const groupBLabel = input.groupBLabel || "Grupo B";
    const groupAColor = input.groupAColor || DatasetRules.DEFAULT_COLOR_GROUP_A;
    const groupBColor = input.groupBColor || DatasetRules.DEFAULT_COLOR_GROUP_B;

    // PASO 6: Crear entidad Dataset
    const datasetToCreate: Omit<Dataset, "id"> = {
      ownerId: input.ownerId,
      status: "processing", // Inicial hasta que se configure el mapping
      meta: {
        name: "", // Se completará en UpdateMapping
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      sourceConfig: {
        groupA: {
          label: groupALabel,
          color: groupAColor,
          originalFileName: input.fileA.originalName,
          rowCount: parsedA.rowCount,
        },
        groupB: {
          label: groupBLabel,
          color: groupBColor,
          originalFileName: input.fileB.originalName,
          rowCount: parsedB.rowCount,
        },
      },
      data: unifiedData,
    };

    // PASO 7: Persistir en repositorio
    const createdDataset = await this.repository.create(datasetToCreate);

    logger.info(
      {
        datasetId: createdDataset.id,
        totalRows: unifiedData.length,
      },
      "Dataset created successfully",
    );

    // PASO 8: Construir y retornar output
    return {
      datasetId: createdDataset.id,
      status: createdDataset.status,
      rowCount: unifiedData.length,
      groupA: {
        fileName: input.fileA.originalName,
        rowCount: parsedA.rowCount,
      },
      groupB: {
        fileName: input.fileB.originalName,
        rowCount: parsedB.rowCount,
      },
    };
  }
}
