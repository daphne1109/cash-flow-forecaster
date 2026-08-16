# Guided money discovery

The first-run flow deliberately asks about familiar life events rather than
asking the user to arrive with a complete budget. A user can skip every prompt:
the goal is to create a useful starting forecast, not force false precision.

Each submitted answer becomes a normal `ForecastItem` with
`source: 'guided-estimate'`. The forecast engine treats it exactly like a
manually entered item; the source flag only keeps the estimate visible and
editable in later UI steps.

## Prompt sequence

1. Opening balance and forecast start date
2. Income
3. Groceries
4. Petrol or transport
5. One or more regular bills
6. One or more subscriptions
7. One other expected cost

The grocery and transport prompts expose weekly and biweekly recurrence. Bills
and subscriptions are limited to monthly recurrence, while the final expected
cost can be one-off, monthly, or yearly. These are intentionally constrained
to the recurrence rules the domain engine can calculate and test.

The bill question is recognition-first: users select multiple familiar category
chips - rent/room, utilities, phone/internet, insurance, education, health,
loan/credit, or other - then fill in the amount and next payment date for each
selection. No category adds a charge automatically. Every submitted category
becomes a separate monthly estimate so the eventual ledger can explain its
individual effect on the forecast.

Subscriptions remain a repeatable mini-list. After adding an answer, the form
clears while the saved item count remains visible; the user selects `Continue
when finished` only after entering as many relevant items as they want.
