<!-- Copilot / AI contributor instructions for crypto-portfolio-dashboard -->

# Quick operational commands

- Install: `npm install`
- Dev server: `npm run dev` (Vite) — default: http://localhost:3000
- Build: `npm run build` (output: `dist/`)
- Preview production: `npm run preview`
- Lint: `npm run lint`

# Big picture

- Single page React app using Vite. Entry: `src/main.jsx` -> `src/App.jsx`.
- UI components: `src/components/` (presentational and small containers).
- Services: `src/services/` (singleton instances, single responsibility; e.g., `cryptoApi.js`, `alertService.js`, `capitalBuildingDb.js`).
- Utilities: `src/utils/portfolioCalculations.js` (pure functions for allocations, volatility, formatting).
- Configuration: `src/types/portfolio.js` (all portfolio assets, categories, and alert enums).
- Styling: Tailwind CSS with project tokens in `tailwind.config.js`.

# Practical conventions & notes (use these exactly)

- Patterns:
  - Services are exported as singletons: `export default new Service()` — call methods on the instance.
  - UI follows prop-driven components. Keep state at the top (`App.jsx`) unless you introduce zustand (already included as a dependency).
  - Use existing utilities for formatting and calculations to maintain consistent UX (e.g., `formatCurrency`, `calculateAllocations`).

- API and caching:
  - `src/services/cryptoApi.js` wraps CoinGecko. It maps symbols to CoinGecko IDs in `COIN_ID_MAP` and caches for 60s (`cacheTimeout`).
  - Add new coins by updating `COIN_ID_MAP` and `PORTFOLIO_CONFIG` (see "How to add a new asset" below).

- Alerts:
  - `src/services/alertService.js` contains all alert logic and thresholds in `this.alertConfig`.
  - Use `alertService.runAllChecks(holdings, prices, historicalData, portfolioHistory)` to evaluate and persist alerts.

- Persistence:
  - `src/services/capitalBuildingDb.js` is an IndexedDB wrapper with CRUD helpers. Call its methods directly; the DB object is created when `init()` completes.
  - The DB contains stores for `earnings`, `trades`, `miners`, `projections`, `tasks`, and `settings`.
  - Use `capitalBuildingDb.addEarning`, `getEarningsByDate`, `getEarningsByDateRange` for Daily Earnings workflows.
  - For conversions, use `src/services/conversionService.js` (`convertToUSDT(token, amount)`), which uses CoinGecko and caches prices for 60s.
    - Trades: `capitalBuildingDb.addTrade`, `getTradesByDateRange`, and `getTradePerformance` are available for trade management and analytics.

# Concrete examples (copy/paste safe)

Add a new asset `ABC`:
1. In `src/types/portfolio.js` add `ABC: { symbol: 'ABC', name: 'ABC Token', category: ..., targetAllocation: 0.02, type: ..., risk: ... }`.
2. In `src/services/cryptoApi.js` add mapping `ABC: 'abc-token'` to `COIN_ID_MAP`.
3. Add to `holdings` in `src/App.jsx` (or add a UI to manage holdings).
4. Verify allocations (uses `calculateAllocations`) and charts (historical via `cryptoApi.getHistoricalData('ABC', days)`).

Add or change an alert threshold:
- Edit `this.alertConfig` in `src/services/alertService.js` to tune thresholds (e.g., `priceMovement.threshold10`).

# Developer workflows

- For quick tests, edit hard-coded `holdings` in `src/App.jsx` — the app reads this on mount and on manual refresh.
- To simulate historical data for charts, call `cryptoApi.getHistoricalData(symbol, days)` and feed the returned array to chart components.
- When adding UI components:
  - Create a new file under `src/components/`.
  - Export as default and import into `App.jsx` for integration.

# Pitfalls & gotchas

- Be defensive: `cryptoApi` may return empty objects on failure — guard against missing `.price` or `.change24h`.
- CoinGecko IDs must match exactly; missing IDs cause missing prices. Check `COIN_ID_MAP`.
- IndexedDB operations are async — ensure `capitalBuildingDb.init()` is called (or awaited) before using.

# If you're unsure

- Look at `src/App.jsx` to understand the main data flow: holdings -> cryptoApi -> prices -> allocations -> alerts -> UI.
- If you add persistent features, prefer `capitalBuildingDb` stores (earnings, trades, tasks) and add indexes there.

---

If anything in these notes is unclear or you want more examples (e.g., a sample PR adding a coin or a new chart), tell me which area to expand and I'll add a short code example or a suggested patch. ✅
