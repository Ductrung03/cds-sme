import type { Response } from "express";

export interface ApiMeta {
  timestamp: string;
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorPayload | null;
  meta: ApiMeta;
}

const buildMeta = (extra?: Record<string, unknown>): ApiMeta => ({
  timestamp: new Date().toISOString(),
  ...(extra ?? {})
});

export const ok = <T>(res: Response, data: T, extraMeta?: Record<string, unknown>): Response => {
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    meta: buildMeta(extraMeta)
  };
  return res.json(body);
};

export const created = <T>(res: Response, data: T): Response => {
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    meta: buildMeta()
  };
  return res.status(201).json(body);
};

export const fail = (
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response => {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error: { code, message, details },
    meta: buildMeta()
  };
  return res.status(status).json(body);
};
