import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HTTP_STATUS } from '@mono/shared'; 

export interface JwtPayload {
  userId: string;
  role: string;
  githubUsername?: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const isAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.token;

    if (!token) {
      const error: any = new Error("Missing or invalid Authorization. Please login first.");
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      return next(error); 
    }
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;

    next();
  } 
  catch (err: any) {
    console.error("Auth Middleware Error:", err.message);
    
    err.statusCode = HTTP_STATUS.UNAUTHORIZED;
    err.message = "Invalid or expired token. Please login again.";
    
    next(err);
  }
};