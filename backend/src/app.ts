import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { healthController } from "./controllers/health.controller.js";
import { parseController } from "./controllers/parse.controller.js";

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

app.use(notFoundHandler);
app.use(errorHandler);
