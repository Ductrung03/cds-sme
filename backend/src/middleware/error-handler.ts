import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { fail } from "../utils/api-response";
import { logger } from "../utils/logger";

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    fail(res, err.status, err.code, err.message, err.details);
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, "Lỗi không mong đợi");
  fail(res, 500, "INTERNAL_ERROR", "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau");
};

export const notFoundHandler = (req: Request, res: Response): void => {
  fail(res, 404, "NOT_FOUND", `Không tìm thấy: ${req.method} ${req.path}`);
};
