# Product decisions

These product rules are frozen before implementation. Any change must update
the corresponding domain tests and README explanation.

- The app is a local-first, single-user, 30-day cash forecast.
- Guided prompts create editable `Estimated` items; they are not transaction
  categorisation or factual records of historical spending.
- The forecast operates on local calendar dates and integer cents.
- A negative opening balance makes the forecast negative on the start date.
- A recurring item that began before the forecast window still contributes its
  occurrences inside the window.
- Recurrence supports daily, weekly, fortnightly, monthly, yearly, and a
  user-confirmed custom interval of 2-365 days. The original first date anchors
  every interval, including after backdating fast-forward.
- No user account, bank connection, backend, notification, or financial advice
  is included in this challenge version.
