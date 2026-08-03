import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { healthController } from "./controllers/health.controller.js";
import { parseController } from "./controllers/parse.controller.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { refreshTokenRepository } from "./repositories/refreshToken.repository.js";
import { userRepository } from "./repositories/user.repository.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import { AuthService } from "./services/auth.service.js";

const authService = new AuthService(userRepository, refreshTokenRepository, env.JWT_SECRET);

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", healthController);
app.get("/api/v1/health", healthController);
app.post("/api/v1/parse", parseController);
app.use("/api/v1/auth", createAuthRouter(authService));

app.use(notFoundHandler);
app.use(errorHandler);
