import type { Dataset } from "./Dataset.entity.js";

/**
 * Interfaz del repositorio de Datasets (Port).
 *
 * Define el contrato que debe cumplir cualquier implementación concreta
 * del repositorio, siguiendo el principio de Inversión de Dependencias (SOLID).
 *
 * La capa de Application depende de esta abstracción, no de implementaciones
 * concretas (como MongoDatasetRepository).
 *
 * @example
 * ```typescript
 * class CreateDatasetUseCase {
 *   constructor(private repository: DatasetRepository) {}
 *
 *   async execute(input: CreateDatasetInput): Promise<Dataset> {
 *     const dataset = // ... crear entidad
 *     return await this.repository.create(dataset);
 *   }
 * }
 * ```
 */
export interface DatasetRepository {
  /**
   * Crea un nuevo dataset en la persistencia.
   *
   * @param dataset - Dataset sin ID (será asignado por la implementación)
   * @returns Dataset creado con ID asignado
   * @throws Error si falla la creación
   */
  create(dataset: Omit<Dataset, "id">): Promise<Dataset>;

  /**
   * Busca un dataset por su ID.
   *
   * @param id - ID del dataset a buscar
   * @returns Dataset encontrado o null si no existe
   */
  findById(id: string): Promise<Dataset | null>;

  /**
   * Busca todos los datasets de un usuario específico.
   *
   * @param ownerId - ID del usuario propietario
   * @returns Array de datasets (vacío si no hay resultados)
   */
  findByOwnerId(ownerId: string): Promise<Dataset[]>;

  /**
   * Actualiza parcialmente un dataset existente.
   *
   * @param id - ID del dataset a actualizar
   * @param updates - Campos a actualizar (parcial)
   * @returns Dataset actualizado
   * @throws Error si el dataset no existe
   */
  update(id: string, updates: Partial<Dataset>): Promise<Dataset>;

  /**
   * Elimina un dataset de la persistencia.
   *
   * @param id - ID del dataset a eliminar
   * @returns void
   * @throws Error si el dataset no existe
   */
  delete(id: string): Promise<void>;

  /**
   * Busca datasets abandonados (en estado processing por mucho tiempo).
   *
   * Usado por el job de limpieza para eliminar datasets que quedaron
   * a medias (usuario subió archivos pero nunca completó el mapping).
   *
   * @param cutoffDate - Fecha límite (datasets más antiguos se consideran abandonados)
   * @returns Array de datasets abandonados
   */
  findAbandoned(cutoffDate: Date): Promise<Dataset[]>;

  /**
   * Elimina todos los datasets pertenecientes a un usuario (cascade delete).
   *
   * @param ownerId - ID del usuario propietario
   */
  deleteByOwnerId(ownerId: string): Promise<void>;
}
