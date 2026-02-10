import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import type {
  UpdateMappingInput,
  UpdateMappingOutput,
} from "@/modules/datasets/application/dtos/dataset.dtos.js";
import { DatasetNotFoundError } from "@/modules/datasets/domain/errors/DatasetNotFoundError.js";
import { UnauthorizedAccessError } from "@/modules/datasets/domain/errors/UnauthorizedAccessError.js";
import { MappingValidationError } from "@/modules/datasets/domain/errors/MappingValidationError.js";
import { DatasetRules } from "@/modules/datasets/domain/validation.rules.js";
import logger from "@/utils/logger.js";

/**
 * Caso de Uso: Actualizar Mapping de Dataset.
 *
 * Responsabilidades:
 * 1. Verificar que el dataset existe
 * 2. Validar ownership (usuario propietario)
 * 3. Validar configuración de mapping (nombre, dimensiones, KPIs, dashboard)
 * 4. Validar configuración de IA (si aplica)
 * 5. Actualizar el dataset con la nueva configuración
 * 6. Cambiar status de "processing" a "ready"
 * 7. Actualizar timestamp de modificación
 *
 * Este Use Case completa la configuración del dataset haciéndolo
 * utilizable para análisis y visualizaciones.
 *
 * @example
 * ```typescript
 * const useCase = new UpdateMappingUseCase(repository);
 * const result = await useCase.execute({
 *   datasetId: "dataset_123",
 *   ownerId: "user_123",
 *   meta: { name: "Ventas 2024" },
 *   schemaMapping: { ... },
 *   dashboardLayout: { ... }
 * });
 * ```
 */
export class UpdateMappingUseCase {
  constructor(private readonly repository: DatasetRepository) {}

  async execute(input: UpdateMappingInput): Promise<UpdateMappingOutput> {
    logger.info(
      {
        datasetId: input.datasetId,
        ownerId: input.ownerId,
        datasetName: input.meta.name,
      },
      "UpdateMappingUseCase: Starting execution",
    );

    // PASO 1: Verificar que el dataset existe
    const dataset = await this.repository.findById(input.datasetId);
    if (!dataset) {
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

    // PASO 3: Validar metadata
    this.validateMetadata(input.meta.name, input.meta.description);

    // PASO 4: Validar schema mapping
    this.validateSchemaMapping(input.schemaMapping);

    // PASO 5: Validar dashboard layout
    this.validateDashboardLayout(input.dashboardLayout);

    // PASO 6: Validar AI config (si está presente)
    if (input.aiConfig) {
      this.validateAIConfig(input.aiConfig);
    }

    // PASO 7: Actualizar dataset
    const updatedDataset = await this.repository.update(input.datasetId, {
      status: "ready", // Cambiar de "processing" a "ready"
      meta: {
        ...dataset.meta,
        name: input.meta.name,
        description: input.meta.description,
        updatedAt: new Date(),
      },
      schemaMapping: input.schemaMapping,
      dashboardLayout: input.dashboardLayout,
      aiConfig: input.aiConfig,
    });

    logger.info(
      {
        datasetId: updatedDataset.id,
        status: updatedDataset.status,
      },
      "Dataset mapping updated successfully",
    );

    // PASO 8: Retornar resultado
    return {
      datasetId: updatedDataset.id,
      status: updatedDataset.status as "ready",
      updatedAt: updatedDataset.meta.updatedAt,
    };
  }

  /**
   * Valida la metadata del dataset (nombre y descripción).
   */
  private validateMetadata(name: string, description?: string): void {
    // Validar nombre
    if (!name || name.trim().length === 0) {
      throw new MappingValidationError(
        "INVALID_NAME",
        "El nombre del dataset es obligatorio",
      );
    }

    if (name.length < DatasetRules.MIN_NAME_LENGTH) {
      throw new MappingValidationError(
        "INVALID_NAME",
        `El nombre debe tener al menos ${DatasetRules.MIN_NAME_LENGTH} caracteres`,
      );
    }

    if (name.length > DatasetRules.MAX_NAME_LENGTH) {
      throw new MappingValidationError(
        "INVALID_NAME",
        `El nombre no puede exceder ${DatasetRules.MAX_NAME_LENGTH} caracteres`,
      );
    }

    // Validar descripción (opcional)
    if (
      description &&
      description.length > DatasetRules.MAX_DESCRIPTION_LENGTH
    ) {
      throw new MappingValidationError(
        "INVALID_DESCRIPTION",
        `La descripción no puede exceder ${DatasetRules.MAX_DESCRIPTION_LENGTH} caracteres`,
      );
    }
  }

  /**
   * Valida la configuración del schema mapping.
   */
  private validateSchemaMapping(
    schemaMapping: UpdateMappingInput["schemaMapping"],
  ): void {
    // Validar dimensionField
    if (
      !schemaMapping.dimensionField ||
      schemaMapping.dimensionField.trim().length === 0
    ) {
      throw new MappingValidationError(
        "MISSING_DIMENSION",
        "Debes seleccionar al menos una dimensión",
      );
    }

    // Validar KPI fields
    if (
      !schemaMapping.kpiFields ||
      schemaMapping.kpiFields.length < DatasetRules.MIN_KPIS
    ) {
      throw new MappingValidationError(
        "MISSING_KPI",
        `Debes seleccionar al menos ${DatasetRules.MIN_KPIS} KPI`,
      );
    }

    // Validar formato de cada KPI
    for (const kpi of schemaMapping.kpiFields) {
      if (!kpi.id || !kpi.columnName || !kpi.label) {
        throw new MappingValidationError(
          "INVALID_KPI_FORMAT",
          "Cada KPI debe tener id, columnName y label",
        );
      }

      if (!["number", "currency", "percentage"].includes(kpi.format)) {
        throw new MappingValidationError(
          "INVALID_KPI_FORMAT",
          `Formato de KPI inválido: ${kpi.format}`,
        );
      }
    }

    // Validar campos categóricos (opcional)
    if (
      schemaMapping.categoricalFields &&
      schemaMapping.categoricalFields.length >
        DatasetRules.MAX_CATEGORICAL_FIELDS
    ) {
      throw new MappingValidationError(
        "TOO_MANY_CATEGORICAL",
        `Máximo ${DatasetRules.MAX_CATEGORICAL_FIELDS} campos categóricos permitidos`,
      );
    }
  }

  /**
   * Valida la configuración del dashboard layout.
   */
  private validateDashboardLayout(
    dashboardLayout: UpdateMappingInput["dashboardLayout"],
  ): void {
    // Validar número de KPIs destacados
    if (
      dashboardLayout.highlightedKpis.length > DatasetRules.MAX_HIGHLIGHTED_KPIS
    ) {
      throw new MappingValidationError(
        "TOO_MANY_HIGHLIGHTED",
        `Máximo ${DatasetRules.MAX_HIGHLIGHTED_KPIS} KPIs destacados permitidos`,
      );
    }
  }

  /**
   * Valida la configuración de IA.
   */
  private validateAIConfig(
    aiConfig: NonNullable<UpdateMappingInput["aiConfig"]>,
  ): void {
    if (
      aiConfig.userContext &&
      aiConfig.userContext.length > DatasetRules.MAX_AI_CONTEXT_LENGTH
    ) {
      throw new MappingValidationError(
        "INVALID_AI_CONTEXT",
        `El contexto de IA no puede exceder ${DatasetRules.MAX_AI_CONTEXT_LENGTH} caracteres`,
      );
    }
  }
}
