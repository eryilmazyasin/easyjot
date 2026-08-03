import type { RequestHandler } from "express";
import { z } from "zod";

import {
  AuthService,
  AuthUserNotFoundError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "../services/auth.service.js";

const passwordSchema = z
  .string()
  .min(8)
  .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
    message: "Password must not exceed 72 UTF-8 bytes.",
  });

const credentialsSchema = z.object({
  email: z.string().trim().email().max(320),
  password: passwordSchema,
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(32).max(512),
});

export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  public register: RequestHandler = async (request, response, next) => {
    const credentials = credentialsSchema.safeParse(request.body);

    if (!credentials.success) {
      response.status(400).json({
        error: "A valid email and a password of at least 8 characters are required.",
      });
      return;
    }

    try {
      const result = await this.authService.register(
        credentials.data.email,
        credentials.data.password,
      );
      response.status(201).json(result);
    } catch (error: unknown) {
      if (error instanceof EmailAlreadyRegisteredError) {
        response.status(409).json({ error: error.message });
        return;
      }

      next(error);
    }
  };

  public login: RequestHandler = async (request, response, next) => {
    const credentials = credentialsSchema.safeParse(request.body);

    if (!credentials.success) {
      response.status(400).json({ error: "A valid email and password are required." });
      return;
    }

    try {
      const result = await this.authService.login(
        credentials.data.email,
        credentials.data.password,
      );
      response.status(200).json(result);
    } catch (error: unknown) {
      if (error instanceof InvalidCredentialsError) {
        response.status(401).json({ error: error.message });
        return;
      }

      next(error);
    }
  };

  public refresh: RequestHandler = async (request, response, next) => {
    const parsedBody = refreshTokenSchema.safeParse(request.body);

    if (!parsedBody.success) {
      response.status(400).json({ error: "A valid refreshToken is required." });
      return;
    }

    try {
      const result = await this.authService.refresh(parsedBody.data.refreshToken);
      response.status(200).json(result);
    } catch (error: unknown) {
      if (error instanceof InvalidRefreshTokenError) {
        response.status(401).json({ error: error.message });
        return;
      }

      next(error);
    }
  };

  public logout: RequestHandler = async (request, response, next) => {
    const parsedBody = refreshTokenSchema.safeParse(request.body);

    if (!parsedBody.success) {
      response.status(400).json({ error: "A valid refreshToken is required." });
      return;
    }

    try {
      await this.authService.logout(parsedBody.data.refreshToken);
      response.status(204).send();
    } catch (error: unknown) {
      next(error);
    }
  };

  public me: RequestHandler = async (request, response, next) => {
    if (!request.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const user = await this.authService.getProfile(request.user.id);
      response.status(200).json({ user });
    } catch (error: unknown) {
      if (error instanceof AuthUserNotFoundError) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      next(error);
    }
  };
}
