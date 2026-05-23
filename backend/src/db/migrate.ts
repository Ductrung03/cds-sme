import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env";
import { closePool, getMasterPool, getPool, sql } from "./pool";
import { logger } from "../utils/logger";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

const splitBatches = (script: string): string[] =>
  script
    .split(/^\s*GO\s*$/gim)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const ensureDatabase = async (): Promise<void> => {
  const master = await getMasterPool();
  try {
    const result = await master
      .request()
      .input("name", sql.NVarChar(128), env.DB_NAME)
      .query("SELECT database_id FROM sys.databases WHERE name = @name");
    if (result.recordset.length === 0) {
      logger.info({ db: env.DB_NAME }, "Tạo database mới");
      await master.request().query(`CREATE DATABASE [${env.DB_NAME}]`);
    }
  } finally {
    await master.close();
  }
};

const ensureMigrationTable = async (): Promise<void> => {
  const pool = await getPool();
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.__Migrations', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.__Migrations (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Filename NVARCHAR(255) NOT NULL UNIQUE,
        AppliedAt DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END;
  `);
};

const getAppliedMigrations = async (): Promise<Set<string>> => {
  const pool = await getPool();
  const res = await pool.request().query<{ Filename: string }>(
    "SELECT Filename FROM dbo.__Migrations ORDER BY Id"
  );
  return new Set(res.recordset.map((r) => r.Filename));
};

const applyMigration = async (filename: string, fullPath: string): Promise<void> => {
  const sqlText = fs.readFileSync(fullPath, "utf-8");
  const batches = splitBatches(sqlText);
  const pool = await getPool();
  const tx = pool.transaction();
  await tx.begin();
  try {
    for (const batch of batches) {
      await tx.request().batch(batch);
    }
    await tx
      .request()
      .input("filename", sql.NVarChar(255), filename)
      .query("INSERT INTO dbo.__Migrations (Filename) VALUES (@filename)");
    await tx.commit();
    logger.info({ filename }, "Đã áp dụng migration");
  } catch (err) {
    await tx.rollback();
    throw err;
  }
};

const resetDatabase = async (): Promise<void> => {
  const master = await getMasterPool();
  try {
    logger.warn({ db: env.DB_NAME }, "Reset database: xóa và tạo lại");
    await master.request().query(`
      IF DB_ID(N'${env.DB_NAME}') IS NOT NULL
      BEGIN
        ALTER DATABASE [${env.DB_NAME}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE [${env.DB_NAME}];
      END;
    `);
    await master.request().query(`CREATE DATABASE [${env.DB_NAME}]`);
  } finally {
    await master.close();
  }
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  if (args.includes("--reset")) {
    await resetDatabase();
  } else {
    await ensureDatabase();
  }

  await ensureMigrationTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      logger.info({ file }, "Bỏ qua migration đã áp dụng");
      continue;
    }
    await applyMigration(file, path.join(MIGRATIONS_DIR, file));
  }

  logger.info("Hoàn tất chạy migrations");
};

main()
  .then(async () => {
    await closePool();
    process.exit(0);
  })
  .catch(async (err) => {
    logger.error({ err }, "Lỗi chạy migrations");
    await closePool().catch(() => undefined);
    process.exit(1);
  });
