import { paginationSchema } from './index';
import type { ApiResponse, PaginationParams, PaginatedResponse } from './index';

describe('paginationSchema', () => {
  it('should parse valid pagination input', () => {
    const result = paginationSchema.parse({ page: 2, limit: 50 });
    expect(result).toEqual({ page: 2, limit: 50 });
  });

  it('should apply default values', () => {
    const result = paginationSchema.parse({});
    expect(result).toEqual({ page: 1, limit: 20 });
  });

  it('should coerce string numbers', () => {
    const result = paginationSchema.parse({ page: '3', limit: '10' });
    expect(result).toEqual({ page: 3, limit: 10 });
  });

  it('should reject page less than 1', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
  });

  it('should reject limit greater than 100', () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });

  it('should reject limit less than 1', () => {
    expect(() => paginationSchema.parse({ limit: 0 })).toThrow();
  });
});

describe('ApiResponse type', () => {
  it('should allow creating a typed success response', () => {
    const response: ApiResponse<string> = {
      success: true,
      data: 'hello',
    };
    expect(response.success).toBe(true);
    expect(response.data).toBe('hello');
  });

  it('should allow creating a typed error response', () => {
    const response: ApiResponse = {
      success: false,
      error: 'something failed',
    };
    expect(response.success).toBe(false);
    expect(response.error).toBe('something failed');
  });
});

describe('PaginationParams type', () => {
  it('should allow creating pagination params', () => {
    const params: PaginationParams = { page: 1, limit: 20 };
    expect(params.page).toBe(1);
    expect(params.limit).toBe(20);
  });
});

describe('PaginatedResponse type', () => {
  it('should allow creating a paginated response', () => {
    const response: PaginatedResponse<number> = {
      success: true,
      data: [1, 2, 3],
      pagination: {
        page: 1,
        limit: 20,
        total: 3,
        totalPages: 1,
      },
    };
    expect(response.data).toHaveLength(3);
    expect(response.pagination.total).toBe(3);
  });
});
