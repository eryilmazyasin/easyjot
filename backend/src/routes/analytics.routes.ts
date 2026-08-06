import { Router } from "express";

import { AnalyticsController } from "../controllers/analytics.controller.js";
import { createAuthMiddleware } from "../middleware/auth.middleware.js";
import type { AnalyticsService } from "../services/analytics.service.js";
import type { AuthService } from "../services/auth.service.js";

export const createAnalyticsRouter = (
  analyticsService: AnalyticsService,
  authService: AuthService,
): Router => {
  const router = Router();
  const controller = new AnalyticsController(analyticsService);

  router.use(createAuthMiddleware(authService));
  router.get("/summary", controller.summary);

  return router;
};
