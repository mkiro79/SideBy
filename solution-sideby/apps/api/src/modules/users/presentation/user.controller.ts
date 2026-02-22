import type { Response, NextFunction } from "express";
import { z } from "zod";
import { UpdateProfileSchema } from "./user.dto.js";
import { GetUserProfileUseCase } from "@/modules/users/application/get-user-profile/GetUserProfileUseCase.js";
import { UpdateUserProfileUseCase } from "@/modules/users/application/update-user-profile/UpdateUserProfileUseCase.js";
import { DeleteUserAccountUseCase } from "@/modules/users/application/delete-user-account/DeleteUserAccountUseCase.js";
import { MongoUserRepository } from "@/modules/users/infrastructure/mongo-user.repository.js";
import { MongoDatasetRepository } from "@/modules/datasets/infrastructure/mongoose/MongoDatasetRepository.js";
import { UserNotFoundError } from "@/modules/users/domain/errors/UserNotFoundError.js";
import { DomainError } from "@/shared/domain/errors/domain.error.js";
import type { AuthRequest } from "@/middleware/auth.middleware.js";
import logger from "@/utils/logger.js";

/**
 * Controlador de perfil de usuario.
 * Solo orquesta la petición HTTP → Use Case → respuesta HTTP.
 * No contiene lógica de negocio.
 */
export class UserController {
  private readonly getUserProfileUseCase: GetUserProfileUseCase;
  private readonly updateUserProfileUseCase: UpdateUserProfileUseCase;
  private readonly deleteUserAccountUseCase: DeleteUserAccountUseCase;

  constructor() {
    const userRepository = new MongoUserRepository();
    const datasetRepository = new MongoDatasetRepository();

    this.getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
    this.updateUserProfileUseCase = new UpdateUserProfileUseCase(
      userRepository,
    );
    this.deleteUserAccountUseCase = new DeleteUserAccountUseCase(
      userRepository,
      datasetRepository,
    );
  }

  /**
   * GET /api/v1/users/me
   * Retorna el perfil del usuario autenticado.
   */
  async getProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: { message: "No autorizado", code: "AUTH_ERROR" },
        });
        return;
      }

      logger.debug({ userId: req.userId }, "Getting user profile");

      const profile = await this.getUserProfileUseCase.execute(req.userId);

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({
          success: false,
          error: { message: error.message, code: "NOT_FOUND" },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/me/profile
   * Actualiza el nombre del usuario autenticado.
   */
  async updateProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: { message: "No autorizado", code: "AUTH_ERROR" },
        });
        return;
      }

      const parsed = UpdateProfileSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: {
            message: "Datos de entrada inválidos",
            code: "VALIDATION_ERROR",
            details: parsed.error.flatten().fieldErrors,
          },
        });
        return;
      }

      logger.debug({ userId: req.userId }, "Updating user profile");

      const profile = await this.updateUserProfileUseCase.execute(
        req.userId,
        parsed.data,
      );

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({
          success: false,
          error: { message: error.message, code: "NOT_FOUND" },
        });
        return;
      }
      if (error instanceof DomainError) {
        res.status(400).json({
          success: false,
          error: { message: error.message, code: "VALIDATION_ERROR" },
        });
        return;
      }
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: "Datos de entrada inválidos",
            code: "VALIDATION_ERROR",
            details: error.flatten().fieldErrors,
          },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/me
   * Elimina la cuenta del usuario autenticado de forma permanente (hard delete con cascada).
   */
  async deleteAccount(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: { message: "No autorizado", code: "AUTH_ERROR" },
        });
        return;
      }

      logger.info({ userId: req.userId }, "Deleting user account permanently");

      await this.deleteUserAccountUseCase.execute(req.userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({
          success: false,
          error: { message: error.message, code: "NOT_FOUND" },
        });
        return;
      }
      next(error);
    }
  }
}
