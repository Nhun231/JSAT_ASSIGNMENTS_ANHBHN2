/**
 * main.ts — Entry point for DevDash.
 *
 * Day 3: Bootstrap app, load data with async/await, render list, handle errors.
 * Day 4: Wire search, category filter, and sort controls with higher-order functions.
 * Day 5: Detail view navigation, parallel loading with Promise.all.
 * Day 6: Debounced search, state management with discriminated unions.
 */

import "./styles.css";

import type { Product, FilterOptions, SortField, SortOrder } from "./types.ts";
import { fetchDashboardData, fetchProductById } from "./api.ts";
import {
  renderLoading,
  renderError,
  renderListView,
  renderDetailView,
} from "./ui.ts";
import {
  createAppState,
  narrowAsyncState,
  setProductsState,
  setCategoriesState,
  updateFilters,
  setView,
} from "./state.ts";
import { debounce } from "./utils.ts";

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const appEl = document.querySelector<HTMLDivElement>("#app");

if (!appEl) {
  throw new Error("Root element #app not found in index.html.");
}

// ---------------------------------------------------------------------------
// Application state (discriminated union — Excellent tier)
// ---------------------------------------------------------------------------

let appState = createAppState();

// ---------------------------------------------------------------------------
// Mount the page shell (header + empty main container)
// ---------------------------------------------------------------------------

appEl.innerHTML = `
  <header class="header">
    <div class="header__inner">
      <span class="header__logo" id="logo-link" style="cursor:pointer;">⚡ DevDash</span>
      <p class="header__subtitle">Typed Async Dashboard — AJT-LA-01</p>
    </div>
  </header>

  <main class="main" id="main-content"></main>
`;

const mainEl = document.querySelector<HTMLElement>("#main-content")!;

// Logo click → go back to list
document.querySelector("#logo-link")?.addEventListener("click", () => {
  if (appState.view === "detail") {
    appState = setView(appState, "list");
    renderCurrentView();
  }
});

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

  return [...products]
    .filter(searchPredicate)
    .filter(categoryPredicate)
    .sort(makeComparator(f.sortField, f.sortOrder));
}

// ---------------------------------------------------------------------------
// Render dispatcher — uses discriminated union narrowing
// ---------------------------------------------------------------------------

/** Renders the appropriate view based on current appState. */
function renderCurrentView(): void {
  if (appState.view === "list") {
    renderListPage();
  } else {
    renderDetailPage();
  }
}

/** Renders the list view using narrowAsyncState to handle all states. */
function renderListPage(): void {
  // Use exhaustive narrowing on the products async state
  const html = narrowAsyncState(appState.products, {
    idle: () => renderLoading(),
    loading: () => renderLoading(),
    success: (products) => {
      // Also narrow categories state
      return narrowAsyncState(appState.categories, {
        idle: () => renderLoading(),
        loading: () => renderLoading(),
        success: (categories) => {
          const filtered = applyFilters(products, appState.filters);
          return renderListView(filtered, categories, appState.filters);
        },
        error: (msg) => renderError(msg),
      });
    },
    error: (msg) => renderError(msg),
  });

  mainEl.innerHTML = html;
  attachListEventListeners();
}

/** Renders the detail page — fetches product by ID if needed. */
async function renderDetailPage(): Promise<void> {
  const productId = appState.selectedProductId;
  if (productId === null) {
    appState = setView(appState, "list");
    renderListPage();
    return;
  }

  // Show loading while fetching detail
  mainEl.innerHTML = renderLoading();

  try {
    const product = await fetchProductById(productId);
    mainEl.innerHTML = renderDetailView(product);
    attachDetailEventListeners(product);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load product details.";
    mainEl.innerHTML = renderError(message);

    // Wire retry for detail
    const retryBtn = document.querySelector<HTMLButtonElement>("#btn-retry");
    retryBtn?.addEventListener("click", () => renderDetailPage());
  }
}

// ---------------------------------------------------------------------------
// Debounced search (Day 6 — closure)
// ---------------------------------------------------------------------------

/**
 * Debounced handler for the search input.
 * Waits 250ms after the user stops typing before re-rendering.
 */
