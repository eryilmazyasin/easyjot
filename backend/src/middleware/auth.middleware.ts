import type { RequestHandler } from "express";

import type { AuthService } from "../services/auth.service.js";

export const createAuthMiddleware = (authService: AuthService): RequestHandler => {
  return (request, response, next) => {
    const authorizationHeader = request.header("authorization");
    const [scheme, token, unexpectedPart] = authorizationHeader?.trim().split(/\s+/u) ?? [];

    if (scheme?.toLocaleLowerCase("en-US") !== "bearer" || !token || unexpectedPart) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      request.user = authService.verifyAccessToken(token);
      next();
    } catch {
      response.status(401).json({ error: "Unauthorized" });
    }
  };
};
