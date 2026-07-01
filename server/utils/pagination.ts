import type { Request } from 'express';

export const DEFAULT_LIST_LIMIT = 500;
export const MAX_LIST_LIMIT = 2000;

export function parseListPagination(req: Request): { limit: number; skip: number } {
  const limitRaw =
    typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : Number.NaN;
  const skipRaw =
    typeof req.query.skip === 'string' ? Number.parseInt(req.query.skip, 10) : Number.NaN;

  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(limitRaw, MAX_LIST_LIMIT)
      : DEFAULT_LIST_LIMIT;
  const skip = Number.isFinite(skipRaw) && skipRaw >= 0 ? skipRaw : 0;

  return { limit, skip };
}
