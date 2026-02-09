export interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  clientId: string;
  clientSecret: string;
  webhookSecret?: string;
}

export interface GitHubInstallationData {
  installationId: number;
  accountType: 'Organization' | 'User';
  accountLogin: string;
  accountId: number;
  repositorySelection: 'all' | 'selected';
  permissions: Record<string, string>;
}

export interface GitHubOAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  expires_in?: number;
}

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}
