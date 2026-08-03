import { Router } from "express";

import { ExpenseController } from "../controllers/expense.controller.js";
import { createAuthMiddleware } from "../middleware/auth.middleware.js";
import type { AuthService } from "../services/auth.service.js";
import type { ExpenseService } from "../services/expense.service.js";

export const createExpenseRouter = (
  expenseService: ExpenseService,
  authService: AuthService,
): Router => {
  const router = Router();
  const controller = new ExpenseController(expenseService);

  router.use(createAuthMiddleware(authService));
  router.post("/quick-add", controller.quickAdd);
  router.get("/", controller.list);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.delete);

  return router;
};
