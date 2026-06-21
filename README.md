# DevDash — Typed Async Dashboard

> **Assignment:** AJT-LA-01 · **Duration:** 1 week (individual) · **Score:** 0–10

A **TypeScript** single-page dashboard that loads product data from [DummyJSON](https://dummyjson.com/), transforms it with higher-order functions, and displays it with search, filtering, sorting, and a detail view — all with strict type-safety and proper async error handling.

**Live demo:** _[link will be added after deployment]_

---

## Screenshots

> _Screenshots will be added after deployment._

---

## Features

### Pass Tier (0–6 pts)
- [x] Project compiles with `"strict": true` and no type errors
- [x] Domain data modelled with `interface` types (no `any` for fetched data)
- [x] Fetches and renders a product list using `async/await`
- [x] Functions and parameters are correctly type-annotated
- [x] `try/catch` error handling with a visible error state + retry button
- [x] Detail view shows a single product by id (with image gallery, specs, reviews)

### Good Tier (7–8 pts)
- [x] Search/filter/sort implemented with higher-order functions (`filter`, `sort`, `map`)
- [x] Reusable **generic** `fetchJson<T>` helper used across the app
- [x] `Promise.all` loads products + categories in parallel
- [x] Application state modelled with a **union/literal type** (idle/loading/success/error)

### Excellent Tier (9–10 pts)
- [x] **Discriminated union** drives state and is exhaustively narrowed (`narrowAsyncState`)
- [x] **Utility types** (`Partial`/`Pick`/`Omit`/`Record`) used meaningfully for DTOs and update payloads
- [x] **Generic class** `Cache<K extends string | number, V>` with a type constraint for API caching
- [x] **Debounce** (closure) applied to the search input for performance
- [x] **Memoize** (closure) utility available for pure function caching
- [x] Clean module architecture, reusable helpers, and this README with run instructions

---

## Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript (strict) | Type-safe application logic |
| Vite | Build tool & dev server |
| Fetch API + async/await | Data loading |
| DummyJSON API | Public REST data source |
| Vanilla CSS | Styling (dark theme, responsive) |

---

## Project Structure

```
├── index.html
├── package.json
├── tsconfig.json          # "strict": true
├── src/
│   ├── main.ts            # Entry point — bootstraps app, wires events
│   ├── types.ts           # Interfaces, unions, utility types for API data & state
│   ├── api.ts             # Generic fetchJson<T>, Cache<K,V>, endpoint functions
│   ├── state.ts           # App state (discriminated union), exhaustive narrowing
│   ├── ui.ts              # Pure render functions (list, detail, toolbar, states)
│   └── utils.ts           # Debounce, memoize (closures), formatting helpers
├── src/styles.css         # Design system — dark theme, cards, detail, responsive
└── README.md
```

---

## Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- npm (comes with Node.js)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/Nhun231/JSAT_ASSIGNMENTS_ANHBHN2.git
cd JSAT_ASSIGNMENTS_ANHBHN2

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will open at `http://localhost:5173` (or the next available port).

### Build for Production

```bash
npm run build
```
### Vercel link
https://jsat-assignments-anhbhn-2.vercel.app

The output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Key Technical Highlights

### Generic `fetchJson<T>` (api.ts)
```typescript
export async function fetchJson<T>(url: string): Promise<T> {
  // res.ok check → throws ApiError with HTTP status
  // try/catch wraps network + JSON parse failures
}
```

### Discriminated Union State (types.ts + state.ts)
```typescript
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

// Exhaustively narrowed via narrowAsyncState() — compiler enforces all branches
```

### Higher-Order Filter/Sort (main.ts)
```typescript
const makeSearchFilter = (query: string): ((p: Product) => boolean) => { ... };
const makeComparator = (field: SortField, order: SortOrder): ((a, b) => number) => { ... };

// Applied as: products.filter(searchPredicate).filter(categoryPredicate).sort(comparator)
```

### Debounce (utils.ts)
```typescript
export function debounce<A extends unknown[]>(fn: (...args: A) => void, delayMs: number) {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => { /* closure over timerId */ };
}
```

---

## API

This project uses the [DummyJSON](https://dummyjson.com/) public API:

| Endpoint | Usage |
|---|---|
| `GET /products?limit=0` | Fetch all products |
| `GET /products/:id` | Fetch single product (detail view) |
| `GET /products/categories` | Fetch category list (filter dropdown) |
| `GET /products/category/:slug` | Fetch products by category |

---

## License

This project is for educational purposes as part of the FPT Software Fresher Academy program.
