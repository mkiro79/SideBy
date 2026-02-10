import type { Response, NextFunction } from "express";
import type { AuthRequest } from "@/middleware/auth.middleware.js";
import { CreateDatasetUseCase } from "@/modules/datasets/application/use-cases/CreateDatasetUseCase.js";
import { GetDatasetByIdUseCase } from "@/modules/datasets/application/use-cases/GetDatasetByIdUseCase.js";
import { UpdateMappingUseCase } from "@/modules/datasets/application/use-cases/UpdateMappingUseCase.js";
import { DeleteDatasetUseCase } from "@/modules/datasets/application/use-cases/DeleteDatasetUseCase.js";
import { ListDatasetsUseCase } from "@/modules/datasets/application/use-cases/ListDatasetsUseCase.js";
import { MongoDatasetRepository } from "@/modules/datasets/infrastructure/mongoose/MongoDatasetRepository.js";
import { UpdateMappingSchema } from "./validators/datasets.schemas.js";
import { DatasetNotFoundError } from "@/modules/datasets/domain/errors/DatasetNotFoundError.js";
import { UnauthorizedAccessError } from "@/modules/datasets/domain/errors/UnauthorizedAccessError.js";
import { MappingValidationError } from "@/modules/datasets/domain/errors/MappingValidationError.js";
import { DatasetValidationError } from "@/modules/datasets/domain/validation.rules.js";
import logger from "@/utils/logger.js";
import { ZodError } from "zod";

/**
 * Controller de Datasets.
 *
 * Maneja las peticiones HTTP y delega la lógica de negocio a los Use Cases.
 * Transforma las respuestas a formato JSON estándar de la API.
 *
 * Formato de respuesta:
 * ```json
 * {
 *   "success": true | false,
 *   "data": { ... },       // Si success es true
 *   "error": { ... }       // Si success es false
 * }
 * ```
 */
export class DatasetsController {
  private readonly repository = new MongoDatasetRepository();

  /**
   * POST /api/v1/datasets
   * Crea un nuevo dataset subiendo dos archivos CSV/Excel.
   */
  async createDataset(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validar que ambos archivos estén presentes
      if (!files?.fileA?.[0] || !files?.fileB?.[0]) {
        res.status(400).json({
          success: false,
          error: {
            message: "Debes subir ambos archivos (fileA y fileB)",
            code: "VALIDATION_ERROR",
          },
        });
        return;
      }

      const useCase = new CreateDatasetUseCase(this.repository);

      const result = await useCase.execute({
        ownerId: req.userId!,
        fileA: {
          buffer: files.fileA[0].buffer,
          originalName: files.fileA[0].originalname,
          mimetype: files.fileA[0].mimetype,
          size: files.fileA[0].size,
        },
        fileB: {
          buffer: files.fileB[0].buffer,
          originalName: files.fileB[0].originalname,
          mimetype: files.fileB[0].mimetype,
          size: files.fileB[0].size,
        },
        groupALabel: req.body.groupALabel,
        groupAColor: req.body.groupAColor,
        groupBLabel: req.body.groupBLabel,
        groupBColor: req.body.groupBColor,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/v1/datasets/:id
   * Obtiene un dataset específico con todos sus datos.
   */
  async getDatasetById(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const useCase = new GetDatasetByIdUseCase(this.repository);

      const dataset = await useCase.execute({
        datasetId: req.params.id as string,
        ownerId: req.userId!,
      });

      res.status(200).json({
        success: true,
        data: dataset,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/v1/datasets
   * Lista todos los datasets del usuario autenticado.
   */
  async listDatasets(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const useCase = new ListDatasetsUseCase(this.repository);

      const result = await useCase.execute({
        ownerId: req.userId!,
      });

      res.status(200).json({
        success: true,
        data: result.datasets,
        total: result.total,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * PATCH /api/v1/datasets/:id
   * Actualiza la configuración de mapping del dataset.
   */
  async updateMapping(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Validar request body con Zod
      const validatedData = UpdateMappingSchema.parse(req.body);

      const useCase = new UpdateMappingUseCase(this.repository);

      const result = await useCase.execute({
        datasetId: req.params.id as string,
        ownerId: req.userId!,
        ...validatedData,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/v1/datasets/:id
   * Elimina un dataset permanentemente.
   */
  async deleteDataset(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const useCase = new DeleteDatasetUseCase(this.repository);

      const result = await useCase.execute({
        datasetId: req.params.id as string,
        ownerId: req.userId!,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * Maneja errores de forma centralizada y los convierte a respuestas HTTP apropiadas.
   */
  private handleError(error: unknown, res: Response, next: NextFunction): void {
    // Errores de validación de Zod
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          message: "Error de validación",
          code: "VALIDATION_ERROR",
          details: error.issues, // ZodError usa 'issues', no 'errors'
        },
      });
      return;
    }

    // Dataset no encontrado
    if (error instanceof DatasetNotFoundError) {
      res.status(404).json({
        success: false,
        error: {
          message: error.message,
          code: "NOT_FOUND",
        },
      });
      return;
    }

    // Acceso no autorizado
    if (error instanceof UnauthorizedAccessError) {
      res.status(403).json({
        success: false,
        error: {
          message: error.message,
          code: "FORBIDDEN",
        },
      });
      return;
    }

    // Errores de validación de mapping
    if (error instanceof MappingValidationError) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      });
      return;
    }

    // Errores de validación de dataset (archivos, filas, etc)
    if (error instanceof DatasetValidationError) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
      return;
    }

    // Otros errores - delegar al error handler global
    logger.error({ err: error }, "Unhandled error in DatasetsController");
    next(error);
  }
}
