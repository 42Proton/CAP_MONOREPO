import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { errorResponse, HTTP_STATUS } from '@mono/shared';

import { env } from '../config/env.js';

export interface JwtPayload {
  userId: string;
  githubUsername: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      errorResponse('Missing or invalid Authorization header')
    );
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse('Invalid or expired token'));
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}
