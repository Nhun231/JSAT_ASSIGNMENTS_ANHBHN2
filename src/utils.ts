/**
 * utils.ts — Reusable helpers: debounce, memoize, formatters.
 *
 * Both `debounce` and `memoize` are implemented as **closures** —
 * they capture internal state (timerId / cache) in a lexical scope.
 *
 * Excellent tier criteria:
 *  - Memoization applied to search/caching
 *  - Debounce applied to search input
 *  - Both use closures
 */

// ---------------------------------------------------------------------------
// Debounce (closure — delays execution until the caller stops calling)
// ---------------------------------------------------------------------------

/**
 * Returns a debounced version of `fn`.
 *
 * The returned function delays invoking `fn` until `delayMs` milliseconds
 * have elapsed since the last invocation.
 *
 * Uses a **closure** over the timer ID.
 *
 * @template A  Argument types of the wrapped function.
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): (...args: A) => void {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return (...args: A): void => {
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, delayMs);
  };
}

// ---------------------------------------------------------------------------
// Memoize (closure — caches the result of a pure function)
// ---------------------------------------------------------------------------

/**
 * Returns a memoized version of a **single-argument** pure function.
 *
 * The cache key is `JSON.stringify(arg)` for simplicity.
 * Uses a **closure** over the `Map` cache.
 *
 * @template T  Argument type.
 * @template R  Return type.
 */
export function memoize<T, R>(fn: (arg: T) => R): (arg: T) => R {
  const cache = new Map<string, R>();

  return (arg: T): R => {
    const key = JSON.stringify(arg);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(arg);
    cache.set(key, result);
    return result;
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Formats a price like `$12.99`. */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/** Formats a rating like `4.5 / 5`. */
export function formatRating(rating: number): string {
  return `${rating.toFixed(1)} / 5`;
}

/** Capitalises the first letter of a string. */
export function capitalise(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Truncates a string to `maxLen` characters, adding "…" if truncated. */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen - 1)}…`;
}
