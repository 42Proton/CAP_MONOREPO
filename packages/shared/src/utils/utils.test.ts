import { successResponse, errorResponse, sleep, generateId } from './index';

describe('successResponse', () => {
  it('should create a success response with data', () => {
    const result = successResponse({ id: 1 });
    expect(result).toEqual({
      success: true,
      data: { id: 1 },
      message: undefined,
    });
  });

  it('should include an optional message', () => {
    const result = successResponse('ok', 'All good');
    expect(result).toEqual({
      success: true,
      data: 'ok',
      message: 'All good',
    });
  });
});

describe('errorResponse', () => {
  it('should create an error response', () => {
    const result = errorResponse('Something went wrong');
    expect(result).toEqual({
      success: false,
      error: 'Something went wrong',
      message: undefined,
    });
  });

  it('should include an optional message', () => {
    const result = errorResponse('Not found', 'Resource missing');
    expect(result).toEqual({
      success: false,
      error: 'Not found',
      message: 'Resource missing',
    });
  });
});

describe('sleep', () => {
  it('should resolve after specified time', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });
});

describe('generateId', () => {
  it('should generate an id of default length 12', () => {
    const id = generateId();
    expect(id).toHaveLength(12);
  });

  it('should generate an id of specified length', () => {
    const id = generateId(20);
    expect(id).toHaveLength(20);
  });

  it('should only contain lowercase alphanumeric characters', () => {
    const id = generateId(100);
    expect(id).toMatch(/^[a-z0-9]+$/);
  });

  it('should generate unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });
});
