/**
 * RUTAS DE AUTENTICACIÓN PARA DESARROLLO
 *
 * ⚠️ SOLO HABILITADO EN DEVELOPMENT ⚠️
 */

import { Router } from "express";
import { DevAuthController } from "./dev-auth.controller.js";

const router = Router();
const controller = new DevAuthController();

// Solo habilitar en desarrollo
if (process.env.NODE_ENV !== "production") {
  /**
   * POST /api/v1/auth/dev-login
   * Genera un token JWT para testing sin autenticación real
   */
  router.post("/dev-login", (req, res) => controller.devLogin(req, res));
}

export default router;
