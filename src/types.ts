/**
 * types.ts — All TypeScript interfaces and union types for DevDash.
 *
 * Data source: DummyJSON (https://dummyjson.com/)
 * - Products list:  GET /products
 * - Single product: GET /products/:id
 * - Categories:     GET /products/categories
 */

// ---------------------------------------------------------------------------
// Product — matches the shape returned by DummyJSON /products endpoints
// ---------------------------------------------------------------------------

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;       // ISO date string
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductMeta {
  createdAt: string;  // ISO date string
  updatedAt: string;  // ISO date string
  barcode: string;
  qrCode: string;
}

/** Full product model as returned by GET /products/:id */
export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: ProductMeta;
  images: string[];
  thumbnail: string;
}

/** Paginated list wrapper returned by GET /products */
export interface ProductListResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Category — DummyJSON /products/categories returns an array of these
// ---------------------------------------------------------------------------

export interface Category {
  slug: string;
  name: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Utility / DTO types (using TypeScript utility types — Excellent tier)
// ---------------------------------------------------------------------------

/** Card-display subset of a product — only what the list view needs */
export type ProductCard = Pick<
  Product,
  "id" | "title" | "category" | "price" | "rating" | "thumbnail" | "brand" | "stock" | "discountPercentage"
>;

/** Update payload — all fields optional except id */
export type ProductUpdate = Partial<Omit<Product, "id">> & Pick<Product, "id">;

/** A record mapping category slugs to their display name */
export type CategoryMap = Record<string, string>;

// ---------------------------------------------------------------------------
// Sort / Filter options
// ---------------------------------------------------------------------------

export type SortField = "title" | "price" | "rating";
export type SortOrder = "asc" | "desc";

export interface FilterOptions {
  query: string;
  category: string;   // empty string = all
  sortField: SortField;
  sortOrder: SortOrder;
}

// ---------------------------------------------------------------------------
// Application State — discriminated union (Excellent tier)
// ---------------------------------------------------------------------------

/** Initial state before any fetch */
export interface IdleState {
  status: "idle";
}

/** Fetch is in progress */
export interface LoadingState {
  status: "loading";
}

/** Fetch succeeded */
export interface SuccessState<T> {
  status: "success";
  data: T;
}

/** Fetch or rendering failed */
export interface ErrorState {
  status: "error";
  message: string;
}

/** Union of all possible app states for a given resource */
export type AsyncState<T> =
  | IdleState
  | LoadingState
  | SuccessState<T>
  | ErrorState;

// ---------------------------------------------------------------------------
// Overall dashboard app state
// ---------------------------------------------------------------------------

export type View = "list" | "detail";

export interface AppState {
  view: View;
  selectedProductId: number | null;
  products: AsyncState<Product[]>;
  categories: AsyncState<Category[]>;
  filters: FilterOptions;
}
