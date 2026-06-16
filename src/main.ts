/**
 * main.ts — Entry point for DevDash.
 * Bootstraps the app by mounting the root shell into #app.
 * Actual data loading wired in on Day 3.
 */

import "./styles.css";

const appEl = document.querySelector<HTMLDivElement>("#app");

if (!appEl) {
  throw new Error("Root element #app not found in index.html.");
}

appEl.innerHTML = `
  <header class="header">
    <div class="header__inner">
      <span class="header__logo">⚡ DevDash</span>
      <p class="header__subtitle">Typed Async Dashboard — AJT-LA-01</p>
    </div>
  </header>

  <main class="main" id="main-content">
    <p class="placeholder">
      Day 1 scaffolding complete.<br/>
      Data loading will be wired on Day 3.
    </p>
  </main>
`;
