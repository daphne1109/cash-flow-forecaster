# Cashflow

Cashflow is a local-first prototype that helps a student or early-career worker
turn rough answers about income, groceries, transport, bills, and subscriptions
into an editable 30-day cash forecast.

## Current milestone

Project foundation and recurrence expansion are complete: React, TypeScript,
Vite, Vitest, and a production-build check are configured. The pure domain
layer validates forecast items/settings and expands one-off, weekly, biweekly,
monthly, and yearly items into dated occurrences. Forecast aggregation and the
guided setup interface are not yet built.

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
