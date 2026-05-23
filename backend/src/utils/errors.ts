export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest = (message: string, details?: unknown): AppError =>
  new AppError(400, "BAD_REQUEST", message, details);

export const Unauthorized = (message = "Bạn cần đăng nhập để thực hiện thao tác này"): AppError =>
  new AppError(401, "UNAUTHORIZED", message);

export const Forbidden = (message = "Bạn không có quyền thực hiện thao tác này"): AppError =>
  new AppError(403, "FORBIDDEN", message);

export const NotFound = (message = "Không tìm thấy tài nguyên"): AppError =>
  new AppError(404, "NOT_FOUND", message);

export const Conflict = (message: string): AppError => new AppError(409, "CONFLICT", message);

export const UnprocessableEntity = (message: string, details?: unknown): AppError =>
  new AppError(422, "UNPROCESSABLE_ENTITY", message, details);
