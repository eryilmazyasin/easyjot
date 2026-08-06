import { Router } from "express";

import { UserController } from "../controllers/user.controller.js";
import { createAuthMiddleware } from "../middleware/auth.middleware.js";
import type { AuthService } from "../services/auth.service.js";
import type { UserService } from "../services/user.service.js";

export const createUserRouter = (userService: UserService, authService: AuthService): Router => {
  const router = Router();
  const controller = new UserController(userService);

  router.use(createAuthMiddleware(authService));
  router.put("/budget", controller.updateBudget);

  return router;
};
