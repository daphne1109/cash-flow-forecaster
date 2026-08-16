# Cashflow

Cashflow is a local-first prototype that helps a student or early-career worker
turn rough answers about income, groceries, transport, bills, and subscriptions
into an editable 30-day cash forecast.

## Current milestone

The guided money-discovery setup is now available. It turns rough answers about
income, groceries, transport, multiple bills, multiple subscriptions, and other expected costs
into editable source items marked `Estimated`. The pure domain layer validates
inputs, expands recurring schedules, calculates daily balances, and safely saves
source data in browser local storage. The dashboard is the next implementation
milestone.

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
