# Family Budget Dashboard — Design Spec

Date: 2026-09-05
Status: Approved by user, pending final spec review

## 1. Problem & Goals

The household expense log lives in a Google Sheet (`Budget_GoogleSheets`), fed primarily
by sending messages to a WhatsApp Business chat that appends rows to the sheet. A
reference dashboard already exists at https://salgadorojas-budget-dashboard.fly.dev/
reading from this same sheet, and demonstrates most of the desired UX.

Goals for this project:

1. Build a private, dynamic web dashboard that visualizes the family's finances from
   the Google Sheet, matching and improving on the reference dashboard's
   functionality.
2. Support creating new spending categories from the dashboard, not just the ones
   currently in the sheet.
3. Add a **Debt Tracker** for loans (car loan, mortgage, etc.) showing balance, payment
   history, and payoff progress.
4. Add a **Categories** view with per-category budget/spent, a 6-month spending trend,
   and a transaction search.
5. Address a real pain point in the data pipeline: some expenses are automatic bank
   debits (TD Bank, Scotiabank — mortgage/rent, car loan, insurance, subscriptions).
   Neither bank sends per-transaction email/SMS alerts, so these charges currently go
   unlogged until someone manually checks the bank app. The dashboard should close
   this gap without requiring paid bank-aggregation services (at least initially).

## 2. Source Data

Google Sheet: `Budget_GoogleSheets`
(id `1YnakUPPz3VVryO3XuJBaiJGNLf5KrVA9ly6UqQ3ePbw`)

A development copy has been made for building/testing without touching the file the
live fly.dev dashboard depends on:
`Budget_GoogleSheets (DEV COPY - dashboard testing)`
(id `1VG3OvZqQA0yzFIsG11KVbHsLqkWeQpg9cl1wsFwTu6M`)

All development and testing in this project targets the dev copy. The production
deployment is repointed at the original sheet only after the write-back paths
(add category, add loan, auto-log recurring expense, edit budget) have been verified
safe against the copy.

Existing tabs (as of this writing):

- **Expense Log** — `Date, Amount, Category, Description, Source, Month, Year`.
  `Source` is already one of `WhatsApp`, `Manual`, or `Bank`. This is the single
  transaction ledger everything else derives from.
- **Monthly Budget** — `Category, Budget ($), Spent ($), Remaining ($), % Used, Status`,
  with a month selector cell. This is the master list of categories and doubles as
  the per-month budget tracker. Category names embed an emoji (e.g. `🛒 Groceries`).
- **Annual Summary** — `Category` rows × `Jan..Dec` + `TOTAL` columns, spend per
  category per month.
- **Debt Tracker** — `Name, Principal, CurrentBalance, Payment, Frequency, StartDate,
  Rate, Keyword`. Currently has headers only, no data rows. `Keyword` is clearly
  intended to match against `Expense Log` descriptions (mirrors how the reference
  dashboard auto-detects loan payments).
- **Recurring Expenses and Subscriptions** — exists but full structure wasn't fully
  read during design; will be inspected directly when implementation starts, and
  extended with the columns in section 5.3 if not already present.

## 3. Architecture

- **Next.js (App Router) + TypeScript**, deployed on **Vercel**.
- **Google Sheets API v4** via a service account. The dev copy (and later the
  original sheet) is shared with the service account's email with Editor access.
- All Sheets access goes through server-side route handlers / server actions — the
  service account key never reaches the client.
- Reads are cached briefly (~30-60s, in-memory or `fetch` revalidate) — this is a
  personal dashboard, not a real-time system.
- Writes (add category, add loan, edit budget, confirm a recurring expense) go
  through dedicated route handlers that append/update specific rows via the Sheets
  API, with optimistic UI updates on the client and rollback on failure.
- **Auth**: a single shared-password gate — middleware checks a signed cookie set
  after the household password is submitted on a login page. No per-user accounts.

## 4. Pages & Features

