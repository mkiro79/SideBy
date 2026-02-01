import { Router } from "express";
import { AuthController } from "./auth.controller.js";

const router = Router();
const authController = new AuthController();

// POST /api/v1/auth/google - Login with Google OAuth
router.post("/google", authController.loginWithGoogle.bind(authController));

export default router;
