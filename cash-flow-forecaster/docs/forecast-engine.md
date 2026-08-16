# Forecast engine notes

The forecast engine remains a set of pure TypeScript functions separate from
React and browser storage. It will expand recurring items into dated
occurrences, aggregate each day's changes, and calculate a running balance.

## Current domain contract

`src/domain/types.ts` defines the item, settings, occurrence, daily-result,
and full-result contracts. It also validates real local calendar dates,
integer-cent amounts, allowed recurrence rules, and the prototype's 30-day
horizon.

`src/domain/date.ts` is the only module that parses or performs arithmetic on
date keys. It intentionally uses numeric local-date construction rather than
`new Date('YYYY-MM-DD')`, which can shift a date according to the user's
timezone. Month/year helpers reject impossible target dates rather than quietly
rolling them into a different month; the item validation rules make those cases
unreachable for recurring monthly/yearly items.

## Recurrence expansion

`src/domain/occurrences.ts` expands a source item into signed dated
occurrences inside an inclusive forecast window. Its first task is to
fast-forward backdated recurring items: a weekly item that starts in July still
produces all of its August dates. One-off items before the window produce no
occurrences. The forecast engine aggregates these occurrences by day.

## Daily forecast calculation

`src/domain/forecast.ts` groups occurrences by local calendar date, sums each
day's net change, and applies it to a running balance. Each generated row keeps
the original occurrences, allowing the ledger to explain a charted balance
rather than asking users to trust an opaque result. The summary deliberately
keeps the earliest date for a tied low balance and treats a negative opening
balance as negative on the forecast start date.

The model supports `once`, `weekly`, `biweekly`, `monthly`, and `yearly`
recurrence. `biweekly` is deliberate: it represents common groceries and
petrol habits from guided setup as an exact 14-day interval rather than an
unverified monthly estimate.