const debouncedSearch = debounce((value: string) => {
  appState = updateFilters(appState, { query: value });
  renderListPage();

  // Re-focus search input after re-render
  const newInput = document.querySelector<HTMLInputElement>("#search-input");
  if (newInput) {
    newInput.focus();
    newInput.setSelectionRange(newInput.value.length, newInput.value.length);
  }
}, 250);

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------

/** Attaches event listeners to the toolbar controls inside #main-content. */
function attachListEventListeners(): void {
  // Search input — debounced
  const searchInput = document.querySelector<HTMLInputElement>("#search-input");
  searchInput?.addEventListener("input", (e) => {
    debouncedSearch((e.target as HTMLInputElement).value);
  });

  // Category dropdown
  const categorySelect = document.querySelector<HTMLSelectElement>("#filter-category");
  categorySelect?.addEventListener("change", (e) => {
    appState = updateFilters(appState, {
      category: (e.target as HTMLSelectElement).value,
    });
    renderListPage();
  });

  // Sort field dropdown
  const sortFieldSelect = document.querySelector<HTMLSelectElement>("#sort-field");
  sortFieldSelect?.addEventListener("change", (e) => {
    appState = updateFilters(appState, {
      sortField: (e.target as HTMLSelectElement).value as SortField,
    });
    renderListPage();
  });

  // Sort order toggle button
  const sortOrderBtn = document.querySelector<HTMLButtonElement>("#sort-order");
  sortOrderBtn?.addEventListener("click", () => {
    const nextOrder: SortOrder = appState.filters.sortOrder === "asc" ? "desc" : "asc";
    appState = updateFilters(appState, { sortOrder: nextOrder });
    renderListPage();
  });

  // Product card clicks → navigate to detail view (Day 5)
  const productCards = document.querySelectorAll<HTMLElement>(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.productId;
      if (id) {
        appState = setView(appState, "detail", Number(id));
        renderCurrentView();
      }
    });
  });

  // Retry button (if error state is showing)
  const retryBtn = document.querySelector<HTMLButtonElement>("#btn-retry");
  retryBtn?.addEventListener("click", () => init());
}

/** Attaches event listeners for the detail view. */
function attachDetailEventListeners(product: Product): void {
  // Back button
  const backBtn = document.querySelector<HTMLButtonElement>("#btn-back");
  backBtn?.addEventListener("click", () => {
    appState = setView(appState, "list");
    renderCurrentView();
  });

  // Image gallery — click thumbnail to change main image
  const thumbnails = document.querySelectorAll<HTMLImageElement>(".detail__gallery-img");
  const mainImg = document.querySelector<HTMLImageElement>("#detail-main-img");

  thumbnails.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const index = Number(thumb.dataset.index);
      if (mainImg && product.images[index]) {
        mainImg.src = product.images[index];

        // Update active state
        thumbnails.forEach((t) => t.classList.remove("detail__gallery-img--active"));
        thumb.classList.add("detail__gallery-img--active");
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Bootstrap — load data with async/await + Promise.all
// ---------------------------------------------------------------------------

/**
 * Initialises the dashboard:
 *  1. Set state to loading.
 *  2. Fetch products + categories in parallel (Promise.all via fetchDashboardData).
 *  3. On success → update state and render list view.
 *  4. On error  → update state to error and render error view.
 */
async function init(): Promise<void> {
  // 1. Loading state
  appState = setProductsState(appState, { status: "loading" });
  appState = setCategoriesState(appState, { status: "loading" });
  renderCurrentView();

  try {
    // 2. Fetch in parallel with Promise.all (Feature 4)
    const [productResponse, categories] = await fetchDashboardData();

    // 3. Update state to success
    appState = setProductsState(appState, {
      status: "success",
      data: productResponse.products,
    });
    appState = setCategoriesState(appState, {
      status: "success",
      data: categories,
    });

    renderCurrentView();
  } catch (error) {
    // 4. Error state
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    appState = setProductsState(appState, { status: "error", message });
    renderCurrentView();
  }
}

// Kick-off
init();
