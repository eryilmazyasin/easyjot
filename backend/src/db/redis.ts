import { createClient } from "redis";

import { env } from "../config/env.js";

export const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3_000),
  },
});

redisClient.on("error", (error: Error) => {
  console.error("Redis client error.", error);
});

export const verifyRedisConnection = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  await redisClient.ping();
};

export const isRedisReady = async (): Promise<boolean> => {
  try {
    await verifyRedisConnection();
    return true;
  } catch {
    return false;
  }
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
};
