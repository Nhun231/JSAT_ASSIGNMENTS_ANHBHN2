/**
 * ui.ts — Pure render functions for DevDash.
 *
 * Day 3: List view rendering, loading / error / empty states.
 * Day 4: Search bar, category filter dropdown, sort controls.
 *
 * Each function returns an HTML string — the caller injects it via innerHTML.
 * This keeps rendering pure and testable (no side effects, no DOM queries).
 */

import type { Product, Category, FilterOptions, SortField } from "./types.ts";

// ---------------------------------------------------------------------------
// State-indicator views (Day 3)
// ---------------------------------------------------------------------------

/** Renders a centered loading spinner. */
export function renderLoading(): string {
  return `
    <div class="state-loading" id="state-loading">
      <div class="spinner"></div>
      <p>Loading products…</p>
    </div>
  `;
}

/** Renders a centered error message with a retry button. */
export function renderError(message: string): string {
  return `
    <div class="state-error" id="state-error">
      <p class="state-error__icon">⚠️</p>
      <p class="state-error__msg">${escapeHtml(message)}</p>
      <button class="btn btn--primary" id="btn-retry" style="margin-top: 1rem;">
        Retry
      </button>
    </div>
  `;
}

/** Renders a "nothing found" empty state. */
export function renderEmpty(message: string = "No products found."): string {
  return `
    <div class="state-empty" id="state-empty">
      <p class="state-empty__icon">📭</p>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Toolbar — search, filter, sort (Day 4)
// ---------------------------------------------------------------------------

/**
 * Renders the toolbar containing:
 *  - Text search input (filters by title/brand)
 *  - Category dropdown (filter by category)
 *  - Sort-field dropdown (title / price / rating)
 *  - Sort-order toggle button (asc ↑ / desc ↓)
 *  - Result count badge
 */
export function renderToolbar(
  categories: Category[],
  filters: FilterOptions,
  resultCount: number,
): string {
  const { query, category: selectedCat, sortField, sortOrder } = filters;

  // Build category <option> list — "All Categories" plus each one
  const categoryOptions = categories
    .map(({ slug, name }) => {
      const selected = slug === selectedCat ? "selected" : "";
      return `<option value="${escapeAttr(slug)}" ${selected}>${escapeHtml(name)}</option>`;
    })
    .join("");

  // Sort field options
  const sortFieldOptions: { value: SortField; label: string }[] = [
    { value: "title",  label: "Name" },
    { value: "price",  label: "Price" },
    { value: "rating", label: "Rating" },
  ];

  const sortFieldHtml = sortFieldOptions
    .map(({ value, label }) => {
      const selected = value === sortField ? "selected" : "";
      return `<option value="${value}" ${selected}>${label}</option>`;
    })
    .join("");

  const orderIcon = sortOrder === "asc" ? "↑" : "↓";
  const orderLabel = sortOrder === "asc" ? "Ascending" : "Descending";

  return `
    <div class="toolbar" id="toolbar">
      <div class="toolbar__search">
        <input
          type="text"
          class="input"
          id="search-input"
          placeholder="Search products…"
          value="${escapeAttr(query)}"
        />
      </div>

      <div class="toolbar__filters">
        <select class="select" id="filter-category" aria-label="Filter by category">
          <option value="" ${selectedCat === "" ? "selected" : ""}>All Categories</option>
          ${categoryOptions}
        </select>

        <select class="select" id="sort-field" aria-label="Sort by">
          ${sortFieldHtml}
        </select>

        <button
          class="btn btn--secondary toolbar__order-btn"
          id="sort-order"
          aria-label="Toggle sort order"
          title="${orderLabel}"
        >
          ${orderIcon}
        </button>
      </div>

      <span class="badge badge--accent toolbar__count" id="result-count">
        ${resultCount} result${resultCount !== 1 ? "s" : ""}
      </span>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Product card & grid (Day 3)
// ---------------------------------------------------------------------------

/** Renders a single product card. Clicking navigates to detail view. */
export function renderProductCard(product: Product): string {
  const { id, title, category, price, rating, thumbnail, brand, stock, discountPercentage } = product;

  const discount = discountPercentage > 0
    ? `<span class="card__discount badge badge--error">−${discountPercentage.toFixed(0)}%</span>`
    : "";

  const stockBadge = stock > 10
    ? `<span class="badge badge--success">In Stock</span>`
    : stock > 0
    ? `<span class="badge badge--warning">Low Stock (${stock})</span>`
    : `<span class="badge badge--error">Out of Stock</span>`;

  return `
    <article class="card product-card" data-product-id="${id}" id="product-${id}">
      <div class="card__img-wrap">
        <img
          class="card__img"
          src="${escapeAttr(thumbnail)}"
          alt="${escapeAttr(title)}"
          loading="lazy"
        />
        ${discount}
      </div>
      <div class="card__body">
        <span class="card__category badge badge--accent">${escapeHtml(category)}</span>
        <h3 class="card__title">${escapeHtml(title)}</h3>
        ${brand ? `<p class="card__brand">${escapeHtml(brand)}</p>` : ""}
        <div class="card__footer">
          <span class="card__price">$${price.toFixed(2)}</span>
          <span class="card__rating">⭐ ${rating.toFixed(1)}</span>
        </div>
        ${stockBadge}
      </div>
    </article>
  `;
}

/** Renders the product grid from a list of products. */
export function renderProductGrid(products: Product[]): string {
  if (products.length === 0) return renderEmpty();

  const cards = products.map(renderProductCard).join("");

  return `<div class="grid" id="product-grid">${cards}</div>`;
}

// ---------------------------------------------------------------------------
// Full list view (toolbar + grid) — assembled here
// ---------------------------------------------------------------------------

/**
 * Renders the complete list view: toolbar on top, product grid below.
 *
 * @param products   Already filtered/sorted list ready for display.
 * @param categories All categories (for the dropdown).
 * @param filters    Current filter/sort state.
 */
export function renderListView(
  products: Product[],
  categories: Category[],
  filters: FilterOptions,
): string {
  return (
    renderToolbar(categories, filters, products.length) +
    renderProductGrid(products)
  );
}

// ---------------------------------------------------------------------------
// Helpers — HTML escaping (prevent XSS from API data)
// ---------------------------------------------------------------------------

/** Escapes HTML entities in text content. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escapes a string for use inside an HTML attribute value (double-quoted). */
function escapeAttr(str: string): string {
  return escapeHtml(str).replace(/'/g, "&#x27;");
}
