import type { Request, Response, NextFunction } from "express";
import { ok } from "../../utils/api-response";
import { getPool } from "../../db/pool";

export const healthRouter = (_req: Request, res: Response, next: NextFunction): void => {
  (async () => {
    try {
      const pool = await getPool();
      await pool.request().query("SELECT 1");
      ok(res, {
        status: "healthy",
        version: "0.1.0",
        db: "connected"
      });
    } catch (err) {
      next(err);
    }
  })().catch(next);
};
