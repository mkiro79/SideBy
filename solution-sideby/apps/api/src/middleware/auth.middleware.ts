import { Request, Response, NextFunction } from "express";
import { JwtTokenService } from "@/modules/auth/infrastructure/jwt-token.service.js";
import logger from "@/utils/logger.js";

/**
 * Extiende la interfaz Request de Express para incluir información del usuario autenticado.
 * Este tipado permite acceder a userId y user en los controllers que usen este middleware.
 */
export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Middleware de autenticación JWT para proteger rutas de la API.
 *
 * Extrae el token del header Authorization, lo valida y adjunta la información
 * del usuario al objeto request para su uso en los controllers.
 *
 * @throws 401 - Si no se proporciona token o es inválido/expirado
 *
 * @example
 * ```typescript
 * router.get('/protected', authMiddleware, controller.method);
 * ```
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: {
          message: "No se proporcionó token de autenticación",
          code: "AUTH_ERROR",
        },
      });
      return;
    }

    const token = authHeader.substring(7);
    const tokenService = new JwtTokenService();

    const decoded = tokenService.verify(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: {
          message: "Token inválido o expirado",
          code: "AUTH_ERROR",
        },
      });
      return;
    }

    // Extraer información del usuario del token JWT
    // El formato del payload puede variar según cómo se generó el token
    const payload = decoded as Record<string, unknown>;
    const userId = (payload.userId as string) || (payload.sub as string);
    const email = payload.email as string;
    const name = payload.name as string;

    if (!userId) {
      logger.error({ decoded }, "JWT payload missing userId/sub");
      res.status(401).json({
        success: false,
        error: {
          message: "Token JWT inválido: falta identificador de usuario",
          code: "AUTH_ERROR",
        },
      });
      return;
    }

    // Adjuntar información del usuario al request
    req.userId = userId;
    req.user = {
      id: userId,
      email: email || "",
      name: name || "",
    };

    next();
  } catch (error) {
    logger.error({ err: error }, "Auth middleware error");
    res.status(401).json({
      success: false,
      error: {
        message: "Error de autenticación",
        code: "AUTH_ERROR",
      },
    });
  }
}
