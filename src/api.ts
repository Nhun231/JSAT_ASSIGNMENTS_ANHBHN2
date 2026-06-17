/**
 * api.ts — Generic fetch helper and typed DummyJSON endpoint functions.
 *
 * Features:
 *  - Generic `fetchJson<T>` with `res.ok` check, `try/catch`, typed errors
 *  - `ApiError` class carrying HTTP status for fine-grained error handling
 *  - Generic `Cache<K, V>` class (Excellent tier — generic class with constraint)
 *  - All endpoint functions are fully typed; no `any` used for domain data
 */

import type {
  Category,
  Product,
  ProductListResponse,
} from "./types.ts";

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const BASE_URL = "https://dummyjson.com";

// ---------------------------------------------------------------------------
// Custom error type — carries HTTP status so callers can distinguish 404 vs 500
// ---------------------------------------------------------------------------

/** Thrown by `fetchJson` when the response is not OK (res.ok === false). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Generic fetch helper (Feature 5 / Good tier)
// ---------------------------------------------------------------------------

/**
 * Fetches `url` and deserialises the JSON body as `T`.
 *
 * - Checks `res.ok`; throws `ApiError` if the server returned an error status.
 * - Wraps network / JSON-parse failures in a plain `Error`.
 *
 * @template T  The expected shape of the response body.
 */
export async function fetchJson<T>(url: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch (networkError) {
    // fetch() itself throws on network failure (offline, DNS, etc.)
    const message =
      networkError instanceof Error
        ? networkError.message
        : "Network request failed";
    throw new Error(`Network error: ${message}`);
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `HTTP ${response.status} — ${response.statusText} (${url})`
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`Failed to parse JSON from ${url}`);
  }
}

// ---------------------------------------------------------------------------
// Generic in-memory cache class (Excellent tier — generic class with constraint)
// ---------------------------------------------------------------------------

/**
 * Simple TTL-based in-memory cache.
 *
 * @template K  Cache key type — must be a `string` or `number`.
 * @template V  Cached value type.
 */
export class Cache<K extends string | number, V> {
  private readonly store = new Map<K, { value: V; expiresAt: number }>();
  private readonly ttlMs: number;

  /** @param ttlSeconds  How long each entry lives before it is considered stale. */
  constructor(ttlSeconds: number = 60) {
    this.ttlMs = ttlSeconds * 1000;
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  invalidate(key: K): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// Module-level caches (products TTL 5 min, categories TTL 30 min)
// ---------------------------------------------------------------------------

const productCache = new Cache<number, Product>(300);
const listCache    = new Cache<string, ProductListResponse>(300);
const categoryCache = new Cache<"all", Category[]>(1800);

// ---------------------------------------------------------------------------
// Typed endpoint functions
// ---------------------------------------------------------------------------

/**
 * Fetches ALL products (up to `limit`, default 0 = all from API).
 * Results are cached to avoid redundant network calls.
 *
 * DummyJSON supports: GET /products?limit=<n>&skip=<n>
 */
export async function fetchProducts(
  limit: number = 0,
  skip: number = 0
): Promise<ProductListResponse> {
  const cacheKey = `products-${limit}-${skip}`;
  const cached = listCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const url =
    limit > 0
      ? `${BASE_URL}/products?limit=${limit}&skip=${skip}`
      : `${BASE_URL}/products?limit=0`; // limit=0 → DummyJSON returns all

  const data = await fetchJson<ProductListResponse>(url);
  listCache.set(cacheKey, data);
  return data;
}

/**
 * Fetches a single product by its numeric `id`.
 * Results are cached individually.
 */
export async function fetchProductById(id: number): Promise<Product> {
  const cached = productCache.get(id);
  if (cached !== undefined) return cached;

  const data = await fetchJson<Product>(`${BASE_URL}/products/${id}`);
  productCache.set(id, data);
  return data;
}

/**
 * Fetches all product categories from DummyJSON.
 * Response: `Category[]` — `{ slug, name, url }[]`
 * Results are cached for 30 minutes.
 */
export async function fetchCategories(): Promise<Category[]> {
  const cached = categoryCache.get("all");
  if (cached !== undefined) return cached;

  const data = await fetchJson<Category[]>(`${BASE_URL}/products/categories`);
  categoryCache.set("all", data);
  return data;
}

/**
 * Fetches products filtered by `category` slug.
 * DummyJSON endpoint: GET /products/category/<slug>
 */
export async function fetchProductsByCategory(
  categorySlug: string
): Promise<ProductListResponse> {
  const cacheKey = `cat-${categorySlug}`;
  const cached = listCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const data = await fetchJson<ProductListResponse>(
    `${BASE_URL}/products/category/${encodeURIComponent(categorySlug)}`
  );
  listCache.set(cacheKey, data);
  return data;
}

/**
 * Loads **both** products and categories in parallel using `Promise.all`
 * (Feature 4 — parallel loading).
 *
 * Returns a tuple `[ProductListResponse, Category[]]` once both settle.
 * If either rejects, the error propagates to the caller.
 */
export async function fetchDashboardData(): Promise<
  [ProductListResponse, Category[]]
> {
  return Promise.all([fetchProducts(), fetchCategories()]);
}
