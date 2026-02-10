import { getAuthorizationUrl } from './oauth';

describe('getAuthorizationUrl', () => {
  it('should build the correct OAuth URL with required params', () => {
    const url = getAuthorizationUrl('client-123', 'http://localhost/callback', 'state-abc');

    expect(url).toContain('https://github.com/login/oauth/authorize');
    expect(url).toContain('client_id=client-123');
    expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%2Fcallback');
    expect(url).toContain('state=state-abc');
  });

  it('should include scopes when provided', () => {
    const url = getAuthorizationUrl('client-123', 'http://localhost/callback', 'state-abc', [
      'read:user',
      'repo',
    ]);

    expect(url).toContain('scope=read%3Auser+repo');
  });

  it('should not include scope param when scopes array is empty', () => {
    const url = getAuthorizationUrl('client-123', 'http://localhost/callback', 'state-abc', []);

    expect(url).not.toContain('scope=');
  });
});

describe('exchangeCodeForToken', () => {
  const { exchangeCodeForToken } = require('./oauth');

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should exchange code for token successfully', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        access_token: 'ghu_test_token',
        token_type: 'bearer',
        scope: '',
      }),
    };
    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const result = await exchangeCodeForToken('client-id', 'client-secret', 'code-123');

    expect(result.access_token).toBe('ghu_test_token');
    expect(fetch).toHaveBeenCalledWith(
      'https://github.com/login/oauth/access_token',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      })
    );
  });

  it('should throw when response is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(exchangeCodeForToken('a', 'b', 'c')).rejects.toThrow(
      'GitHub token exchange failed: 500'
    );
  });

  it('should throw when no access_token in response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response);

    await expect(exchangeCodeForToken('a', 'b', 'c')).rejects.toThrow(
      'GitHub token exchange returned no access_token'
    );
  });
});

describe('getGitHubUser', () => {
  const { getGitHubUser } = require('./oauth');

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch GitHub user profile', async () => {
    const mockUser = {
      id: 1,
      login: 'testuser',
      name: 'Test',
      email: 'test@example.com',
      avatar_url: 'https://example.com/avatar.png',
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockUser),
    } as unknown as Response);

    const result = await getGitHubUser('token-123');

    expect(result).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/user',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
  });

  it('should throw when response is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    await expect(getGitHubUser('bad-token')).rejects.toThrow(
      'Failed to fetch GitHub user: 401'
    );
  });
});
