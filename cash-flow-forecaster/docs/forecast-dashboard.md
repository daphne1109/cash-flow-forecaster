# Forecast dashboard

The dashboard calls `generateForecast` with the saved plan and renders its
result in three connected views: summary insights, the balance chart, and the
daily ledger. They all read the same derived object, so a chart value can be
checked against the exact transactions that produced it.

Users can add manual items, correct guided estimates, or remove an item. Every
change replaces the source plan, saves it through local storage, and triggers a
fresh calculation. The dashboard never edits derived daily rows directly.
