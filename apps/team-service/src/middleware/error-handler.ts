import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
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
  if (err instanceof ZodError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation Error',
      errors: err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
    return;
  }
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${statusCode}: ${message}`, err.stack);

  res.status(statusCode).json(errorResponse(message));
}
