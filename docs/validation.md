# Validation guide

All checks run offline. No test calls Yahoo Finance, so results are deterministic.

## One command

```bash
npm ci               # first time, or after dependencies change
npm run validate     # lint -> typecheck -> tests + coverage thresholds -> production build
```

`validate` runs the same steps as the `Finance App CI` workflow. If it passes locally, CI should pass.

## Individual checks

| Command | What it checks |
|---|---|
| `npm run lint` | ESLint (TypeScript, React hooks rules) over `src/`, `server/`, `scripts/` |
| `npm run typecheck` | `tsc --noEmit` for client and server code |
| `npm test` | All unit, service, API and UI tests, once |
| `npm run test:watch` | Tests in watch mode while developing |
| `npm run test:coverage` | Tests plus coverage report; fails below the thresholds in `vite.config.ts` |
| `npm run build` | Typecheck, then the Vite production build into `dist/` |

Run one file with `npx vitest run src/domain/transform.test.ts`.

## What the tests cover

| Layer | File(s) |
|---|---|
| Data transformation (rebase to %, series alignment, gaps) | `src/domain/transform.test.ts` |
| Yahoo normalization (null closes, de-dup, latest session, missing price) | `server/yahoo/normalize.test.ts` |
| Yahoo error mapping | `server/yahoo/yahooClient.test.ts` |
| Input validation (symbols, window) | `server/validation.test.ts` |
| Cache (TTL, in-flight sharing, eviction, no failure caching) | `server/cache.test.ts` |
| HTTP API (status codes, partial failures, caching, no leaked errors) | `server/marketService.test.ts` |
| Client service (routes, typed errors, network failure) | `src/services/httpMarketDataService.test.ts` |
| UI components (quote card, tabs, chart card states, chart empty state) | `src/components/**/*.test.tsx` |
| Dashboard rendering path (cards, tab switching, partial data, errors, retry, loading) | `src/pages/DashboardPage.test.tsx` |

## What success looks like

- `npm run lint`: no output after the `eslint .` line, exit code 0.
- `npm run typecheck`: no output, exit code 0.
- `npm run test:coverage`: every test file passes, no skipped tests, and the coverage summary prints with no "threshold ... not met" error.
- `npm run build`: ends with `built in ...ms`, with no warnings.
- `npm run validate` exits 0.

## Manual check of the running app

```bash
npm run dev          # web on http://localhost:5173, API on http://localhost:3001
```

With `VITE_DATA_SOURCE=mock` (the default in `.env.example`) the dashboard works offline. Set `VITE_DATA_SOURCE=http` in `.env` for live Yahoo data.

Expected in the browser:

1. Five quote cards (IBM, Microsoft, Oracle, SAP, Salesforce) with price and change; losses red, gains green.
2. Three tabs: Current day, Last 7 days, Last quarter. Each shows a multi-line chart of % change with a legend.
3. Stopping the API while on `http` shows an error card with a Retry button; restarting it and clicking Retry recovers.

## Optional live check (not run in CI)

```bash
npm run smoke:live              # IBM,MSFT,ORCL,SAP,CRM
npm run smoke:live -- IBM,AAPL  # custom symbols
```

Success: a quote table, then one line per window (`day`, `week`, `quarter`) with a non-zero point count. Yahoo is unofficial and can throttle, so a failure here does not necessarily mean the code is broken.

## Known limits

- jsdom cannot lay out SVG, so chart rendering is tested through the data passed to the chart, plus a mount check. Verify line colors and tooltips manually.
- `createYahooSource` (the real `yahoo-finance2` wrapper) is covered only by `smoke:live`.
