import crypto from 'node:crypto';

import { Router, type Router as RouterType } from 'express';

import { db, eq, users } from '@mono/db';
import { exchangeCodeForToken, getAuthorizationUrl, getGitHubUser } from '@mono/github';
import { errorResponse, HTTP_STATUS, successResponse } from '@mono/shared';

import { env } from '../config/env.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router: RouterType = Router();

/**
 * GET /auth/github
 * Redirects user to GitHub OAuth authorization page.
 */
router.get('/github', (_req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${env.APP_URL}/auth/github/callback`;
  const url = getAuthorizationUrl(env.GITHUB_CLIENT_ID, redirectUri, state);

  res.redirect(url);
});

/**
 * GET /auth/github/callback
 * Handles the OAuth callback from GitHub.
 * Exchanges code for tokens, upserts user, returns JWT.
 */
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse('Missing authorization code'));
    return;
  }

  try {
    const tokenData = await exchangeCodeForToken(
      env.GITHUB_CLIENT_ID,
      env.GITHUB_CLIENT_SECRET,
      code
    );

    const githubUser = await getGitHubUser(tokenData.access_token);

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.githubId, String(githubUser.id)));

    let userId: string;
    let userRole: string;

    if (existingUsers.length > 0) {
      const updated = await db
        .update(users)
        .set({
          githubUsername: githubUser.login,
          githubAccessToken: tokenData.access_token,
          githubRefreshToken: tokenData.refresh_token ?? null,
          name: githubUser.name ?? existingUsers[0].name,
          avatarUrl: githubUser.avatar_url,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.githubId, String(githubUser.id)))
        .returning({ id: users.id });

      userId = updated[0].id;
      userRole = existingUsers[0].role;
    } else {
      const inserted = await db
        .insert(users)
        .values({
          email:
            githubUser.email ??
            `${githubUser.id}+${githubUser.login}@users.noreply.github.com`,
          name: githubUser.name,
          avatarUrl: githubUser.avatar_url,
          githubId: String(githubUser.id),
          githubUsername: githubUser.login,
          githubAccessToken: tokenData.access_token,
          githubRefreshToken: tokenData.refresh_token ?? null,
          lastLoginAt: new Date(),
        })
        .returning({ id: users.id });

      userId = inserted[0].id;
      userRole = 'user';
    }

    const token = signToken({
      userId,
      githubUsername: githubUser.login,
      role: userRole,
    });

    res.json(
      successResponse({
        token,
        user: {
          id: userId,
          githubUsername: githubUser.login,
          name: githubUser.name,
          avatarUrl: githubUser.avatar_url,
        },
      })
    );
  } catch (err) {
    console.error('[Auth] GitHub OAuth callback error:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse('Authentication failed')
    );
  }
});

/**
 * GET /auth/me
 * Returns the currently authenticated user's profile.
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        githubUsername: users.githubUsername,
        role: users.role,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user!.userId));

    if (result.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse('User not found'));
      return;
    }

    res.json(successResponse(result[0]));
  } catch (err) {
    console.error('[Auth] Get current user error:', err);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(errorResponse('Failed to fetch user'));
  }
});

/**
 * POST /auth/logout
 * Stateless logout — client discards JWT.
 */
router.post('/logout', (_req, res) => {
  res.json(successResponse({ message: 'Logged out successfully' }));
});

export { router as authRouter };
