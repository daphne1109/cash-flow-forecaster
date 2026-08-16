# Forecast dashboard

The dashboard calls `generateForecast` with the saved plan and renders its
result in three connected views: summary insights, the balance chart, and the
daily ledger. They all read the same derived object, so a chart value can be
checked against the exact transactions that produced it.

Users can add manual items, correct guided estimates, or remove an item. Every
change replaces the source plan, saves it through local storage, and triggers a
fresh calculation. The dashboard never edits derived daily rows directly.

Adding or editing a scheduled item opens a focused modal dialog, so the item
list does not shift or disappear while the user is reviewing an existing plan.
The dialog has a labelled close control, supports Escape, and closes when its
backdrop is selected.

`Reset saved plan` asks for confirmation, clears only Cashflow's local-storage
key, and returns the user to the blank welcome screen. `Start a new plan` is
kept separate so users can explore a new setup without discarding their current
saved forecast until they explicitly reset it.

The low-balance row and first-shortfall row include text badges as well as
colour treatment, so a risk state does not rely on colour alone. The dashboard
also states the prototype boundary: data is stored only in the current browser
and the result is planning information, not financial advice.
