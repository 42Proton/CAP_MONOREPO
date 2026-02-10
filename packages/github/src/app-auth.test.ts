jest.mock('@octokit/core', () => ({
  Octokit: jest.fn().mockImplementation((opts) => ({ auth: opts.auth })),
}));
jest.mock('@octokit/auth-app', () => ({
  createAppAuth: jest.fn().mockReturnValue('app-auth-strategy'),
}));

import { createAppOctokit, createInstallationOctokit } from './app-auth';
import { Octokit } from '@octokit/core';

describe('createAppOctokit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an Octokit instance with app auth', () => {
    const result = createAppOctokit('app-123', 'private-key');

    expect(Octokit).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: {
          appId: 'app-123',
          privateKey: 'private-key',
        },
      })
    );
    expect(result).toBeDefined();
  });
});

describe('createInstallationOctokit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an Octokit instance with installation auth', () => {
    const result = createInstallationOctokit('app-123', 'private-key', 456);

    expect(Octokit).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: {
          appId: 'app-123',
          privateKey: 'private-key',
          installationId: 456,
        },
      })
    );
    expect(result).toBeDefined();
  });
});
