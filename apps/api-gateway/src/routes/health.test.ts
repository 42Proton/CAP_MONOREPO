// Mock env and external deps before importing app
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
jest.mock('@mono/github', () => ({
  getAuthorizationUrl: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  getGitHubUser: jest.fn(),
  createAppOctokit: jest.fn(),
  createInstallationOctokit: jest.fn(),
  createUserOctokit: jest.fn(),
  verifyWebhookSignature: jest.fn(),
}));
jest.mock('@mono/db');

import request from 'supertest';

import app from '../app';

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.service).toBe('api-gateway');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status', async () => {
      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ready');
    });
  });
});
