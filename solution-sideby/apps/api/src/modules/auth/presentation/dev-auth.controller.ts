/**
 * CONTROLADOR DE AUTENTICACIÓN PARA DESARROLLO
 *
 * ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN ⚠️
 *
 * Este endpoint permite generar tokens JWT sin autenticación de Google,
 * facilitando el testing de endpoints protegidos durante el desarrollo.
 */

import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { UserModel } from "@/modules/users/infrastructure/user.schema.js";
import { JwtTokenService } from "@/modules/auth/infrastructure/jwt-token.service.js";
import logger from "@/utils/logger.js";

interface DevLoginRequest {
  email: string;
  name?: string;
  role?: "user" | "admin";
}

export class DevAuthController {
  /**
   * POST /api/v1/auth/dev-login
   *
   * Genera un token JWT para testing sin necesidad de autenticación real.
   * Crea el usuario si no existe.
   */
  async devLogin(req: Request, res: Response): Promise<Response> {
    // Verificar que estamos en desarrollo
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: {
          message: "Dev login endpoint is disabled in production",
          code: "DEV_ENDPOINT_DISABLED",
        },
      });
    }

    try {
      const { email, name, role } = req.body as DevLoginRequest;

      // Validación básica
      if (!email) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Email is required",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // Buscar o crear usuario
      let user = await UserModel.findOne({ email });

      if (!user) {
        // Crear nuevo usuario de prueba
        user = new UserModel({
          _id: randomUUID(),
          email,
          name: name || email.split("@")[0],
          role: role || "user",
          googleId: `dev_${randomUUID()}`, // Google ID falso para desarrollo
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await user.save();
        logger.info({ email }, "Dev user created");
      }

      // Generar token JWT
      const tokenService = new JwtTokenService();
      const token = tokenService.sign({
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Dev login failed");
      return res.status(500).json({
        success: false,
        error: {
          message: "Internal server error",
          code: "INTERNAL_ERROR",
        },
      });
    }
  }
}
