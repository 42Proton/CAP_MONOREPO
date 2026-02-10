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

import { errorHandler, AppError } from './error-handler';

describe('errorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = {};
    mockRes = { status: statusMock, json: jsonMock };
    mockNext = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should respond with 500 and default message when error has no statusCode', () => {
    const err: AppError = new Error('Unexpected failure');

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Unexpected failure',
      })
    );
  });

  it('should use error statusCode when provided', () => {
    const err: AppError = new Error('Not found');
    err.statusCode = 404;

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Not found',
      })
    );
  });

  it('should use "Internal Server Error" when error has no message', () => {
    const err: AppError = new Error();
    err.message = '';

    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Internal Server Error',
      })
    );
  });
});
