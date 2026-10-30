# Graph Report - Budget Dashboard_ClaudeCode  (2026-10-06)

## Corpus Check
- Corpus is ~33,965 words - fits in a single context window. You may not need a graph.

## Summary
- 359 nodes · 708 edges · 24 communities (20 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.84)
- Token cost: 127,905 input · 0 output

## Community Hubs (Navigation)
- Sheets Access & API Routes
- Categories Page & Budget Charts
- Package & Tooling Config
- Budget & Category API Routes
- Auth Session & Login
- TypeScript Config
- Layout, NavBar & OAuth Origin
- Debt Tracker
- Product Vision & Capture Pipeline
- Recurring Scheduler
- Category Detail Page
- Recurring Forms & Confirmation Queue
- Design Spec: Core Modules
- Design Spec: Budgets & Sheet Layout
- README & Tech Stack
- Expense Log & Automation Design
- Architecture & Overview Plan
- OAuth Auth & Token Expiry
- Shared-Password Session Auth
- ESLint Config
- Next.js Config
- PostCSS Config
- Vercel Cron Config

## God Nodes (most connected - your core abstractions)
1. `next` - 27 edges
2. `getSpreadsheetId()` - 24 edges
3. `getSheetsClient()` - 23 edges
4. `vitest` - 16 edges
5. `compilerOptions` - 15 edges
6. `getTransactions()` - 14 edges
7. `getCategoryBudgets()` - 13 edges
8. `parseCurrency()` - 12 edges
9. `getRecurringItems()` - 10 edges
10. `getSelectedMonth()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Shared-password signed-cookie gate` --semantically_similar_to--> `Single shared dashboard password auth`  [INFERRED] [semantically similar]
  docs/superpowers/specs/2026-09-05-family-budget-dashboard-design.md → PRODUCT.md
- `Missing transactions to log (50 rows)` --semantically_similar_to--> `Bank auto-debit blind spot (no per-transaction alerts)`  [INFERRED] [semantically similar]
  September_Missing_Transactions.md → docs/superpowers/specs/2026-09-05-family-budget-dashboard-design.md
- `Expense Log tab (single transaction ledger)` --conceptually_related_to--> `Google Sheet data store (five tabs)`  [INFERRED]
  docs/superpowers/specs/2026-09-05-family-budget-dashboard-design.md → PRODUCT.md
- `Family Budget Dashboard README` --references--> `Family Budget Dashboard Implementation Plan`  [EXTRACTED]
  README.md → docs/superpowers/plans/2026-09-05-family-budget-dashboard.md
- `September missing transactions reconciliation report` --shares_data_with--> `Expense Log tab (single transaction ledger)`  [INFERRED]
  September_Missing_Transactions.md → docs/superpowers/specs/2026-09-05-family-budget-dashboard-design.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Recurring expense auto-log and confirmation flow** — docs_superpowers_plans_2026_09_05_family_budget_dashboard_recurring_module, docs_superpowers_plans_2026_09_05_family_budget_dashboard_scheduler_cron_route, docs_superpowers_plans_2026_09_05_family_budget_dashboard_confirmation_queue_ui, docs_superpowers_plans_2026_09_05_family_budget_dashboard_middleware_cron_bypass, docs_superpowers_specs_2026_09_05_family_budget_dashboard_design_auto_source_values [EXTRACTED 1.00]
- **Sheets data access layer (client, layout, parse, expense log)** — docs_superpowers_plans_2026_09_05_family_budget_dashboard_sheets_client, docs_superpowers_plans_2026_09_05_family_budget_dashboard_layout_constants, docs_superpowers_plans_2026_09_05_family_budget_dashboard_parse_utils, docs_superpowers_plans_2026_09_05_family_budget_dashboard_expense_log_repo [EXTRACTED 1.00]
- **Zero-effort expense capture pipeline (WhatsApp/MacroDroid to Claude to Sheet)** — product_zero_effort_capture_pipeline, product_whatsapp_apps_script, product_claude_haiku_parsing, product_google_sheet_five_tabs [EXTRACTED 1.00]

## Communities (24 total, 4 thin omitted)

### Community 0 - "Sheets Access & API Routes"
Cohesion: 0.08
Nodes (42): AnnualSummaryPage(), dynamic, MONTHS, POST(), POST(), GET(), POST(), register() (+34 more)

### Community 1 - "Categories Page & Budget Charts"
Cohesion: 0.08
Nodes (29): CategoriesPage(), dynamic, AddCategoryForm(), BudgetVsSpentChart(), Row, CategoryDonut(), PALETTE, CategoryRow() (+21 more)

### Community 2 - "Package & Tooling Config"
Cohesion: 0.05
Nodes (40): dependencies, googleapis, next, react, react-dom, recharts, devDependencies, eslint (+32 more)

### Community 3 - "Budget & Category API Routes"
Cohesion: 0.15
Nodes (16): PATCH(), POST(), addCategorySpy, PATCH(), addCategory(), insertAnnualSummaryRow(), insertCategoryRowAboveTotal(), insertMonthlyBudgetRow() (+8 more)

### Community 4 - "Auth Session & Login"
Cohesion: 0.19
Nodes (12): POST(), getHmacKey(), getSecret(), signSession(), toHex(), verifySession(), config, INDEPENDENTLY_AUTHENTICATED_PATHS (+4 more)

