import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { LoginWithGoogleSchema } from "./auth.dto.js";
import { LoginWithGoogleUseCase } from "@/modules/auth/application/use-cases/login-with-google.use-case.js";
import { MongoUserRepository } from "@/modules/users/infrastructure/mongo-user.repository.js";
import { GoogleAuthService } from "@/modules/auth/infrastructure/google-auth.service.js";
import { JwtTokenService } from "@/modules/auth/infrastructure/jwt-token.service.js";
import logger from "@/utils/logger.js";

export class AuthController {
  private readonly loginWithGoogleUseCase: LoginWithGoogleUseCase;

  constructor() {
    const userRepository = new MongoUserRepository();
    const googleAuthService = new GoogleAuthService();
    const tokenService = new JwtTokenService();

    this.loginWithGoogleUseCase = new LoginWithGoogleUseCase(
      userRepository,
      googleAuthService,
      tokenService,
    );
  }

  async loginWithGoogle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Validar input con Zod
      const { token } = LoginWithGoogleSchema.parse(req.body);

      // Ejecutar caso de uso
      const result = await this.loginWithGoogleUseCase.execute(token);

      // Respuesta exitosa
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            avatar: result.user.avatar,
          },
          token: result.token,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.statusCode = 400;
        logger.error({ err: error }, "Validation error in Google login");
        const message =
          error.issues.length > 0
            ? error.issues[0]?.message
            : "Validation error";
        next(new Error(message));
      } else if (
        error instanceof Error &&
        error.message.includes("Invalid Google token")
      ) {
        res.statusCode = 401;
        logger.error({ err: error }, "Invalid Google token");
        next(new Error("Authentication failed: Invalid Google token"));
      } else {
        res.statusCode = 500;
        logger.error({ err: error }, "Unexpected error in Google login");
        next(error);
      }
    }
  }
}
