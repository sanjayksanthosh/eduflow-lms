import { ApiError } from '../utils/ApiError';

export interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

/**
 * Parses pagination params, returning page/limit/skip plus a Prisma-friendly
 * sort object. Values are clamped to safe bounds.
 */
export const getPagination = (
  query: QueryOptions
): { page: number; limit: number; skip: number; sortOrder: 'asc' | 'desc' } => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  return { page, limit, skip, sortOrder };
};

/** Builds a MongoDB full-text-ish search filter for a set of text fields. */
export const buildSearchFilter = (
  search: string | undefined,
  fields: string[]
): Record<string, unknown>[] | undefined => {
  if (!search || !search.trim()) return undefined;
  const term = search.trim();
  return fields.map((field) => ({
    [field]: { contains: term, mode: 'insensitive' as const },
  }));
};

export const parseDate = (value: string | undefined, fieldName: string): Date => {
  if (!value) throw ApiError.badRequest(`${fieldName} is required`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`${fieldName} is invalid`);
  }
  return date;
};

export const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};
