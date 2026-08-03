import { isDatabaseReady } from "../db/index.js";
import { isRedisReady } from "../db/redis.js";
import type { HealthStatus } from "./health.service.types.js";

export const getHealthStatus = async (): Promise<HealthStatus> => {
  const [database, redis] = await Promise.all([isDatabaseReady(), isRedisReady()]);

  return {
    service: "easyjot-api",
    status: database && redis ? "ok" : "degraded",
    dependencies: {
      database: database ? "up" : "down",
      redis: redis ? "up" : "down",
    },
  };
};
