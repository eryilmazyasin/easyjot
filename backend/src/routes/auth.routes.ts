import { Router } from "express";

import { AuthController } from "../controllers/auth.controller.js";
import { createAuthMiddleware } from "../middleware/auth.middleware.js";
import type { AuthService } from "../services/auth.service.js";

export const createAuthRouter = (authService: AuthService): Router => {
  const router = Router();
  const controller = new AuthController(authService);

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/refresh", controller.refresh);
  router.post("/logout", controller.logout);
  router.get("/me", createAuthMiddleware(authService), controller.me);

  return router;
};