### Community 5 - "TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 6 - "Layout, NavBar & OAuth Origin"
Cohesion: 0.19
Nodes (11): GET(), GET(), links, NavBar(), jakarta, jetbrainsMono, metadata, RootLayout() (+3 more)

### Community 7 - "Debt Tracker"
Cohesion: 0.21
Nodes (8): AddDebtForm(), DebtCard(), DebtTrackerPage(), dynamic, Debt, estimatePayoffDate(), matchPayments(), carLoan

### Community 8 - "Product Vision & Capture Pipeline"
Cohesion: 0.16
Nodes (11): Fixed category list with load-bearing emoji, Claude Haiku free-text expense parsing, Google Sheet data store (five tabs), Status-color system (lib/statusColor.ts), WhatsApp / MacroDroid Google Apps Script (gitignored), ESG and NRA bank accounts, Already matched exactly (8), Excluded internal/household transfers (15) (+3 more)

### Community 9 - "Recurring Scheduler"
Cohesion: 0.21
Nodes (7): appendTransactionSpy, getRecurringItemsSpy, markLoggedSpy, computeDueRecurringLogs(), isSameDay(), advanceNextDueDate(), RecurringItem

### Community 10 - "Category Detail Page"
Cohesion: 0.29
Nodes (7): CategoryDetailPage(), CategoryTrendChart(), TransactionSearch(), getSelectedMonth(), Transaction, getSixMonthTrend(), monthKey()

### Community 11 - "Recurring Forms & Confirmation Queue"
Cohesion: 0.26
Nodes (6): ConfirmationQueue(), RecurringForm(), dynamic, groupByCategory(), RecurringPage(), getCategoryBudgets()

### Community 12 - "Design Spec: Core Modules"
Cohesion: 0.24
Nodes (9): Annual summary module and NavBar, Debts module (getDebts, addDebt, matchPayments, estimatePayoffDate), Expense log repository (getTransactions, confirmTransaction), getSixMonthTrend (lib/sheets/monthlyTrend.ts), Currency/date parsing (lib/sheets/parse.ts), Recurring module (getRecurringItems, advanceNextDueDate, markLogged), Recurring scheduler cron route (/api/recurring/scheduler), Debt Tracker page and keyword payment matching (+1 more)

### Community 13 - "Design Spec: Budgets & Sheet Layout"
Cohesion: 0.29
Nodes (6): Budgets repository (getCategoryBudgets, updateCategoryBudget), Sheet layout range constants (lib/sheets/layout.ts), Annual Summary tab, Categories page (sparkline, trend, search, add category), Monthly Budget tab (categories master list), discover-layout script

### Community 14 - "README & Tech Stack"
Cohesion: 0.38
Nodes (7): Family Budget Dashboard (product context), Recharts charts (bar, donut, sparkline), Dashboard features (overview, categories, debts, recurring, annual), Environment variables and OAuth credential setup, Family Budget Dashboard README, Tech stack (Next.js 14, Sheets API, Tailwind, Recharts, Vitest, Vercel), Vercel deployment and cron job

### Community 15 - "Expense Log & Automation Design"
Cohesion: 0.40
Nodes (6): Confirmation queue UI and confirm route, Source values Auto-Pending / Auto-Confirmed, Bank-sync aggregator (Plaid/Flinks) deferred, Expense Log tab (single transaction ledger), Recurring and Automation (daily scheduler + confirmation queue), Recurring Expenses and Subscriptions tab

### Community 16 - "Architecture & Overview Plan"
Cohesion: 0.40
Nodes (5): Family Budget Dashboard Implementation Plan, Architecture (Next.js, Sheets API, Vercel, server-side access), Optimistic writes with rollback and error toast, Overview page, Family Budget Dashboard Design Spec

### Community 17 - "OAuth Auth & Token Expiry"
Cohesion: 0.50
Nodes (3): Reconnect Google Sheets in-app OAuth flow (Task 18), Sheets client (lib/sheets/client.ts: getSheetsClient, getSpreadsheetId), /reconnect in-app OAuth refresh page

### Community 18 - "Shared-Password Session Auth"
Cohesion: 0.50
Nodes (3): Session auth (signSession, verifySession, middleware), Shared-password signed-cookie gate, Single shared dashboard password auth

### Community 19 - "ESLint Config"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

## Knowledge Gaps
- **102 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `dynamic`, `MONTHS`, `addCategorySpy` (+97 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 131 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Layout, NavBar & OAuth Origin` to `Sheets Access & API Routes`, `Categories Page & Budget Charts`, `Package & Tooling Config`, `Budget & Category API Routes`, `Auth Session & Login`, `Debt Tracker`, `Category Detail Page`, `Recurring Forms & Confirmation Queue`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `dynamic` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Sheets Access & API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.07782898105478751 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Auth Session & Login` to `Sheets Access & API Routes`, `Package & Tooling Config`, `Budget & Category API Routes`, `Debt Tracker`, `Recurring Scheduler`, `Category Detail Page`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Should `Categories Page & Budget Charts` be split into smaller, more focused modules?**
  _Cohesion score 0.08115942028985507 - nodes in this community are weakly interconnected._
- **Should `Package & Tooling Config` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `Budget & Category API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._