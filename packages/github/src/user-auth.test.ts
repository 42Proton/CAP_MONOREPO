jest.mock('@octokit/core', () => ({
  Octokit: jest.fn().mockImplementation((opts) => ({ auth: opts.auth })),
}));

import { createUserOctokit } from './user-auth';
import { Octokit } from '@octokit/core';

describe('createUserOctokit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an Octokit instance with user access token', () => {
    const result = createUserOctokit('ghu_user_token');

    expect(Octokit).toHaveBeenCalledWith({
      auth: 'ghu_user_token',
    });
    expect(result).toBeDefined();
  });
});
