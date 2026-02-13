import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import type {
  ListDatasetsInput,
  ListDatasetsOutput,
} from "@/modules/datasets/application/dtos/dataset.dtos.js";
import logger from "@/utils/logger.js";

/**
 * Caso de Uso: Listar Datasets de un Usuario.
 *
 * Responsabilidades:
 * 1. Obtener todos los datasets del usuario
 * 2. Ordenar por fecha de creación (más recientes primero)
 * 3. Transformar a formato de lista (sin incluir data completa)
 * 4. Retornar lista con metadata
 *
 * Este Use Case se usa en la vista de lista/dashboard principal
 * donde el usuario ve todos sus datasets.
 *
 * @example
 * ```typescript
 * const useCase = new ListDatasetsUseCase(repository);
 * const result = await useCase.execute({
 *   ownerId: "user_123"
 * });
 * ```
 */
export class ListDatasetsUseCase {
  constructor(private readonly repository: DatasetRepository) {}

  async execute(input: ListDatasetsInput): Promise<ListDatasetsOutput> {
    logger.info(
      { ownerId: input.ownerId },
      "ListDatasetsUseCase: Starting execution",
    );

    // PASO 1: Obtener todos los datasets del usuario
    const datasets = await this.repository.findByOwnerId(input.ownerId);

    logger.info(
      {
        ownerId: input.ownerId,
        count: datasets.length,
      },
      "Datasets retrieved successfully",
    );

    // PASO 2: Ordenar por fecha de creación descendente (más recientes primero)
    // Crear una copia para no mutar el array original
    const sortedDatasets = [...datasets].sort(
      (a, b) => b.meta.createdAt.getTime() - a.meta.createdAt.getTime(),
    );

    // PASO 3: Transformar a formato de lista (sin data pesada)
    const datasetList = sortedDatasets.map((dataset) => ({
      id: dataset.id,
      status: dataset.status,
      meta: {
        name: dataset.meta.name,
        description: dataset.meta.description,
        createdAt: dataset.meta.createdAt,
        updatedAt: dataset.meta.updatedAt,
      },
      sourceConfig: dataset.sourceConfig,
      totalRows: dataset.data.length,
    }));

    // PASO 4: Retornar resultado
    return {
      datasets: datasetList,
      total: datasetList.length,
    };
  }
}
