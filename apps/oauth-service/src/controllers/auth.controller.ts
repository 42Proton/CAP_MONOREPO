import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { db, eq, users } from '@mono/db';
import { getAuthorizationUrl, exchangeCodeForToken, getGitHubUser } from '@mono/github';
import { successResponse, errorResponse, HTTP_STATUS } from '@mono/shared';
import { env } from '../config/env.js';
import { signToken } from '../middleware/auth.js';

export const githubLogin = (_req: Request, res: Response) => {
  const state = crypto.randomBytes(32).toString('hex');

  res.cookie('oauth_state', state, { 
    httpOnly: true, 
    maxAge: 15 * 60 * 1000, 
    secure: process.env.NODE_ENV === 'production' && !process.env.APP_URL?.includes('localhost'),
    sameSite: 'lax'
  });

  const url = getAuthorizationUrl(
    env.GITHUB_CLIENT_ID,
    env.GITHUB_CALLBACK_URL,
    state
  );
  
  res.redirect(url);
};

export const githubCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const savedState = req.cookies.oauth_state;

  if (!state || state !== savedState) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(errorResponse('Invalid state parameter.'));
  }

  res.clearCookie('oauth_state');

  if (!code || typeof code !== 'string') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse('No code provided'));
  }

  try {
    const tokenData = await exchangeCodeForToken(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET, code);
    const githubUser = await getGitHubUser(tokenData.access_token);

    const [existingUser] = await db.select().from(users).where(eq(users.githubId, String(githubUser.id)));

    const { userId, userRole } = existingUser 
      ? await (async () => {
          const [updated] = await db.update(users)
            .set({
              githubUsername: githubUser.login,
              githubAccessToken: tokenData.access_token,
              lastLoginAt: new Date(),
            })
            .where(eq(users.githubId, String(githubUser.id)))
            .returning({ id: users.id });
          return { userId: updated.id, userRole: existingUser.role };
        })()
      : await (async () => {
          const [inserted] = await db.insert(users)
            .values({
              email: githubUser.email ?? `${githubUser.id}@github.com`,
              githubId: String(githubUser.id),
              githubUsername: githubUser.login,
              role: 'user', 
            })
            .returning({ id: users.id });
          return { userId: inserted.id, userRole: 'user' };
        })();

    const token = signToken({ userId, githubUsername: githubUser.login, role: userRole });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && !process.env.APP_URL?.includes('localhost'),
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json(successResponse({ token, user: { id: userId, githubUsername: githubUser.login } }));

  } catch (error: any) {
    console.error('[Auth Service] Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse(error.message));
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse('User not authenticated'));
    }

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
      .where(eq(users.id, userId));

    if (result.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse('User not found'));
    }

    res.json(successResponse(result[0]));
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(error.message || 'Failed to fetch user profile')
    );
  }
};
export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json(successResponse({ message: 'Logged out successfully' }));
};
