jest.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'development',
    PORT: 3000,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    GITHUB_APP_ID: 'test-app-id',
    GITHUB_APP_PRIVATE_KEY: 'dGVzdA==',
    GITHUB_CLIENT_ID: 'test-client-id',
    GITHUB_CLIENT_SECRET: 'test-client-secret',
    JWT_SECRET: 'test-jwt-secret-that-is-at-least-32-chars-long',
    APP_URL: 'http://localhost:3000',
  },
  getGitHubPrivateKey: () => 'test',
}));

import type { Request, Response, NextFunction } from 'express';

import { requireAuth, signToken, JwtPayload } from './auth';

describe('signToken', () => {
  it('should return a JWT string', () => {
    const payload: JwtPayload = {
      userId: 'user-1',
      githubUsername: 'octocat',
      role: 'user',
    };

    const token = signToken(payload);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });
});

describe('requireAuth', () => {
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock };
    mockNext = jest.fn();
  });

  it('should return 401 when no Authorization header', () => {
    const mockReq = { headers: {} } as Request;

    requireAuth(mockReq, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Missing or invalid Authorization header',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header does not start with Bearer', () => {
    const mockReq = { headers: { authorization: 'Basic abc' } } as Request;

    requireAuth(mockReq, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token', () => {
    const mockReq = {
      headers: { authorization: 'Bearer invalid-token' },
    } as Request;

    requireAuth(mockReq, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Invalid or expired token',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next and attach user for valid token', () => {
    const payload: JwtPayload = {
      userId: 'user-1',
      githubUsername: 'octocat',
      role: 'user',
    };
    const token = signToken(payload);
    const mockReq = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;

    requireAuth(mockReq, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user!.userId).toBe('user-1');
    expect(mockReq.user!.githubUsername).toBe('octocat');
    expect(mockReq.user!.role).toBe('user');
  });
});
