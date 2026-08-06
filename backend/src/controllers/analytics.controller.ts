import type { RequestHandler } from "express";

import {
  AnalyticsService,
  AnalyticsUserNotFoundError,
} from "../services/analytics.service.js";
import { CurrencyRateUnavailableError } from "../services/currency.errors.js";

export class AnalyticsController {
  public constructor(private readonly analyticsService: AnalyticsService) {}

  public summary: RequestHandler = async (request, response, next) => {
    if (!request.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const summary = await this.analyticsService.getMonthlySummary(request.user.id);
      response.status(200).json(summary);
    } catch (error: unknown) {
      if (error instanceof AnalyticsUserNotFoundError) {
        response.status(404).json({ error: error.message });
        return;
      }

      if (error instanceof CurrencyRateUnavailableError) {
        response.status(502).json({ error: error.message });
        return;
      }

      next(error);
    }
  };
}
