import { Octokit } from '@octokit/core';

export function createUserOctokit(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
  });
}
