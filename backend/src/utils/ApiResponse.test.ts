import { describe, expect, it } from 'vitest';
import { ApiResponse, buildPaginationMeta } from './ApiResponse';

describe('ApiResponse', () => {
  it('wraps data in a successful envelope', () => {
    const response = new ApiResponse({ id: '1' });

    expect(response.success).toBe(true);
    expect(response.message).toBe('Success');
    expect(response.data).toEqual({ id: '1' });
    expect(response.meta).toBeUndefined();
  });

  it('accepts a custom message and metadata', () => {
    const response = new ApiResponse([], 'Created', { page: 1 });

    expect(response.message).toBe('Created');
    expect(response.meta).toEqual({ page: 1 });
  });
});

describe('buildPaginationMeta', () => {
  it('rounds the page count up', () => {
    expect(buildPaginationMeta(2, 10, 95)).toEqual({
      page: 2,
      limit: 10,
      total: 95,
      totalPages: 10,
    });
  });

  it('reports at least one page for an empty collection', () => {
    expect(buildPaginationMeta(1, 10, 0).totalPages).toBe(1);
  });
});
