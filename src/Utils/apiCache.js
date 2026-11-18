import { base_url } from '../config/config';

// Tiny in-memory cache for public, non-user-specific GET endpoints.
// - Concurrent callers of the same path share one request (same promise).
// - Successful JSON is kept for `ttlMs` (default 2 minutes).
// - Failed requests (network error or non-2xx) are dropped so the next call retries.
// Never use it for anything tied to the signed-in user (cart, profile, orders, notifications).

const DEFAULT_TTL_MS = 2 * 60 * 1000;
const cache = new Map(); // path -> { promise, data, hasData, expires }

export function cachedGet(path, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const hit = cache.get(path);
  if (hit && (!hit.hasData || hit.expires > Date.now())) return hit.promise;

  const entry = { hasData: false, data: undefined, expires: 0 };
  entry.promise = fetch(`${base_url}${path}`)
    .then((res) => {
      if (!res.ok) {
        const err = new Error(`GET ${path} failed with ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return res.json();
    })
    .then(
      (data) => {
        entry.data = data;
        entry.hasData = true;
        entry.expires = Date.now() + ttlMs;
        return data;
      },
      (err) => {
        if (cache.get(path) === entry) cache.delete(path);
        throw err;
      }
    );

  cache.set(path, entry);
  return entry.promise;
}

// Returns cached data synchronously when it is present and fresh, otherwise undefined.
// Lets components render cached data on the first paint instead of flashing a skeleton.
export function peekCached(path) {
  const hit = cache.get(path);
  return hit && hit.hasData && hit.expires > Date.now() ? hit.data : undefined;
}
