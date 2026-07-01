export interface FetchOptions {
  signal?: AbortSignal;
  limit?: number;
  skip?: number;
}

export const DEFAULT_FETCH_LIMIT = 500;
