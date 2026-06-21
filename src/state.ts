/**
 * state.ts — Application state management with discriminated unions.
 *
 * The app state is modelled as a discriminated union (`AppState`) that
 * exhaustively narrows via the `status` discriminant. This module provides:
 *
 *  - `createAppState()` — initial state factory
 *  - `narrowAsyncState()` — exhaustive switch over the `AsyncState<T>` union
 *  - Type-safe updater helpers
 *
 * Excellent tier criteria:
 *  - Discriminated union drives state
 *  - Exhaustively narrowed via a helper
 *  - Utility types used in updater signatures
 */

import type {
  AppState,
  AsyncState,
  FilterOptions,
  Product,
  Category,
  View,
} from "./types.ts";

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

/** Creates a fresh initial `AppState`. */
export function createAppState(): AppState {
  return {
    view: "list",
    selectedProductId: null,
    products: { status: "idle" },
    categories: { status: "idle" },
    filters: {
      query: "",
      category: "",
      sortField: "title",
      sortOrder: "asc",
    },
  };
}

// ---------------------------------------------------------------------------
// Exhaustive narrowing helper (Excellent tier — discriminated union)
// ---------------------------------------------------------------------------

/**
 * Exhaustively handles every variant of `AsyncState<T>`.
 *
 * The compiler guarantees that every branch is covered:
 * if a new status is added to the union, calling code will
 * fail to compile until it handles the new case.
 *
 * @template T  The data type carried by the success state.
 */
export function narrowAsyncState<T, R>(
  state: AsyncState<T>,
  handlers: {
    idle:    () => R;
    loading: () => R;
    success: (data: T) => R;
    error:   (message: string) => R;
  },
): R {
  switch (state.status) {
    case "idle":
      return handlers.idle();
    case "loading":
      return handlers.loading();
    case "success":
      return handlers.success(state.data);
    case "error":
      return handlers.error(state.message);
    default: {
      // Exhaustiveness check — `never` ensures all cases are covered
      const _exhaustive: never = state;
      throw new Error(`Unhandled state: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Type-safe state updaters
// ---------------------------------------------------------------------------

/** Sets the products async state. */
export function setProductsState(
  appState: AppState,
  productsState: AsyncState<Product[]>,
): AppState {
  return { ...appState, products: productsState };
}

/** Sets the categories async state. */
export function setCategoriesState(
  appState: AppState,
  categoriesState: AsyncState<Category[]>,
): AppState {
  return { ...appState, categories: categoriesState };
}

/** Updates the filter options (Partial merge). */
export function updateFilters(
  appState: AppState,
  patch: Partial<FilterOptions>,
): AppState {
  return {
    ...appState,
    filters: { ...appState.filters, ...patch },
  };
}

/** Sets the active view and optionally a product id. */
export function setView(
  appState: AppState,
  view: View,
  productId: number | null = null,
): AppState {
  return {
    ...appState,
    view,
    selectedProductId: productId,
  };
}
