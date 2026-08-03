import type { RequestHandler } from "express";

import { getHealthStatus } from "../services/health.service.js";

export const healthController: RequestHandler = async (_request, response, next) => {
  try {
    const healthStatus = await getHealthStatus();
    response.status(healthStatus.status === "ok" ? 200 : 503).json(healthStatus);
  } catch (error: unknown) {
    next(error);
  }
};
