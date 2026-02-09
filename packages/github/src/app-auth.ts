import { Octokit } from '@octokit/core';
import { createAppAuth } from '@octokit/auth-app';

export function createAppOctokit(appId: string, privateKey: string): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
    },
  });
}

export function createInstallationOctokit(
  appId: string,
  privateKey: string,
  installationId: number
): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });
}