### 4.1 Overview
- Tiles: Total Spent, Remaining, Income, Net Savings, Over-Budget count.
- Income vs. Expenses bar, "Where Money Is Going" donut, "Budget vs Spent" bar chart
  per category (clicking a bar jumps to that category's detail view).
- Month navigator (prev/next).
- New: a **pending confirmations** badge/tile when auto-logged recurring expenses
  (section 5) are awaiting confirmation.

### 4.2 Categories
- Sortable list: sheet order, most spent, over budget, A–Z.
- Per row: Spent, Budget (inline editable), % Used, a 6-month sparkline.
- Click a category to expand: Spent/Budget/Remaining tiles, a full 6-month line
  chart, a transaction search/filter box, and the filtered transaction list
  (with inline edit/delete).
- **"+ Add category"**: name, emoji, starting budget. Appends a row to `Monthly
  Budget` (new category, budget as given, $0 spent) and a matching row to
  `Annual Summary` (blank months).

### 4.3 Debt Tracker
- Card per debt: name, current balance, a payoff progress bar (paid vs. principal),
  payment amount/frequency, a projected payoff date estimated from balance, payment,
  and rate.
- Payment history per debt: `Expense Log` rows whose `Description` contains the
  debt's `Keyword` (case-insensitive substring match), newest first.
- **"+ Add loan"** form matching the sheet's columns: Name, Principal,
  CurrentBalance, Payment, Frequency, StartDate, Rate, Keyword. Appends a row to
  `Debt Tracker`.

### 4.4 Recurring & Automation (new)
This is the fix for the bank-auto-debit blind spot.

- List of recurring items (rent/mortgage, car loan, insurance, subscriptions) each
  with an expected amount, frequency, and next due date.
- A daily scheduled job (Vercel Cron calling an API route) checks every recurring
  item with auto-logging enabled: if its `NextDueDate` has arrived, it appends a row
  to `Expense Log` (`Source = "Auto-Pending"`) using the expected amount and
  category, then advances `NextDueDate` by the item's frequency.
- Auto-logged rows count toward budgets/categories immediately (so nothing is
  silently missed), but surface in a **confirmation queue** in the UI. Confirming a
  row lets you correct the amount if the real debit differed, and flips
  `Source` to `Auto-Confirmed`.
- **"+ Add recurring expense"** form: Name, Category, ExpectedAmount, Frequency,
  NextDueDate, AutoLogEnabled toggle.
- Explicitly out of scope for now: pulling variable/one-off bank debits
  automatically. That requires a bank-sync aggregator (Plaid or Flinks both support
  TD and Scotiabank) and was deferred — the data model here doesn't preclude adding
  it later, but no code for it is built in this pass.

### 4.5 Annual Summary
- Presentational: category × month table read from the existing `Annual Summary`
  tab.

## 5. Data Model Additions

### 5.1 `Monthly Budget` — no structural change
Continues to be the categories master list; new categories are appended here.

### 5.2 `Debt Tracker` — no structural change
Columns already fit; rows get added via the UI.

### 5.3 `Recurring Expenses and Subscriptions` — add if missing
- `NextDueDate` (date)
- `ExpectedAmount` (currency)
- `Frequency` (Weekly / Biweekly / Monthly / Annually)
- `AutoLogEnabled` (boolean)
- `LastLoggedDate` (date, set by the scheduler)

### 5.4 `Expense Log` — no column changes
`Source` gains two new values used only by the scheduler/confirmation flow:
`Auto-Pending` and `Auto-Confirmed`. Existing values (`WhatsApp`, `Manual`, `Bank`)
are untouched.

## 6. Error Handling

- If the Sheets API is unreachable, the UI shows a "data may be stale" banner
  instead of failing hard, and retries on next poll.
- Writes are optimistic client-side with rollback + a visible error toast on
  failure; no silent failures.
- Currency values from the sheet may contain thousands separators (e.g. `3,200.00`)
  — all numeric parsing must strip separators before converting.

## 7. Testing Plan

- Unit tests for the Sheets-parsing layer (currency/date parsing, keyword matching
  for debts, recurring-schedule advancement logic).
- Manual end-to-end pass against the **dev copy** sheet for every write path (add
  category, add loan, add recurring expense, confirm a pending auto-log, edit a
  budget) before pointing at the original sheet.
- Visual check in the browser (per project convention) for each page before calling
  the UI work done.

## 8. Deployment

- Vercel project connected to a GitHub repo for this codebase.
- Environment variables: Google service-account credentials (JSON, base64 or split
  into env vars), the target spreadsheet ID (dev copy during build, swapped to the
  original once verified), and the shared dashboard password (hashed).
- Vercel Cron configured for the daily recurring-expense scheduler job.

## 9. Explicitly Out of Scope (for this pass)

- Bank-sync aggregator integration (Plaid/Flinks) for automatic import of variable,
  non-recurring bank debits — noted as a future phase in section 4.4.
- Multi-user accounts / per-user permissions — single shared password only.
- Mobile app — responsive web only.
