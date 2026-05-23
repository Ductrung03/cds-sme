import app from "./app";
import { env } from "./config/env";
import { getPool, closePool } from "./db/pool";
import { logger } from "./utils/logger";

const start = async (): Promise<void> => {
  // Kết nối database
  try {
    await getPool();
    logger.info("Kết nối database OK");
  } catch (err) {
    logger.error({ err }, "Không thể kết nối database. Server vẫn khởi động nhưng endpoints DB sẽ lỗi.");
  }

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server khởi động thành công");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Nhận tín hiệu dừng, đang shutdown...");
    server.close(async () => {
      await closePool();
      logger.info("Server đã dừng");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((err) => {
  logger.error({ err }, "Lỗi khởi động server");
  process.exit(1);
});
