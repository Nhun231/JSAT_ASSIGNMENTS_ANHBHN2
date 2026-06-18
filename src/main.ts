/**
 * main.ts — Entry point for DevDash.
 *
 * Day 3: Bootstrap app, load data with async/await, render list, handle errors.
 * Day 4: Wire search, category filter, and sort controls with higher-order functions.
 */

import "./styles.css";

import type { Product, Category, FilterOptions, SortField, SortOrder } from "./types.ts";
import { fetchDashboardData } from "./api.ts";
import {
  renderLoading,
  renderError,
  renderListView,
} from "./ui.ts";

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const appEl = document.querySelector<HTMLDivElement>("#app");

if (!appEl) {
  throw new Error("Root element #app not found in index.html.");
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** All products as fetched from the API (unfiltered source of truth). */
let allProducts: Product[] = [];

/** All categories fetched alongside products. */
let allCategories: Category[] = [];

/** Current filter/sort state. */
let filters: FilterOptions = {
  query: "",
  category: "",
  sortField: "title",
  sortOrder: "asc",
};

// ---------------------------------------------------------------------------
// Mount the page shell (header + empty main container)
// ---------------------------------------------------------------------------

appEl.innerHTML = `
  <header class="header">
    <div class="header__inner">
      <span class="header__logo">⚡ DevDash</span>
      <p class="header__subtitle">Typed Async Dashboard — AJT-LA-01</p>
    </div>
  </header>

  <main class="main" id="main-content"></main>
`;

const mainEl = document.querySelector<HTMLElement>("#main-content")!;

// ---------------------------------------------------------------------------
// Higher-order filter / sort functions (Day 4)
// ---------------------------------------------------------------------------

/**
 * Returns a predicate that tests whether a product matches the
 * current text query (searches title + brand, case-insensitive).
 *
 * Uses a **closure** over the lowered query string.
 */
const makeSearchFilter = (query: string): ((p: Product) => boolean) => {
  const q = query.trim().toLowerCase();
  if (q === "") return () => true;
  return ({ title, brand }: Product) =>
    title.toLowerCase().includes(q) ||
    (brand ?? "").toLowerCase().includes(q);
};

/**
 * Returns a predicate that tests whether a product belongs to
 * the selected category. Empty string = all categories.
 */
const makeCategoryFilter = (category: string): ((p: Product) => boolean) => {
  if (category === "") return () => true;
  return (p: Product) => p.category === category;
};

/**
 * Returns a comparator function for `Array.prototype.sort` based on
 * the chosen `sortField` and `sortOrder`.
 *
 * Higher-order: receives config, returns the actual comparator.
 */
const makeComparator = (
  field: SortField,
  order: SortOrder,
): ((a: Product, b: Product) => number) => {
  const dir = order === "asc" ? 1 : -1;

  return (a: Product, b: Product): number => {
    switch (field) {
      case "title":
        return dir * a.title.localeCompare(b.title);
      case "price":
        return dir * (a.price - b.price);
      case "rating":
        return dir * (a.rating - b.rating);
      default:
        return 0;
    }
  };
};

/**
 * Applies search → category filter → sort to the full product list.
 * Uses `filter` + `sort` (HOFs) — no manual loops.
 */
function applyFilters(products: Product[], f: FilterOptions): Product[] {
  const searchPredicate = makeSearchFilter(f.query);
  const categoryPredicate = makeCategoryFilter(f.category);

  return products
    .filter(searchPredicate)
    .filter(categoryPredicate)
    .sort(makeComparator(f.sortField, f.sortOrder));
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

/** Re-renders the list view into `#main-content` using current filters. */
function renderCurrentView(): void {
  const filtered = applyFilters(allProducts, filters);
  mainEl.innerHTML = renderListView(filtered, allCategories, filters);
  attachListEventListeners();
}

// ---------------------------------------------------------------------------
// Event listeners (Day 4)
// ---------------------------------------------------------------------------

/** Attaches event listeners to the toolbar controls inside #main-content. */
function attachListEventListeners(): void {
  // Search input — filter on every keystroke
  const searchInput = document.querySelector<HTMLInputElement>("#search-input");
  searchInput?.addEventListener("input", (e) => {
    filters = { ...filters, query: (e.target as HTMLInputElement).value };
    renderCurrentView();
    // Re-focus and restore cursor position after re-render
    const newInput = document.querySelector<HTMLInputElement>("#search-input");
    if (newInput) {
      newInput.focus();
      newInput.setSelectionRange(newInput.value.length, newInput.value.length);
    }
  });

  // Category dropdown
  const categorySelect = document.querySelector<HTMLSelectElement>("#filter-category");
  categorySelect?.addEventListener("change", (e) => {
    filters = { ...filters, category: (e.target as HTMLSelectElement).value };
    renderCurrentView();
  });

  // Sort field dropdown
  const sortFieldSelect = document.querySelector<HTMLSelectElement>("#sort-field");
  sortFieldSelect?.addEventListener("change", (e) => {
    filters = { ...filters, sortField: (e.target as HTMLSelectElement).value as SortField };
    renderCurrentView();
  });

  // Sort order toggle button
  const sortOrderBtn = document.querySelector<HTMLButtonElement>("#sort-order");
  sortOrderBtn?.addEventListener("click", () => {
    const nextOrder: SortOrder = filters.sortOrder === "asc" ? "desc" : "asc";
    filters = { ...filters, sortOrder: nextOrder };
    renderCurrentView();
  });

  // Product card clicks → detail view (placeholder — wired Day 5)
  const productCards = document.querySelectorAll<HTMLElement>(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.productId;
      if (id) {
        // Detail view navigation will be implemented on Day 5.
        // For now, just log the intent.
        console.info(`[DevDash] Navigate to product #${id} — detail view coming Day 5.`);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Bootstrap — load data with async/await (Day 3)
// ---------------------------------------------------------------------------

/**
 * Initialises the dashboard:
 *  1. Show loading spinner.
 *  2. Fetch products + categories in parallel (Promise.all via fetchDashboardData).
 *  3. On success → render list view with toolbar.
 *  4. On error  → render error state with retry button.
 */
async function init(): Promise<void> {
  // 1. Loading state
  mainEl.innerHTML = renderLoading();

  try {
    // 2. Fetch in parallel (Day 5 feature — wired early via api.ts helper)
    const [productResponse, categories] = await fetchDashboardData();

    // 3. Store in module state and render
    allProducts = productResponse.products;
    allCategories = categories;

    renderCurrentView();
  } catch (error) {
    // 4. Error state
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    mainEl.innerHTML = renderError(message);

    // Wire retry button
    const retryBtn = document.querySelector<HTMLButtonElement>("#btn-retry");
    retryBtn?.addEventListener("click", () => {
      init(); // re-run init on retry
    });
  }
}

// Kick-off
init();
