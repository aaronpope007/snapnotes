/** Coalesce concurrent identical async requests into one in-flight promise. */
const inflight = new Map<string, Promise<unknown>>();

export function dedupeRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fetcher().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
