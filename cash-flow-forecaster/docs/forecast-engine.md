# Forecast engine notes

The forecast engine will remain a set of pure TypeScript functions separate
from React and browser storage. It will expand recurring items into dated
occurrences, aggregate each day's changes, and calculate a running balance.

The next implementation step defines the exact domain types and validation
rules before the interface is built.
