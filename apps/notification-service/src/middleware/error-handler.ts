import type { NextFunction, Request, Response } from 'express';

import { errorResponse, HTTP_STATUS } from '@mono/shared';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${statusCode}: ${message}`, err.stack);

  res.status(statusCode).json(errorResponse(message));
}
