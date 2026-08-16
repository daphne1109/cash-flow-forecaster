# Cashflow

Cashflow is a local-first prototype that helps a student or early-career worker
turn rough answers about income, groceries, transport, bills, and subscriptions
into an editable 30-day cash forecast.

## Current milestone

Project foundation, forecast calculation, and local persistence are complete:
React, TypeScript, Vite, Vitest, and a production-build check are configured.
The pure domain layer validates inputs, expands recurring schedules, calculates
daily balances, and safely saves source data in browser local storage. The
guided setup interface is not yet built.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run build
```
