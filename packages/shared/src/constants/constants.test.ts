import { HTTP_STATUS, ENVIRONMENTS } from './index';
import type { Environment } from './index';

describe('HTTP_STATUS', () => {
  it('should have correct status codes', () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.CREATED).toBe(201);
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.FORBIDDEN).toBe(403);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
  });

  it('should have all expected keys', () => {
    const keys = Object.keys(HTTP_STATUS);
    expect(keys).toEqual(
      expect.arrayContaining([
        'OK',
        'CREATED',
        'BAD_REQUEST',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'INTERNAL_SERVER_ERROR',
      ])
    );
  });
});

describe('ENVIRONMENTS', () => {
  it('should have correct environment values', () => {
    expect(ENVIRONMENTS.DEVELOPMENT).toBe('development');
    expect(ENVIRONMENTS.STAGING).toBe('staging');
    expect(ENVIRONMENTS.PRODUCTION).toBe('production');
  });

  it('should have all expected keys', () => {
    const keys = Object.keys(ENVIRONMENTS);
    expect(keys).toEqual(
      expect.arrayContaining(['DEVELOPMENT', 'STAGING', 'PRODUCTION'])
    );
  });

  it('should allow type-safe environment assignment', () => {
    const env: Environment = ENVIRONMENTS.DEVELOPMENT;
    expect(env).toBe('development');
  });
});
