import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import type {
  GetDatasetByIdInput,
  GetDatasetByIdOutput,
} from "@/modules/datasets/application/dtos/dataset.dtos.js";
import { DatasetNotFoundError } from "@/modules/datasets/domain/errors/DatasetNotFoundError.js";
import { UnauthorizedAccessError } from "@/modules/datasets/domain/errors/UnauthorizedAccessError.js";
import logger from "@/utils/logger.js";

/**
 * Caso de Uso: Obtener Dataset por ID.
 *
 * Responsabilidades:
 * 1. Verificar que el dataset existe
 * 2. Validar ownership (usuario propietario)
 * 3. Retornar el dataset completo con todos sus datos
 *
 * Este Use Case se usa cuando el usuario quiere ver o editar
 * un dataset específico.
 *
 * @example
 * ```typescript
 * const useCase = new GetDatasetByIdUseCase(repository);
 * const dataset = await useCase.execute({
 *   datasetId: "dataset_123",
 *   ownerId: "user_123"
 * });
 * ```
 */
export class GetDatasetByIdUseCase {
  constructor(private readonly repository: DatasetRepository) {}

  async execute(input: GetDatasetByIdInput): Promise<GetDatasetByIdOutput> {
    logger.info(
      {
        datasetId: input.datasetId,
        ownerId: input.ownerId,
      },
      "GetDatasetByIdUseCase: Starting execution",
    );

    // PASO 1: Buscar el dataset
    const dataset = await this.repository.findById(input.datasetId);

    if (!dataset) {
      logger.warn({ datasetId: input.datasetId }, "Dataset not found");
      throw new DatasetNotFoundError(input.datasetId);
    }

    // PASO 2: Validar ownership
    if (dataset.ownerId !== input.ownerId) {
      logger.warn(
        {
          datasetId: input.datasetId,
          datasetOwner: dataset.ownerId,
          requestOwner: input.ownerId,
        },
        "Unauthorized access attempt",
      );
      throw new UnauthorizedAccessError(input.ownerId, input.datasetId);
    }

    logger.info(
      {
        datasetId: dataset.id,
        status: dataset.status,
        rowCount: dataset.data.length,
      },
      "Dataset retrieved successfully",
    );

    // PASO 3: Retornar el dataset completo
    return dataset;
  }
}
