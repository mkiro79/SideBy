import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import type {
  DeleteDatasetInput,
  DeleteDatasetOutput,
} from "@/modules/datasets/application/dtos/dataset.dtos.js";
import { DatasetNotFoundError } from "@/modules/datasets/domain/errors/DatasetNotFoundError.js";
import { UnauthorizedAccessError } from "@/modules/datasets/domain/errors/UnauthorizedAccessError.js";
import logger from "@/utils/logger.js";

/**
 * Caso de Uso: Eliminar Dataset.
 *
 * Responsabilidades:
 * 1. Verificar que el dataset existe
 * 2. Validar ownership (usuario propietario)
 * 3. Eliminar el dataset de la persistencia
 * 4. Retornar confirmación
 *
 * Este Use Case es irreversible. Una vez eliminado el dataset,
 * todos sus datos se pierden permanentemente.
 *
 * @example
 * ```typescript
 * const useCase = new DeleteDatasetUseCase(repository);
 * const result = await useCase.execute({
 *   datasetId: "dataset_123",
 *   ownerId: "user_123"
 * });
 * ```
 */
export class DeleteDatasetUseCase {
  constructor(private readonly repository: DatasetRepository) {}

  async execute(input: DeleteDatasetInput): Promise<DeleteDatasetOutput> {
    logger.info(
      {
        datasetId: input.datasetId,
        ownerId: input.ownerId,
      },
      "DeleteDatasetUseCase: Starting execution",
    );

    // PASO 1: Verificar que el dataset existe
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
        "Unauthorized delete attempt",
      );
      throw new UnauthorizedAccessError(input.ownerId, input.datasetId);
    }

    // PASO 3: Eliminar el dataset
    await this.repository.delete(input.datasetId);

    logger.info({ datasetId: input.datasetId }, "Dataset deleted successfully");

    // PASO 4: Retornar confirmación
    return {
      datasetId: input.datasetId,
      message: "Dataset eliminado correctamente",
    };
  }
}
