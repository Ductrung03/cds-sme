import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";
import { BadRequest } from "../utils/errors";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validate = (schema: ZodSchema, source: "body" | "query" | "params" = "body") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any)[source] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message
        }));
        next(BadRequest("Dữ liệu không hợp lệ", details));
      } else {
        next(err);
      }
    }
  };
};
