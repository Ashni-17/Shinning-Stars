# StockSense — Frontend

A React + Vite + Tailwind frontend for the StockSense Inventory Management System, matching the project's architecture (components, pages, services, context, routes, utils).

## What this is

A fully working frontend with realistic behavior — no backend required yet. It uses a small local data layer (`src/services/api.js`) backed by `localStorage` that simulates network latency and mimics what the real Express API in `/backend` will return. Every service file (`productService.js`, `receiptService.js`, etc.) is written so you can swap its internals for real `fetch`/`axios` calls once the backend is live, without touching any page or component.

Business logic is already implemented per the problem statement:
- **Receipts** increase stock at the destination warehouse on validation
- **Deliveries** decrease stock at the source warehouse on validation
- **Transfers** move stock between two locations (total unchanged)
- **Adjustments** reconcile recorded stock to a physical count
- Every movement is written to a stock ledger (`src/services/ledgerService.js`), shown on the **Move History** page

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. A demo account is pre-filled on the login screen — the `password123` login for `raghul@stocksense.io` — so you can just press **Sign in**. You can also create a new account from the Sign up screen; it's stored locally in your browser.

To reset all demo data back to the original seed, open your browser console and run:
```js
localStorage.removeItem("stocksense_db_v1");
localStorage.removeItem("stocksense_session");
```
then refresh.

## Build for production

```bash
npm run build
```

Outputs to `dist/`.

## Design

Dark "control tower" visual identity — graphite surfaces, a signal-amber accent (drawn from warehouse hazard signage), Barlow Condensed for headings/numbers and Inter for body/UI text. Status is shown with a colored dot rather than pill badges; KPI cards use a colored left border instead of a shadow.

## Notes on the original file tree

- `assets/logo.png` was replaced with an inline SVG crate mark (used in the sidebar, auth screens and favicon) so the app has no binary asset dependency — swap in a real logo file any time.
- A few files not in the original list were added because the structure needed them to actually work: `components/AppLayout.jsx` (combines Sidebar + Navbar + page outlet), `components/LineItemsEditor.jsx` (shared line-item table for Receipts/Deliveries/Transfers/Adjustments), `pages/auth/AuthLayout.jsx` (shared branded shell for the five auth screens), and `services/ledgerService.js` (the stock ledger read/write logic referenced by several services and the Move History page).
- `backend/` and `database/` from your original tree aren't included — this deliverable is the `frontend/` folder only, ready to point at your Express API when it's ready.
