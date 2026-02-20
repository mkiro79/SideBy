import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware.js";
import { insightsRateLimiter } from "@/middleware/rate-limit.middleware.js";
import { InsightsController } from "@/modules/insights/presentation/insights.controller.js";

const router = Router();
const controller = new InsightsController();

router.use(authMiddleware);

router.get(
  "/:id/insights",
  insightsRateLimiter,
  controller.getDatasetInsights.bind(controller),
);

export default router;
