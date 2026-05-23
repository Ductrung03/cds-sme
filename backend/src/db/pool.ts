import sql, { type ConnectionPool, type config as MssqlConfig } from "mssql";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let pool: ConnectionPool | null = null;
let connecting: Promise<ConnectionPool> | null = null;

const buildConfig = (database?: string): MssqlConfig => ({
  server: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: database ?? env.DB_NAME,
  pool: { max: 20, min: 0, idleTimeoutMillis: 30000 },
  options: {
    encrypt: env.DB_ENCRYPT,
    trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
    enableArithAbort: true,
    appName: "cds-sme-backend"
  }
});

export const getPool = async (): Promise<ConnectionPool> => {
  if (pool && pool.connected) return pool;
  if (connecting) return connecting;

  connecting = (async () => {
    const p = new sql.ConnectionPool(buildConfig());
    p.on("error", (err) => logger.error({ err }, "Lỗi kết nối SQL Server pool"));
    await p.connect();
    pool = p;
    connecting = null;
    logger.info(
      { host: env.DB_HOST, port: env.DB_PORT, database: env.DB_NAME },
      "Kết nối SQL Server thành công"
    );
    return p;
  })();

  return connecting;
};

export const getMasterPool = async (): Promise<ConnectionPool> => {
  const p = new sql.ConnectionPool(buildConfig("master"));
  await p.connect();
  return p;
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.close();
    pool = null;
  }
};

export { sql };
