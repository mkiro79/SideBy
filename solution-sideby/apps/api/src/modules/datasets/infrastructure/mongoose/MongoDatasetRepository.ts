import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import type { Dataset } from "@/modules/datasets/domain/Dataset.entity.js";
import { DatasetModel, type DatasetDocument } from "./DatasetSchema.js";
import logger from "@/utils/logger.js";

/**
 * Implementación del repositorio de Datasets usando MongoDB (Mongoose).
 *
 * Esta es la capa de persistencia que implementa la interfaz
 * DatasetRepository definida en el dominio.
 *
 * Responsabilidades:
 * - Mapear entre entidad de dominio (Dataset) y documento de MongoDB
 * - Ejecutar queries de MongoDB
 * - Manejar errores de persistencia
 *
 * @example
 * ```typescript
 * const repository = new MongoDatasetRepository();
 * const dataset = await repository.create({ ... });
 * ```
 */
export class MongoDatasetRepository implements DatasetRepository {
  /**
   * Crea un nuevo dataset en MongoDB.
   */
  async create(dataset: Omit<Dataset, "id">): Promise<Dataset> {
    try {
      logger.debug(
        { ownerId: dataset.ownerId },
        "Creating new dataset in MongoDB",
      );

      const doc = new DatasetModel(dataset);
      await doc.save();

      logger.info(
        { datasetId: doc._id.toString() },
        "Dataset created successfully",
      );

      return this.mapToEntity(doc);
    } catch (error) {
      logger.error({ err: error }, "Failed to create dataset");
      throw new Error("Error al crear el dataset en la base de datos");
    }
  }

  /**
   * Busca un dataset por su ID.
   */
  async findById(id: string): Promise<Dataset | null> {
    try {
      logger.debug({ datasetId: id }, "Finding dataset by ID");

      const doc = await DatasetModel.findById(id);

      if (!doc) {
        logger.debug({ datasetId: id }, "Dataset not found");
        return null;
      }

      return this.mapToEntity(doc);
    } catch (error) {
      logger.error(
        { err: error, datasetId: id },
        "Failed to find dataset by ID",
      );
      throw new Error("Error al buscar el dataset");
    }
  }

  /**
   * Busca todos los datasets de un usuario.
   * Excluye el campo 'data' por defecto para optimizar performance.
   */
  async findByOwnerId(ownerId: string): Promise<Dataset[]> {
    try {
      logger.debug({ ownerId }, "Finding datasets by owner");

      const docs = await DatasetModel.find({ ownerId })
        .sort({ "meta.createdAt": -1 }) // Más recientes primero
        .select("-data") // Excluir data pesada
        .lean(); // Retornar objetos planos (más rápido)

      logger.info(
        { ownerId, count: docs.length },
        "Datasets retrieved successfully",
      );

      return docs.map((doc) =>
        this.mapToEntity(doc as unknown as DatasetDocument),
      );
    } catch (error) {
      logger.error({ err: error, ownerId }, "Failed to find datasets by owner");
      throw new Error("Error al buscar datasets del usuario");
    }
  }

  /**
   * Actualiza parcialmente un dataset existente.
   */
  async update(id: string, updates: Partial<Dataset>): Promise<Dataset> {
    try {
      logger.debug({ datasetId: id }, "Updating dataset");

      // Construir el payload evitando conflictos con campos nested
      const updatePayload: Record<string, any> = { ...updates };

      // Excluir explícitamente createdAt para evitar modificaciones
      delete updatePayload.createdAt;

      // Si viene meta como objeto, convertirlo a dot notation para evitar conflictos
      if (updatePayload.meta) {
        const meta = updatePayload.meta;
        delete updatePayload.meta;

        // Setear solo los campos de meta que vengan definidos
        if (meta.name !== undefined) {
          updatePayload["meta.name"] = meta.name;
        }
        if (meta.description !== undefined) {
          updatePayload["meta.description"] = meta.description;
        }
      }

      // Siempre actualizar updatedAt
      updatePayload["meta.updatedAt"] = new Date();

      const doc = await DatasetModel.findByIdAndUpdate(
        id,
        { $set: updatePayload },
        {
          new: true, // Retornar el documento actualizado
          runValidators: true, // Ejecutar validadores del schema
        },
      );

      if (!doc) {
        logger.warn({ datasetId: id }, "Dataset not found for update");
        throw new Error(`Dataset con ID '${id}' no encontrado`);
      }

      logger.info({ datasetId: id }, "Dataset updated successfully");

      return this.mapToEntity(doc);
    } catch (error) {
      logger.error({ err: error, datasetId: id }, "Failed to update dataset");
      throw new Error("Error al actualizar el dataset");
    }
  }

  /**
   * Elimina un dataset de MongoDB.
   */
  async delete(id: string): Promise<void> {
    try {
      logger.debug({ datasetId: id }, "Deleting dataset");

      const result = await DatasetModel.findByIdAndDelete(id);

      if (!result) {
        logger.warn({ datasetId: id }, "Dataset not found for deletion");
        throw new Error(`Dataset con ID '${id}' no encontrado`);
      }

      logger.info({ datasetId: id }, "Dataset deleted successfully");
    } catch (error) {
      logger.error({ err: error, datasetId: id }, "Failed to delete dataset");
      throw new Error("Error al eliminar el dataset");
    }
  }

  /**
   * Busca datasets abandonados (en processing por mucho tiempo).
   * Usado por el job de limpieza.
   */
  async findAbandoned(cutoffDate: Date): Promise<Dataset[]> {
    try {
      logger.debug(
        { cutoffDate: cutoffDate.toISOString() },
        "Finding abandoned datasets",
      );

      const docs = await DatasetModel.find({
        status: "processing",
        "meta.createdAt": { $lt: cutoffDate },
      })
        .select("-data") // No necesitamos la data completa
        .lean();

      logger.info(
        { count: docs.length, cutoffDate: cutoffDate.toISOString() },
        "Abandoned datasets found",
      );

      return docs.map((doc) =>
        this.mapToEntity(doc as unknown as DatasetDocument),
      );
    } catch (error) {
      logger.error({ err: error }, "Failed to find abandoned datasets");
      throw new Error("Error al buscar datasets abandonados");
    }
  }

  /**
   * Mapea un documento de MongoDB a una entidad de dominio.
   *
   * @param doc - Documento de Mongoose
   * @returns Entidad Dataset del dominio
   */
  private mapToEntity(doc: DatasetDocument): Dataset {
    return {
      id: doc._id.toString(),
      ownerId: doc.ownerId,
      status: doc.status,
      meta: {
        name: doc.meta?.name || "",
        description: doc.meta?.description,
        createdAt: doc.meta?.createdAt || new Date(),
        updatedAt: doc.meta?.updatedAt || new Date(),
      },
      sourceConfig: doc.sourceConfig,
      schemaMapping: doc.schemaMapping,
      dashboardLayout: doc.dashboardLayout,
      aiConfig: doc.aiConfig,
      data: doc.data || [],
    };
  }
}
