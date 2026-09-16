# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two household members (a couple) who share household finances. Both check the dashboard to see current spending status and adjust monthly category budgets.

## Product Purpose

A family budget dashboard that shows monthly spending against budget by category, with minimal manual data entry. Success is both household members trusting the numbers enough to check it regularly and adjust budgets from it.

## Positioning

Unlike a spreadsheet or a generic budgeting app, expense capture is nearly zero-effort: transactions are logged automatically from WhatsApp messages (manual quick-text or voice/photo) and from bank push notifications relayed by a MacroDroid automation on Android, parsed and categorized by Claude, and written to a Google Sheet. The dashboard is purely the viewing/adjustment layer on top of that sheet — the differentiator is the capture pipeline feeding it, not the dashboard UI itself.

## Operating Context

- Data lives in a Google Sheet with five tabs: Expense Log, Monthly Budget (Categories), Annual Summary, Loans (Debt Tracker), Recurring Expenses.
- The Next.js app (`app/`) reads/writes that sheet via the Google Sheets API (OAuth2, `lib/sheets/*`).
- Expense capture happens outside the dashboard: a Google Apps Script (`Current_WhatsApp_App_Script.gs`, gitignored, contains live secrets) handles WhatsApp Cloud API webhooks and a MacroDroid/TD MySpend webhook, both parsing free text via Claude Haiku into `{amount, category, description, date}` and appending to the Expense Log.
- Currently run locally / not yet deployed to a public host both household members can reach from anywhere (Vercel vs. fly.dev was under discussion, paused).
- Fixed category list with emoji (🛒 Groceries, 🍽️ Dining Out, 🚗 Transport, 🏠 Housing, 💡 Utilities, 🎬 Entertainment, 👗 Clothing, 💊 Health, 📚 Education, ✈️ Travel, 💻 Tech, 🎁 Gifts, 📦 Other, 💳 Credit Cards, 💰 Income) — must stay in sync between the app and the Apps Script parser.

## Capabilities and Constraints

- Pages today: Overview (`app/page.tsx`), Categories list (`app/categories/page.tsx`), Category detail (`app/categories/[category]/page.tsx`), Recurring (`app/recurring/page.tsx`), plus a month selector used across pages.
- Status-color system (`lib/statusColor.ts`) mirrors the sheet's own Status column thresholds: >100% used = red, >85% = amber, >0% = green, else neutral. This logic is product truth and must be preserved by any redesign.
- Charts use Recharts (bar, pie/donut, line/sparkline) — no other charting library is in use.
- Auth is a single shared dashboard password (`DASHBOARD_PASSWORD`), not per-user accounts.
- Category emoji are load-bearing (used as the literal category key in the sheet and in Claude's parsing prompt), not just decoration — a redesign can restyle them but should not remove the emoji from the category identity.

## Evidence on Hand

- Live category list, status-color thresholds, and page structure are all in the current codebase (see paths above) — no invented content needed.
- No user research beyond the two household members' own direct feedback given during development (documented as prior session context, not a file).

## Product Principles

1. Zero-effort logging is the whole point — the UI must never make manual entry feel like the primary path, even though a couple of manual-entry affordances exist (Add Category, Add Debt).
2. Glanceable status over precision — both users check this casually and often; the UI should answer "are we OK this month?" before it answers "exactly how much did we spend?".
3. Two-user, no-account-boundary — there's no concept of "my spending" vs "their spending" in the data model; the UI should keep treating the household as one shared pool.
4. Small screen first in practice — both members are more likely to glance at this from a phone than sit at a desktop.

## Accessibility & Inclusion

No specific standard has been set by the user; treat standard WCAG 2.2 AA color-contrast and keyboard-navigation practice as the floor given this is a shared household tool, not a requirement communicated by the user.
