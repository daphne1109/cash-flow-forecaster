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
5. One or more day-to-day spending patterns
6. One or more regular bills
7. One or more subscriptions
8. One other expected cost

The grocery and transport prompts expose weekly and biweekly recurrence. The
day-to-day question recognises common variable routines - eating out, coffee,
food delivery, outings, shopping, personal care, gym/sports, hobbies, and an
other cost - and asks for a typical spend per occasion plus a realistic cadence.
Bills and subscriptions are limited to monthly recurrence, while the final
expected cost can be one-off, monthly, or yearly. These are intentionally
constrained to the recurrence rules the domain engine can calculate and test.

Every guided prompt has a Back control. A user who accidentally selects `Skip
for now` can return to the immediately preceding question without restarting
the flow or losing any previously added estimates.

The bill question is recognition-first: users select multiple familiar category
chips - rent/room, utilities, phone/internet, insurance, education, health,
loan/credit, or other - then fill in the amount and next payment date for each
selection. No category adds a charge automatically. Every submitted category
becomes a separate monthly estimate so the eventual ledger can explain its
individual effect on the forecast.

The subscription question uses the same recognition-first multi-select pattern.
It includes Spotify, YouTube Premium, Netflix, Disney+ Hotstar, Apple iCloud,
Google One, OneDrive, Dropbox, ChatGPT, Canva, Notion, Figma, Goodnotes,
Notability, Duolingo, Hostinger, GitHub, and an other-subscription option.
Selecting a service only opens its editable amount/date row; it never assumes a
price or creates a charge without the user's confirmation.

The day-to-day prompt follows the same recognition-first principle. It does not
ask the user to reconstruct every transaction or guess a monthly total. Each
selected routine becomes its own forecast item, preserving a clear explanation
of why repeated meals, coffee, outings, or other lifestyle spending affects the
30-day balance.
