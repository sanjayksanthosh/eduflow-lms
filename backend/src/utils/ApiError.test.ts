import { describe, expect, it } from 'vitest';
import { ApiError } from './ApiError';

describe('ApiError', () => {
  it('carries the status code, message and operational flag', () => {
    const error = new ApiError(418, 'I am a teapot');

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(418);
    expect(error.message).toBe('I am a teapot');
    expect(error.isOperational).toBe(true);
  });

  it('exposes helpers for the common status codes', () => {
    expect(ApiError.badRequest().statusCode).toBe(400);
    expect(ApiError.unauthorized().statusCode).toBe(401);
    expect(ApiError.forbidden().statusCode).toBe(403);
    expect(ApiError.notFound().statusCode).toBe(404);
    expect(ApiError.conflict().statusCode).toBe(409);
    expect(ApiError.unprocessable().statusCode).toBe(422);
    expect(ApiError.tooManyRequests().statusCode).toBe(429);
  });

  it('marks internal errors as non-operational', () => {
    expect(ApiError.internal().statusCode).toBe(500);
    expect(ApiError.internal().isOperational).toBe(false);
  });

  it('keeps validation details on the error', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const error = ApiError.unprocessable('Validation failed', details);

    expect(error.message).toBe('Validation failed');
    expect(error.errors).toEqual(details);
  });

  it('uses sensible default messages', () => {
    expect(ApiError.badRequest().message).toBe('Bad request');
    expect(ApiError.notFound().message).toBe('Resource not found');
  });
});
