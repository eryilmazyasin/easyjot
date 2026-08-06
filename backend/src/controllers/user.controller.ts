import type { RequestHandler } from "express";
import { z } from "zod";

import { UserNotFoundError, UserService } from "../services/user.service.js";
import type { UpdateBudgetSettingsInput } from "../services/user.service.types.js";

const updateBudgetSettingsSchema = z
  .object({
    baseCurrency: z.enum(["TRY", "USD", "EUR", "GBP"]).optional(),
    monthlyBudget: z.number().positive().max(999_999_999_999.99).nullable().optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one budget setting is required.",
  });

export class UserController {
  public constructor(private readonly userService: UserService) {}

  public updateBudget: RequestHandler = async (request, response, next) => {
    const parsedBody = updateBudgetSettingsSchema.safeParse(request.body);

    if (!request.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!parsedBody.success) {
      response.status(400).json({ error: "Budget settings are invalid." });
      return;
    }

    const input: UpdateBudgetSettingsInput = {};

    if (parsedBody.data.baseCurrency !== undefined) {
      input.baseCurrency = parsedBody.data.baseCurrency;
    }

    if (parsedBody.data.monthlyBudget !== undefined) {
      input.monthlyBudget = parsedBody.data.monthlyBudget;
    }

    try {
      const budget = await this.userService.updateBudgetSettings(request.user.id, input);
      response.status(200).json({ budget });
    } catch (error: unknown) {
      if (error instanceof UserNotFoundError) {
        response.status(404).json({ error: error.message });
        return;
      }

      next(error);
    }
  };
}
