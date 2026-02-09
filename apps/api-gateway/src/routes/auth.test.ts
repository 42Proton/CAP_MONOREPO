import request from 'supertest';

// Mock env before anything else imports it
jest.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'development',
    PORT: 3000,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    GITHUB_APP_ID: 'test-app-id',
    GITHUB_APP_PRIVATE_KEY: 'dGVzdC1wcml2YXRlLWtleQ==',
    GITHUB_CLIENT_ID: 'test-client-id',
    GITHUB_CLIENT_SECRET: 'test-client-secret',
    JWT_SECRET: 'test-jwt-secret-that-is-at-least-32-chars-long',
    APP_URL: 'http://localhost:3000',
  },
  getGitHubPrivateKey: () => 'test-private-key',
}));

jest.mock('@mono/github', () => ({
  getAuthorizationUrl: jest.fn(
    () => 'https://github.com/login/oauth/authorize?client_id=test&state=abc'
  ),
  exchangeCodeForToken: jest.fn(() =>
    Promise.resolve({
      access_token: 'ghu_mock_access_token',
      token_type: 'bearer',
      scope: '',
      refresh_token: 'ghr_mock_refresh_token',
    })
  ),
  getGitHubUser: jest.fn(() =>
    Promise.resolve({
      id: 12345,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://avatars.githubusercontent.com/u/12345',
    })
  ),
}));

const mockReturning = jest.fn();
const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });

jest.mock('@mono/db', () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: mockValues,
    }),
    update: jest.fn().mockReturnValue({
      set: mockSet,
    }),
  },
  users: {
    id: 'id',
    email: 'email',
    name: 'name',
    avatarUrl: 'avatar_url',
    githubId: 'github_id',
    githubUsername: 'github_username',
    githubAccessToken: 'github_access_token',
    githubRefreshToken: 'github_refresh_token',
    role: 'role',
    lastLoginAt: 'last_login_at',
    createdAt: 'created_at',
  },
  eq: jest.fn(),
}));

import app from '../app';

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'uuid-123' }]);
  });

  describe('GET /auth/github', () => {
    it('should redirect to GitHub OAuth authorization URL', async () => {
      const response = await request(app).get('/auth/github');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain(
        'github.com/login/oauth/authorize'
      );
    });
  });

  describe('GET /auth/github/callback', () => {
    it('should return 400 when code is missing', async () => {
      const response = await request(app).get('/auth/github/callback');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing authorization code');
    });

    it('should exchange code and return JWT for new user', async () => {
      const response = await request(app)
        .get('/auth/github/callback')
        .query({ code: 'test-code', state: 'test-state' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.githubUsername).toBe('testuser');
      expect(response.body.data.user.name).toBe('Test User');
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    it('should return success', async () => {
      const response = await request(app).post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
