import { Router } from "express";
import { UserController } from "./user.controller.js";
import { authMiddleware } from "@/middleware/auth.middleware.js";

const router = Router();
const userController = new UserController();

// Todas las rutas de usuario requieren autenticación JWT
router.use(authMiddleware);

// GET /api/v1/users/me — Obtener perfil del usuario autenticado
router.get("/me", userController.getProfile.bind(userController));

// PUT /api/v1/users/me/profile — Actualizar nombre del perfil
router.put("/me/profile", userController.updateProfile.bind(userController));

// DELETE /api/v1/users/me — Eliminar cuenta permanentemente
router.delete("/me", userController.deleteAccount.bind(userController));

export default router;
