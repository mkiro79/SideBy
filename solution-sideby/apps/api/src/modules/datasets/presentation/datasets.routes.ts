import { Router } from "express";
import multer from "multer";
import { DatasetsController } from "./datasets.controller.js";
import { authMiddleware } from "@/middleware/auth.middleware.js";
import {
  uploadRateLimiter,
  mappingRateLimiter,
  generalRateLimiter,
} from "@/middleware/rate-limit.middleware.js";

const router = Router();
const controller = new DatasetsController();

/**
 * Configuración de Multer para manejo de archivos.
 *
 * - Almacenamiento en memoria (buffer)
 * - Límite de 10MB por archivo
 * - Máximo 2 archivos (fileA y fileB)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 2,
  },
});

// ========================================
// MIDDLEWARE GLOBAL: AUTENTICACIÓN
// ========================================
// Todas las rutas de datasets requieren autenticación
router.use(authMiddleware);

// ========================================
// POST /api/v1/datasets
// Crear nuevo dataset (subir archivos)
// ========================================
router.post(
  "/",
  uploadRateLimiter, // Máximo 10 uploads/hora
  upload.fields([
    { name: "fileA", maxCount: 1 },
    { name: "fileB", maxCount: 1 },
  ]),
  controller.createDataset.bind(controller),
);

// ========================================
// GET /api/v1/datasets
// Listar todos los datasets del usuario
// ========================================
router.get(
  "/",
  generalRateLimiter, // Máximo 100 requests/min
  controller.listDatasets.bind(controller),
);

// ========================================
// GET /api/v1/datasets/:id
// Obtener dataset específico
// ========================================
router.get(
  "/:id",
  generalRateLimiter,
  controller.getDatasetById.bind(controller),
);

// ========================================
// PATCH /api/v1/datasets/:id
// Actualizar mapping/configuración
// ========================================
router.patch(
  "/:id",
  mappingRateLimiter, // Máximo 50 updates/hora
  controller.updateMapping.bind(controller),
);

// ========================================
// DELETE /api/v1/datasets/:id
// Eliminar dataset
// ========================================
router.delete(
  "/:id",
  generalRateLimiter,
  controller.deleteDataset.bind(controller),
);

export default router;
