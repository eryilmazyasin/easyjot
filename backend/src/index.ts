import { app } from "./app.js";
import { env } from "./config/env.js";
import { closeDatabase, verifyDatabaseConnection } from "./db/index.js";
import { closeRedis, verifyRedisConnection } from "./db/redis.js";

const startServer = async (): Promise<void> => {
  await Promise.all([verifyDatabaseConnection(), verifyRedisConnection()]);

  const server = app.listen(env.PORT, () => {
    console.info(`EasyJot API is listening on port ${env.PORT}`);
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    console.info(`${signal} received. Shutting down EasyJot API.`);

    server.close(async () => {
      await Promise.all([closeDatabase(), closeRedis()]);
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startServer().catch((error: unknown) => {
  console.error("EasyJot API failed to start.", error);
  process.exit(1);
});
