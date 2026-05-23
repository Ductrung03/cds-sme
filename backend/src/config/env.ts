import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(1433),
  DB_USER: z.string().default("sa"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD bắt buộc"),
  DB_NAME: z.string().default("cds_sme"),
  DB_ENCRYPT: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  DB_TRUST_SERVER_CERTIFICATE: z
    .string()
    .default("true")
    .transform((v) => v === "true"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET phải tối thiểu 16 ký tự"),
  JWT_EXPIRES_IN: z.string().default("12h"),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  AI_PROVIDER: z.enum(["heuristic", "openai", "gemini"]).default("heuristic"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash")
});

export type AppEnv = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Cấu hình môi trường không hợp lệ:");
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Cấu hình môi trường không hợp lệ. Vui lòng kiểm tra .env");
}

export const env: AppEnv = parsed.data;
