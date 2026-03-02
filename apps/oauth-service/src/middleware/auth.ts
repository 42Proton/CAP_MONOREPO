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
  const cookieToken = req.cookies?.token;

  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      errorResponse('Missing or invalid Authorization. Please login first.')
    );
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    req.user = decoded;
    
    next();
  } catch (error) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      errorResponse('Invalid or expired token. Please login again.')
    );
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}
