import { describe, expect, it } from 'vitest';
import { buildSearchFilter, endOfDay, getPagination, parseDate, startOfDay } from './pagination';
import { ApiError } from './ApiError';

describe('getPagination', () => {
  it('falls back to the first page with ten rows', () => {
    expect(getPagination({})).toEqual({ page: 1, limit: 10, skip: 0, sortOrder: 'desc' });
  });

  it('computes skip from page and limit', () => {
    expect(getPagination({ page: 4, limit: 25 })).toEqual({
      page: 4,
      limit: 25,
      skip: 75,
      sortOrder: 'desc',
    });
  });

  it('clamps page and limit to safe bounds', () => {
    expect(getPagination({ page: -3, limit: 5000 }).page).toBe(1);
    expect(getPagination({ page: -3, limit: 5000 }).limit).toBe(100);
    expect(getPagination({ page: 2, limit: 0 }).limit).toBe(10);
  });

  it('ignores non-numeric values and defaults the sort direction', () => {
    const query = { page: 'abc' as unknown as number, limit: 'xyz' as unknown as number };
    expect(getPagination(query)).toEqual({ page: 1, limit: 10, skip: 0, sortOrder: 'desc' });
  });

  it('keeps an ascending sort when asked', () => {
    expect(getPagination({ sortOrder: 'asc' }).sortOrder).toBe('asc');
    expect(getPagination({ sortOrder: 'sideways' }).sortOrder).toBe('desc');
  });
});

describe('buildSearchFilter', () => {
  it('returns undefined for a missing or blank term', () => {
    expect(buildSearchFilter(undefined, ['name'])).toBeUndefined();
    expect(buildSearchFilter('   ', ['name'])).toBeUndefined();
  });

  it('builds one case-insensitive contains clause per field', () => {
    expect(buildSearchFilter('  ada ', ['name', 'email'])).toEqual([
      { name: { contains: 'ada', mode: 'insensitive' } },
      { email: { contains: 'ada', mode: 'insensitive' } },
    ]);
  });
});

describe('parseDate', () => {
  it('parses an ISO date', () => {
    expect(parseDate('2024-10-24', 'startDate').toISOString()).toBe('2024-10-24T00:00:00.000Z');
  });

  it('rejects a missing or unparseable date', () => {
    expect(() => parseDate(undefined, 'startDate')).toThrowError(ApiError);
    expect(() => parseDate('not-a-date', 'startDate')).toThrowError('startDate is invalid');

    try {
      parseDate(undefined, 'startDate');
    } catch (error) {
      expect((error as ApiError).statusCode).toBe(400);
    }
  });
});

describe('day boundaries', () => {
  it('snaps to the start and end of the day', () => {
    const noon = new Date('2024-10-24T12:34:56.789');

    expect(startOfDay(noon).getHours()).toBe(0);
    expect(startOfDay(noon).getMinutes()).toBe(0);

    expect(endOfDay(noon).getHours()).toBe(23);
    expect(endOfDay(noon).getMinutes()).toBe(59);
    expect(endOfDay(noon).getMilliseconds()).toBe(999);
  });

  it('does not mutate the input date', () => {
    const noon = new Date('2024-10-24T12:00:00.000');
    startOfDay(noon);
    endOfDay(noon);
    expect(noon.getHours()).toBe(12);
  });
});
