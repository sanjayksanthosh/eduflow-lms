export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T;
  public readonly meta?: Record<string, unknown>;

  constructor(data: T, message = 'Success', meta?: Record<string, unknown>) {
    this.success = true;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
});
