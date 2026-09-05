# Family Budget Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private Next.js dashboard that reads/writes `Budget_GoogleSheets` to visualize spending, manage categories and debts, and auto-log known recurring bank auto-debits so they're never missed.

**Architecture:** Next.js (App Router, TypeScript) deployed on Vercel; all Google Sheets access goes through a server-side `lib/sheets/*` layer backed by a service account; a single shared-password cookie gates the whole app; a daily cron route auto-appends due recurring expenses.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Vitest (unit tests), `googleapis` (Sheets API v4), Recharts (charts), Vercel (hosting + Cron).

**Spec:** [docs/superpowers/specs/2026-09-05-family-budget-dashboard-design.md](../specs/2026-09-05-family-budget-dashboard-design.md)

## Global Constraints

- All development and testing targets the **dev copy** spreadsheet (`Budget_GoogleSheets (DEV COPY - dashboard testing)`, id `1VG3OvZqQA0yzFIsG11KVbHsLqkWeQpg9cl1wsFwTu6M`). The original sheet (id `1YnakUPPz3VVryO3XuJBaiJGNLf5KrVA9ly6UqQ3ePbw`) is never written to until every write path is verified against the copy.
- Currency values in the sheet may contain thousands separators (e.g. `3,200.00`) — all numeric parsing must strip separators before converting (spec §6).
- Auto-logged recurring rows use `Source` values `Auto-Pending` and `Auto-Confirmed`; existing values `WhatsApp`, `Manual`, `Bank` are never modified (spec §5.4).
- Sheets writes must be optimistic on the client with rollback + a visible error on failure — no silent write failures (spec §6).
- No bank-sync aggregator (Plaid/Flinks) integration in this plan — explicitly deferred (spec §9).
- No per-user accounts — a single shared password only (spec §9).

---

## Setup Prerequisites (before Task 2)

These require actions in the Google Cloud Console that no tool available to the
implementer can perform — a human must do them once, before any task that talks to
the live Sheets API can be run or verified.

1. In Google Cloud Console, create (or reuse) a project, enable the **Google Sheets
   API**, and create a **Service Account**. Generate a JSON key for it.
2. Share the dev copy spreadsheet
   (`https://docs.google.com/spreadsheets/d/1VG3OvZqQA0yzFIsG11KVbHsLqkWeQpg9cl1wsFwTu6M/edit`)
   with the service account's email address, with **Editor** access.
3. Create `.env.local` in the project root (never commit this file) with:
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=<from the JSON key's "client_email">
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="<from the JSON key's "private_key", keep the \n escapes literal>"
   GOOGLE_SPREADSHEET_ID=1VG3OvZqQA0yzFIsG11KVbHsLqkWeQpg9cl1wsFwTu6M
   SESSION_SECRET=<any long random string>
   DASHBOARD_PASSWORD=<the shared household password, plain text is fine for .env.local>
   ```
4. Add `.env.local` to `.gitignore` (Task 1 does this).

If any task from Task 3 onward cannot find these env vars, stop and ask the user to
complete this section rather than guessing or hardcoding credentials.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `vitest.config.ts`

**Interfaces:**
- Produces: a running Next.js dev server on `http://localhost:3000`, `npm test` running Vitest, Tailwind classes available in any `.tsx`.

- [ ] **Step 1: Scaffold the app**

Run:
```bash
npx create-next-app@14 . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```
Accept defaults for any remaining prompts.

- [ ] **Step 2: Add Vitest**

Run:
```bash
npm install -D vitest @vitejs/plugin-react
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'node' },
});
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 3: Add `.env.local` to `.gitignore`**

Confirm `.gitignore` (created by `create-next-app`) already ignores `.env*.local`; if not, append it.

- [ ] **Step 4: Verify the scaffold**

Run: `npm run dev` and confirm `http://localhost:3000` loads the default page in the
browser tool. Run: `npm test` and confirm it reports "no tests found" without
erroring (proves the Vitest config itself is valid).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind and Vitest"
```

---

### Task 2: Sheets API Client

**Files:**
- Create: `lib/sheets/client.ts`
- Test: `lib/sheets/client.test.ts`

**Interfaces:**
- Produces: `getSheetsClient(): Promise<sheets_v4.Sheets>`, `getSpreadsheetId(): string` — every later `lib/sheets/*` module calls these two.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/sheets/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('getSpreadsheetId', () => {
  beforeEach(() => {
    process.env.GOOGLE_SPREADSHEET_ID = 'test-sheet-id';
  });

  it('reads the spreadsheet id from env', async () => {
    const { getSpreadsheetId } = await import('./client');
    expect(getSpreadsheetId()).toBe('test-sheet-id');
  });

  it('throws a clear error when the env var is missing', async () => {
    delete process.env.GOOGLE_SPREADSHEET_ID;
    vi.resetModules();
    const { getSpreadsheetId } = await import('./client');
    expect(() => getSpreadsheetId()).toThrow('GOOGLE_SPREADSHEET_ID is not set');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sheets/client.test.ts`
Expected: FAIL — `./client` does not exist yet.

- [ ] **Step 3: Install googleapis and implement**

Run: `npm install googleapis`

```typescript
// lib/sheets/client.ts
import { google, sheets_v4 } from 'googleapis';

let cachedClient: sheets_v4.Sheets | null = null;

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) throw new Error('GOOGLE_SPREADSHEET_ID is not set');
  return id;
}

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL is not set');
  if (!privateKey) throw new Error('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is not set');

  const auth = new google.auth.JWT({
    email,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/sheets/client.test.ts`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add lib/sheets/client.ts lib/sheets/client.test.ts package.json package-lock.json
git commit -m "feat: add Google Sheets API client"
```

---

### Task 3: Discover and Lock In the Sheet Layout

This is the task that resolves whether Monthly Budget/Annual Summary/Debt
Tracker/Recurring Expenses are separate tabs or stacked regions within one tab, and
records the exact ranges every later task reads/writes. **Requires the Setup
Prerequisites above to be complete.**

**Files:**
- Create: `scripts/discover-layout.ts`, `lib/sheets/layout.ts`

**Interfaces:**
- Produces: named constants (`EXPENSE_LOG_RANGE`, `BUDGET_RANGE`, `ANNUAL_SUMMARY_RANGE`, `DEBT_TRACKER_RANGE`, `RECURRING_RANGE`, each a string like `'Expense Log'!A1:G1000` or `'Dashboard'!A15:F40`) that every subsequent `lib/sheets/*` module imports instead of hardcoding ranges.

- [ ] **Step 1: Write the discovery script**

```typescript
// scripts/discover-layout.ts
import { getSheetsClient, getSpreadsheetId } from '../lib/sheets/client';

async function main() {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const tabs = meta.data.sheets ?? [];

  for (const tab of tabs) {
    const title = tab.properties?.title ?? '(untitled)';
    const rowCount = tab.properties?.gridProperties?.rowCount ?? 0;
    console.log(`\n=== Tab: "${title}" (rows: ${rowCount}) ===`);

    const values = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${title}'!A1:N${Math.min(rowCount, 60)}`,
    });

    (values.data.values ?? []).forEach((row, i) => {
      if (row.some((cell) => String(cell).trim().length > 0)) {
        console.log(`row ${i + 1}:`, row);
      }
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Add to `package.json` scripts: `"discover-layout": "tsx scripts/discover-layout.ts"`.
Run: `npm install -D tsx`.

- [ ] **Step 2: Run it against the dev copy**

Run: `npm run discover-layout`

Read the output. For each of the five logical sections (Expense Log, Monthly
Budget/Categories, Annual Summary, Debt Tracker, Recurring Expenses and
Subscriptions), note the exact tab title it appears under and the first/last row
number of its header + data region.

- [ ] **Step 3: Write `lib/sheets/layout.ts` from the observed output**

```typescript
// lib/sheets/layout.ts
// Populated from `npm run discover-layout` output against the dev copy sheet.
// Update these constants (not the code that uses them) if the sheet is restructured.

export const EXPENSE_LOG_RANGE = "'Expense Log'!A2:G5000";
export const EXPENSE_LOG_HEADER_ROW = 1;

export const BUDGET_RANGE = "'Expense Log'!A2:G5000"; // REPLACE with the actual tab/range found in Step 2
export const ANNUAL_SUMMARY_RANGE = "'Expense Log'!A2:G5000"; // REPLACE with the actual tab/range found in Step 2
export const DEBT_TRACKER_RANGE = "'Expense Log'!A2:G5000"; // REPLACE with the actual tab/range found in Step 2
export const RECURRING_RANGE = "'Expense Log'!A2:G5000"; // REPLACE with the actual tab/range found in Step 2
```

Replace every `REPLACE with...` placeholder with the real range string derived from
Step 2's output before moving on — this file must not be committed with placeholder
values in it.

- [ ] **Step 4: Verify by reading back**

Write a throwaway snippet (or extend the discovery script temporarily) that calls
`sheets.spreadsheets.values.get` with each constant from `lib/sheets/layout.ts` and
prints the first 3 rows. Confirm each range returns the expected section's header
row (e.g. `DEBT_TRACKER_RANGE` returns a row starting with `Name, Principal,
CurrentBalance, ...`).

- [ ] **Step 5: Commit**

```bash
git add scripts/discover-layout.ts lib/sheets/layout.ts package.json package-lock.json
git commit -m "feat: discover and lock in Google Sheet tab/range layout"
```

---

### Task 4: Currency and Date Parsing Utilities

**Files:**
- Create: `lib/sheets/parse.ts`
- Test: `lib/sheets/parse.test.ts`

**Interfaces:**
- Produces: `parseCurrency(raw: string): number`, `formatCurrency(value: number): string`, `parseSheetDate(raw: string): Date`.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/sheets/parse.test.ts
import { describe, it, expect } from 'vitest';
import { parseCurrency, formatCurrency, parseSheetDate } from './parse';

describe('parseCurrency', () => {
  it('parses plain numbers', () => {
    expect(parseCurrency('42.50')).toBe(42.5);
  });
  it('strips thousands separators', () => {
    expect(parseCurrency('3,200.00')).toBe(3200);
  });
  it('strips a leading dollar sign', () => {
    expect(parseCurrency('$1,500.00')).toBe(1500);
  });
  it('treats a blank cell as zero', () => {
    expect(parseCurrency('')).toBe(0);
    expect(parseCurrency('-')).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats with two decimals and a dollar sign', () => {
    expect(formatCurrency(1500)).toBe('$1,500.00');
  });
});

describe('parseSheetDate', () => {
  it('parses an ISO date string', () => {
    const d = parseSheetDate('2026-04-15');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(3); // 0-indexed
    expect(d.getUTCDate()).toBe(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sheets/parse.test.ts`
Expected: FAIL — `./parse` does not exist.

- [ ] **Step 3: Implement**

```typescript
// lib/sheets/parse.ts
export function parseCurrency(raw: string | number | undefined | null): number {
  if (raw === undefined || raw === null) return 0;
  if (typeof raw === 'number') return raw;
  const cleaned = raw.replace(/[$,]/g, '').trim();
  if (cleaned === '' || cleaned === '-') return 0;
  const value = Number.parseFloat(cleaned);
  return Number.isNaN(value) ? 0 : value;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function parseSheetDate(raw: string): Date {
  // Sheet dates are stored as "YYYY-MM-DD"; parse as UTC to avoid local-timezone
  // off-by-one-day shifts.
  const [year, month, day] = raw.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/sheets/parse.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/sheets/parse.ts lib/sheets/parse.test.ts
git commit -m "feat: add currency and date parsing utilities"
```

---

### Task 5: Expense Log Repository

**Files:**
- Create: `lib/sheets/expenseLog.ts`
- Test: `lib/sheets/expenseLog.test.ts`

**Interfaces:**
- Consumes: `getSheetsClient`, `getSpreadsheetId` (Task 2), `EXPENSE_LOG_RANGE` (Task 3), `parseCurrency`, `parseSheetDate` (Task 4).
- Produces: `type Transaction = { date: Date; amount: number; category: string; description: string; source: string; month: string; year: number }`, `getTransactions(): Promise<Transaction[]>`.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/sheets/expenseLog.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('./client', () => ({
  getSheetsClient: vi.fn(async () => ({
    spreadsheets: {
      values: {
        get: vi.fn(async () => ({
          data: {
            values: [
              ['2026-04-15', '2,467.41', '💰 Income', 'Income from Esteban', 'WhatsApp', 'Apr', '2026'],
              ['2026-04-16', '31.28', '🐾 Pet', 'arena', 'WhatsApp', 'Apr', '2026'],
            ],
          },
        })),
      },
    },
  })),
  getSpreadsheetId: vi.fn(() => 'test-id'),
}));

describe('getTransactions', () => {
  it('parses rows into typed transactions', async () => {
    const { getTransactions } = await import('./expenseLog');
    const rows = await getTransactions();

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      amount: 2467.41,
      category: '💰 Income',
      description: 'Income from Esteban',
      source: 'WhatsApp',
      month: 'Apr',
      year: 2026,
    });
    expect(rows[0].date.getUTCDate()).toBe(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sheets/expenseLog.test.ts`
Expected: FAIL — `./expenseLog` does not exist.

- [ ] **Step 3: Implement**

```typescript
// lib/sheets/expenseLog.ts
import { getSheetsClient, getSpreadsheetId } from './client';
import { EXPENSE_LOG_RANGE } from './layout';
import { parseCurrency, parseSheetDate } from './parse';

export type Transaction = {
  date: Date;
  amount: number;
  category: string;
  description: string;
  source: string;
  month: string;
  year: number;
};

export async function getTransactions(): Promise<Transaction[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: EXPENSE_LOG_RANGE,
  });

  const rows = res.data.values ?? [];

  return rows
    .filter((row) => row.length >= 7 && row[0])
    .map((row) => ({
      date: parseSheetDate(String(row[0])),
      amount: parseCurrency(String(row[1])),
      category: String(row[2]),
      description: String(row[3]),
      source: String(row[4]),
      month: String(row[5]),
      year: Number(row[6]),
    }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/sheets/expenseLog.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/sheets/expenseLog.ts lib/sheets/expenseLog.test.ts
git commit -m "feat: add Expense Log repository"
```

---

### Task 6: Shared Password Auth

**Files:**
- Create: `lib/auth/session.ts`, `middleware.ts`, `app/login/page.tsx`, `app/api/login/route.ts`
- Test: `lib/auth/session.test.ts`

**Interfaces:**
- Produces: `signSession(): string`, `verifySession(token: string | undefined): boolean` — used by `middleware.ts` and `app/api/login/route.ts`.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/auth/session.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  process.env.SESSION_SECRET = 'test-secret';
});

describe('session signing', () => {
  it('a freshly signed session verifies as valid', async () => {
    const { signSession, verifySession } = await import('./session');
    const token = signSession();
    expect(verifySession(token)).toBe(true);
  });

  it('a tampered token fails verification', async () => {
    const { signSession, verifySession } = await import('./session');
    const token = signSession();
    expect(verifySession(token + 'x')).toBe(false);
  });

  it('undefined fails verification', async () => {
    const { verifySession } = await import('./session');
    expect(verifySession(undefined)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/auth/session.test.ts`
Expected: FAIL — `./session` does not exist.

- [ ] **Step 3: Implement session signing**

```typescript
// lib/auth/session.ts
import crypto from 'node:crypto';

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

export function signSession(): string {
  const payload = 'family-budget-dashboard';
  const hmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, hmac] = token.split('.');
  if (!payload || !hmac) return false;
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  if (expected.length !== hmac.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/auth/session.test.ts`
Expected: PASS.

- [ ] **Step 5: Login route, page, and middleware**

```typescript
// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { signSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', signSession(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
```

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/login') || pathname.startsWith('/api/login')) {
    return NextResponse.next();
  }
  const token = req.cookies.get('session')?.value;
  if (!verifySession(token)) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

```tsx
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Incorrect password');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg bg-slate-900 p-8">
        <h1 className="text-xl font-semibold">Family Budget Dashboard</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Household password"
          className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="w-full rounded bg-blue-600 py-2 font-medium">
          Sign in
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Verify in the browser**

Run `npm run dev`. Navigate to `http://localhost:3000/` — confirm it redirects to
`/login`. Enter the wrong password — confirm an error shows and no redirect happens.
Enter the correct `DASHBOARD_PASSWORD` from `.env.local` — confirm it redirects to
`/` and reloading `/` no longer bounces to `/login`.

- [ ] **Step 7: Commit**

```bash
git add lib/auth/session.ts lib/auth/session.test.ts middleware.ts app/login/page.tsx app/api/login/route.ts
git commit -m "feat: add shared-password auth gate"
```

---

### Task 7: Overview Page

**Files:**
- Create: `lib/sheets/budgets.ts`, `app/page.tsx` (replacing the scaffold placeholder), `app/components/OverviewTiles.tsx`, `app/components/CategoryDonut.tsx`, `app/components/BudgetVsSpentChart.tsx`
- Test: `lib/sheets/budgets.test.ts`

**Interfaces:**
- Consumes: `getTransactions` (Task 5), `BUDGET_RANGE` (Task 3), `parseCurrency` (Task 4).
- Produces: `type CategoryBudget = { category: string; budget: number; spent: number; remaining: number; percentUsed: number }`, `getCategoryBudgets(month: string): Promise<CategoryBudget[]>`.

- [ ] **Step 1: Write the failing test for the budgets repository**

```typescript
// lib/sheets/budgets.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('./client', () => ({
  getSheetsClient: vi.fn(async () => ({
    spreadsheets: {
      values: {
        get: vi.fn(async () => ({
          data: {
            values: [
              ['Category', 'Budget ($)', 'Spent ($)', 'Remaining ($)', '% Used', 'Status'],
              ['🛒 Groceries', '1,100.00', '1,659.71', '-559.71', '150.88%', '🔴 Over'],
              ['🍽️ Dining Out', '400.00', '287.97', '112.03', '71.99%', '🟢 OK'],
            ],
          },
        })),
      },
    },
  })),
  getSpreadsheetId: vi.fn(() => 'test-id'),
}));

describe('getCategoryBudgets', () => {
  it('parses category rows, skipping the header', async () => {
    const { getCategoryBudgets } = await import('./budgets');
    const rows = await getCategoryBudgets();

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      category: '🛒 Groceries',
      budget: 1100,
      spent: 1659.71,
      remaining: -559.71,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sheets/budgets.test.ts`
Expected: FAIL — `./budgets` does not exist.

- [ ] **Step 3: Implement the budgets repository**

```typescript
// lib/sheets/budgets.ts
import { getSheetsClient, getSpreadsheetId } from './client';
import { BUDGET_RANGE } from './layout';
import { parseCurrency } from './parse';

export type CategoryBudget = {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
};

export async function getCategoryBudgets(): Promise<CategoryBudget[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: BUDGET_RANGE,
  });

  const rows = res.data.values ?? [];
  const dataRows = rows.filter(
    (row) => row[0] && row[0] !== 'Category' && row[0] !== 'TOTAL'
  );

  return dataRows.map((row) => {
    const budget = parseCurrency(String(row[1] ?? ''));
    const spent = parseCurrency(String(row[2] ?? ''));
    const remaining = parseCurrency(String(row[3] ?? ''));
    const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
    return { category: String(row[0]), budget, spent, remaining, percentUsed };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/sheets/budgets.test.ts`
Expected: PASS.

- [ ] **Step 5: Build the Overview page**

```tsx
// app/components/OverviewTiles.tsx
type Props = {
  totalSpent: number;
  totalBudget: number;
  income: number;
  netSavings: number;
  overBudgetCount: number;
};

export function OverviewTiles({ totalSpent, totalBudget, income, netSavings, overBudgetCount }: Props) {
  const tiles = [
    { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, sub: `of $${totalBudget.toFixed(2)} budget` },
    { label: 'Income', value: `$${income.toFixed(2)}`, sub: 'logged this month' },
    { label: 'Net Savings', value: `$${netSavings.toFixed(2)}`, sub: netSavings >= 0 ? 'saved this month' : 'deficit this month' },
    { label: 'Over Budget', value: String(overBudgetCount), sub: 'categories' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-lg bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">{tile.label}</p>
          <p className="text-2xl font-semibold">{tile.value}</p>
          <p className="text-xs text-slate-500">{tile.sub}</p>
        </div>
      ))}
    </div>
  );
}
```

```tsx
// app/components/CategoryDonut.tsx
'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#38bdf8', '#fb923c', '#a78bfa', '#f472b6', '#4ade80', '#facc15'];

export function CategoryDonut({ data }: { data: { category: string; spent: number }[] }) {
  const nonZero = data.filter((d) => d.spent > 0);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={nonZero} dataKey="spent" nameKey="category" innerRadius={60} outerRadius={90}>
          {nonZero.map((entry, i) => (
            <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

```tsx
// app/components/BudgetVsSpentChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';

type Row = { category: string; budget: number; spent: number };

export function BudgetVsSpentChart({ data }: { data: Row[] }) {
  const router = useRouter();
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        onClick={(state) => {
          const label = state?.activeLabel;
          if (label) router.push(`/categories/${encodeURIComponent(label)}`);
        }}
      >
        <XAxis type="number" />
        <YAxis type="category" dataKey="category" width={120} />
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
        <Bar dataKey="budget" fill="#334155" />
        <Bar dataKey="spent" fill="#38bdf8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

```tsx
// app/page.tsx
import { getCategoryBudgets } from '@/lib/sheets/budgets';
import { OverviewTiles } from './components/OverviewTiles';
import { CategoryDonut } from './components/CategoryDonut';
import { BudgetVsSpentChart } from './components/BudgetVsSpentChart';

export default async function OverviewPage() {
  const budgets = await getCategoryBudgets();

  const expenseRows = budgets.filter((b) => b.category !== '💰 Income');
  const incomeRow = budgets.find((b) => b.category === '💰 Income');

  const totalSpent = expenseRows.reduce((sum, b) => sum + b.spent, 0);
  const totalBudget = expenseRows.reduce((sum, b) => sum + b.budget, 0);
  const income = incomeRow?.spent ?? 0;
  const netSavings = income - totalSpent;
  const overBudgetCount = expenseRows.filter((b) => b.spent > b.budget).length;

  return (
    <main className="min-h-screen space-y-6 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <OverviewTiles
        totalSpent={totalSpent}
        totalBudget={totalBudget}
        income={income}
        netSavings={netSavings}
        overBudgetCount={overBudgetCount}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-slate-900 p-4">
          <h2 className="mb-2 text-sm uppercase text-slate-400">Where Money Is Going</h2>
          <CategoryDonut data={expenseRows.map((b) => ({ category: b.category, spent: b.spent }))} />
        </div>
        <div className="rounded-lg bg-slate-900 p-4">
          <h2 className="mb-2 text-sm uppercase text-slate-400">Budget vs Spent</h2>
          <BudgetVsSpentChart data={expenseRows.map((b) => ({ category: b.category, budget: b.budget, spent: b.spent }))} />
        </div>
      </div>
    </main>
  );
}
```

Run: `npm install recharts`

- [ ] **Step 6: Verify in the browser**

With `.env.local` pointed at the dev copy sheet, run `npm run dev`, sign in, and
confirm the Overview page renders real tiles, a non-empty donut chart, and a bar
chart matching the dev sheet's current Monthly Budget numbers. Click a bar and
confirm it navigates to `/categories/<that category>` (a 404 is expected until Task
8 — confirm the URL/navigation itself is correct).

- [ ] **Step 7: Commit**

```bash
git add lib/sheets/budgets.ts lib/sheets/budgets.test.ts app/page.tsx app/components package.json package-lock.json
git commit -m "feat: build Overview page with tiles and charts"
```

---

### Task 8: Categories List Page + Inline Budget Editing

**Files:**
- Modify: `lib/sheets/budgets.ts` (add `updateCategoryBudget`)
- Create: `app/categories/page.tsx`, `app/components/CategoryRow.tsx`, `app/api/categories/[category]/budget/route.ts`
- Test: `lib/sheets/budgets.test.ts` (extend)

**Interfaces:**
- Consumes: `getCategoryBudgets` (Task 7), `BUDGET_RANGE` (Task 3).
- Produces: `updateCategoryBudget(category: string, newBudget: number): Promise<void>` — used by the API route and, later, nowhere else in this plan.

- [ ] **Step 1: Write the failing test**

```typescript
// append to lib/sheets/budgets.test.ts
describe('updateCategoryBudget', () => {
  it('writes the new budget to the row matching the category', async () => {
    const updateSpy = vi.fn(async () => ({ data: {} }));
    vi.doMock('./client', () => ({
      getSheetsClient: vi.fn(async () => ({
        spreadsheets: {
          values: {
            get: vi.fn(async () => ({
              data: {
                values: [
                  ['Category', 'Budget ($)', 'Spent ($)', 'Remaining ($)', '% Used', 'Status'],
                  ['🛒 Groceries', '1,100.00', '1,659.71', '-559.71', '150.88%', '🔴 Over'],
                ],
              },
            })),
            update: updateSpy,
          },
        },
      })),
      getSpreadsheetId: vi.fn(() => 'test-id'),
    }));
    vi.resetModules();
    const { updateCategoryBudget } = await import('./budgets');

    await updateCategoryBudget('🛒 Groceries', 1200);

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        range: expect.stringContaining('B2'),
        requestBody: { values: [[1200]] },
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sheets/budgets.test.ts`
Expected: FAIL — `updateCategoryBudget` is not exported.

- [ ] **Step 3: Implement**

```typescript
// append to lib/sheets/budgets.ts
export async function updateCategoryBudget(category: string, newBudget: number): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: BUDGET_RANGE });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === category);
  if (rowIndex === -1) throw new Error(`Category not found: ${category}`);

  // BUDGET_RANGE starts at row 1 (header); data row N is at sheet row N+1,
  // and the range itself may start partway down the sheet — derive the sheet
  // row number from the range's own starting row, not a hardcoded offset.
  const rangeStartRow = Number(BUDGET_RANGE.match(/(\d+)(?=:)/)?.[1] ?? '1');
  const sheetRow = rangeStartRow + rowIndex;
  const tabName = BUDGET_RANGE.match(/^'([^']+)'/)?.[1] ?? '';

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!B${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[newBudget]] },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/sheets/budgets.test.ts`
Expected: PASS.

- [ ] **Step 5: API route and Categories page**

```typescript
// app/api/categories/[category]/budget/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateCategoryBudget } from '@/lib/sheets/budgets';

export async function PATCH(req: NextRequest, { params }: { params: { category: string } }) {
  const { budget } = await req.json();
  if (typeof budget !== 'number' || Number.isNaN(budget)) {
    return NextResponse.json({ error: 'budget must be a number' }, { status: 400 });
  }
  try {
    await updateCategoryBudget(decodeURIComponent(params.category), budget);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

```tsx
// app/components/CategoryRow.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CategoryBudget } from '@/lib/sheets/budgets';

export function CategoryRow({ row }: { row: CategoryBudget }) {
  const [budget, setBudget] = useState(row.budget);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(newValue: number) {
    const previous = budget;
    setBudget(newValue);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(row.category)}/budget`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: newValue }),
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      setBudget(previous);
      setError('Could not save — reverted.');
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-slate-800 py-3">
      <Link href={`/categories/${encodeURIComponent(row.category)}`} className="font-medium hover:underline">
        {row.category}
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <span>${row.spent.toFixed(2)}</span>
        {editing ? (
          <input
            autoFocus
            type="number"
            defaultValue={budget}
            disabled={saving}
            onBlur={(e) => save(Number(e.target.value))}
            className="w-24 rounded border border-slate-700 bg-slate-800 px-2 py-1"
          />
        ) : (
          <button onClick={() => setEditing(true)} className="w-24 text-right underline decoration-dotted">
            ${budget.toFixed(2)}
          </button>
        )}
        <span>{row.percentUsed.toFixed(0)}%</span>
        {error && <span className="text-red-400">{error}</span>}
      </div>
    </div>
  );
}
```

```tsx
// app/categories/page.tsx
import { getCategoryBudgets } from '@/lib/sheets/budgets';
import { CategoryRow } from '../components/CategoryRow';

export default async function CategoriesPage() {
  const rows = await getCategoryBudgets();

  return (
    <main className="min-h-screen space-y-4 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <div className="rounded-lg bg-slate-900 p-4">
        {rows.map((row) => (
          <CategoryRow key={row.category} row={row} />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Verify in the browser**

Navigate to `/categories`. Confirm every category from the dev sheet's budget tab
appears. Click a budget value, change it, blur the field, and confirm (a) the sheet
cell actually changed (check the dev copy in Google Sheets), and (b) reloading the
page shows the new value. Temporarily break the API route (e.g. rename the export)
to confirm a failed save reverts the displayed value and shows the error text, then
restore it.

- [ ] **Step 7: Commit**

```bash
git add lib/sheets/budgets.ts lib/sheets/budgets.test.ts app/categories/page.tsx app/components/CategoryRow.tsx app/api/categories
git commit -m "feat: add Categories page with inline budget editing"
```

---

### Task 9: Category Detail — 6-Month Trend and Transaction Search

**Files:**
- Create: `lib/sheets/monthlyTrend.ts`, `app/categories/[category]/page.tsx`, `app/components/CategoryTrendChart.tsx`, `app/components/TransactionSearch.tsx`
- Test: `lib/sheets/monthlyTrend.test.ts`

**Interfaces:**
- Consumes: `getTransactions` (Task 5), `Transaction` type (Task 5).
- Produces: `getSixMonthTrend(transactions: Transaction[], category: string, asOf: Date): { month: string; total: number }[]` (pure function, no I/O — easy to unit test).

- [ ] **Step 1: Write the failing test**

```typescript
// lib/sheets/monthlyTrend.test.ts
import { describe, it, expect } from 'vitest';
import { getSixMonthTrend } from './monthlyTrend';
import type { Transaction } from './expenseLog';

function tx(date: string, category: string, amount: number): Transaction {
  return { date: new Date(date), amount, category, description: '', source: 'Bank', month: '', year: 0 };
}

describe('getSixMonthTrend', () => {
  it('sums spend per month for the given category over the trailing 6 months', () => {
    const transactions = [
      tx('2026-04-02', '🛒 Groceries', 49.23),
      tx('2026-04-04', '🛒 Groceries', 132.0),
      tx('2026-05-08', '🛒 Groceries', 107.84),
      tx('2026-05-08', '🍽️ Dining Out', 40.0), // different category, excluded
      tx('2025-10-01', '🛒 Groceries', 999.0), // outside the 6-month window, excluded
    ];

    const trend = getSixMonthTrend(transactions, '🛒 Groceries', new Date('2026-09-05'));

    expect(trend).toEqual([
      { month: '2026-04', total: 181.23 },
      { month: '2026-05', total: 107.84 },
      { month: '2026-06', total: 0 },
      { month: '2026-07', total: 0 },
      { month: '2026-08', total: 0 },
      { month: '2026-09', total: 0 },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sheets/monthlyTrend.test.ts`
Expected: FAIL — `./monthlyTrend` does not exist.

- [ ] **Step 3: Implement**

```typescript
// lib/sheets/monthlyTrend.ts
import type { Transaction } from './expenseLog';

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function getSixMonthTrend(
  transactions: Transaction[],
  category: string,
  asOf: Date
): { month: string; total: number }[] {
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - i, 1));
    months.push(monthKey(d));
  }

  const totals = new Map(months.map((m) => [m, 0]));

  for (const t of transactions) {
    if (t.category !== category) continue;
    const key = monthKey(t.date);
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + t.amount);
    }
  }

  return months.map((month) => ({ month, total: Math.round((totals.get(month) ?? 0) * 100) / 100 }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/sheets/monthlyTrend.test.ts`
Expected: PASS.

- [ ] **Step 5: Build the category detail page**

```tsx
// app/components/CategoryTrendChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function CategoryTrendChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
        <Line type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

```tsx
// app/components/TransactionSearch.tsx
'use client';

import { useMemo, useState } from 'react';
import type { Transaction } from '@/lib/sheets/expenseLog';

export function TransactionSearch({ transactions }: { transactions: Transaction[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) => t.description.toLowerCase().includes(q));
  }, [transactions, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter transactions... e.g. gas, walmart"
        className="mb-3 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2"
      />
      <ul className="divide-y divide-slate-800">
        {filtered.map((t, i) => (
          <li key={i} className="flex justify-between py-2 text-sm">
            <span>{t.description}</span>
            <span>${t.amount.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

```tsx
// app/categories/[category]/page.tsx
import { getTransactions } from '@/lib/sheets/expenseLog';
import { getCategoryBudgets } from '@/lib/sheets/budgets';
import { getSixMonthTrend } from '@/lib/sheets/monthlyTrend';
import { CategoryTrendChart } from '../../components/CategoryTrendChart';
import { TransactionSearch } from '../../components/TransactionSearch';

export default async function CategoryDetailPage({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category);
  const [transactions, budgets] = await Promise.all([getTransactions(), getCategoryBudgets()]);

  const budgetRow = budgets.find((b) => b.category === category);
  const categoryTransactions = transactions
    .filter((t) => t.category === category)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const trend = getSixMonthTrend(transactions, category, new Date());

  return (
    <main className="min-h-screen space-y-6 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">{category}</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">Spent</p>
          <p className="text-xl font-semibold">${(budgetRow?.spent ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">Budget</p>
          <p className="text-xl font-semibold">${(budgetRow?.budget ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">Remaining</p>
          <p className="text-xl font-semibold">${(budgetRow?.remaining ?? 0).toFixed(2)}</p>
        </div>
      </div>
      <div className="rounded-lg bg-slate-900 p-4">
        <h2 className="mb-2 text-sm uppercase text-slate-400">Last 6 Months</h2>
        <CategoryTrendChart data={trend} />
      </div>
      <div className="rounded-lg bg-slate-900 p-4">
        <TransactionSearch transactions={categoryTransactions} />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Verify in the browser**

From `/categories`, click into "🛒 Groceries" (or whichever category has the most
transactions in the dev sheet). Confirm the 6-month chart has real, non-zero
values matching what you can hand-count from the sheet for at least one month.
Type a merchant name (e.g. "walmart") into the search box and confirm the list
narrows to only matching transactions.

- [ ] **Step 7: Commit**

```bash
git add lib/sheets/monthlyTrend.ts lib/sheets/monthlyTrend.test.ts app/categories/[category] app/components/CategoryTrendChart.tsx app/components/TransactionSearch.tsx
git commit -m "feat: add category detail page with 6-month trend and search"
```

---

### Task 10: Add Category Flow

**Files:**
- Modify: `lib/sheets/budgets.ts` (add `addCategory`)
- Create: `app/api/categories/route.ts`, `app/components/AddCategoryForm.tsx`
- Modify: `app/categories/page.tsx` (render the form)
- Test: `lib/sheets/budgets.test.ts` (extend)

**Interfaces:**
- Consumes: `BUDGET_RANGE`, `ANNUAL_SUMMARY_RANGE` (Task 3).
- Produces: `addCategory(input: { emoji: string; name: string; startingBudget: number }): Promise<void>`.

- [ ] **Step 1: Write the failing test**

```typescript
// append to lib/sheets/budgets.test.ts
describe('addCategory', () => {
  it('appends a row to the budget tab and the annual summary tab', async () => {
    const appendSpy = vi.fn(async () => ({ data: {} }));
    vi.doMock('./client', () => ({
      getSheetsClient: vi.fn(async () => ({
        spreadsheets: { values: { append: appendSpy } },
      })),
      getSpreadsheetId: vi.fn(() => 'test-id'),
    }));
    vi.resetModules();
    const { addCategory } = await import('./budgets');

    await addCategory({ emoji: '🎮', name: 'Gaming', startingBudget: 50 });

    expect(appendSpy).toHaveBeenCalledTimes(2);
    expect(appendSpy.mock.calls[0][0].requestBody.values).toEqual([['🎮 Gaming', 50, 0, 50, 0, '⬜ N/A']]);
    expect(appendSpy.mock.calls[1][0].requestBody.values[0][0]).toBe('🎮 Gaming');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sheets/budgets.test.ts`
Expected: FAIL — `addCategory` is not exported.

- [ ] **Step 3: Implement**

```typescript
// append to lib/sheets/budgets.ts
import { ANNUAL_SUMMARY_RANGE } from './layout';

export async function addCategory(input: { emoji: string; name: string; startingBudget: number }): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const categoryLabel = `${input.emoji} ${input.name}`;
  const budgetTab = BUDGET_RANGE.match(/^'([^']+)'/)?.[1] ?? '';
  const annualTab = ANNUAL_SUMMARY_RANGE.match(/^'([^']+)'/)?.[1] ?? '';

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${budgetTab}'!A:F`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[categoryLabel, input.startingBudget, 0, input.startingBudget, 0, '⬜ N/A']] },
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${annualTab}'!A:N`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[categoryLabel, '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']] },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/sheets/budgets.test.ts`
Expected: PASS.

- [ ] **Step 5: API route and form**

```typescript
// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addCategory } from '@/lib/sheets/budgets';

export async function POST(req: NextRequest) {
  const { emoji, name, startingBudget } = await req.json();
  if (!name || typeof startingBudget !== 'number') {
    return NextResponse.json({ error: 'name and startingBudget are required' }, { status: 400 });
  }
  try {
    await addCategory({ emoji: emoji || '📁', name, startingBudget });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

```tsx
// app/components/AddCategoryForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddCategoryForm() {
  const [emoji, setEmoji] = useState('📁');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji, name, startingBudget: Number(budget) || 0 }),
    });
    if (res.ok) {
      setName('');
      setBudget('');
      router.refresh();
    } else {
      setError('Could not add category');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex items-end gap-2 rounded-lg bg-slate-900 p-4">
      <div>
        <label className="block text-xs text-slate-400">Emoji</label>
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-14 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-center" />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-slate-400">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-slate-400">Starting Budget</label>
        <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-32 rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      </div>
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium">+ Add category</button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </form>
  );
}
```

Add `<AddCategoryForm />` above the category list in `app/categories/page.tsx`.

- [ ] **Step 6: Verify in the browser**

On `/categories`, submit the form with a new category name and starting budget.
Confirm it appears in the list after the page refreshes, and check the dev copy
sheet directly to confirm both the budget tab and annual summary tab got new rows.

- [ ] **Step 7: Commit**

```bash
git add lib/sheets/budgets.ts lib/sheets/budgets.test.ts app/api/categories/route.ts app/components/AddCategoryForm.tsx app/categories/page.tsx
git commit -m "feat: add category creation flow"
```

---

### Task 11: Debt Tracker — Payoff Math and Keyword Matching

**Files:**
- Create: `lib/sheets/debts.ts`
- Test: `lib/sheets/debts.test.ts`

**Interfaces:**
- Consumes: `DEBT_TRACKER_RANGE` (Task 3), `Transaction` type (Task 5), `parseCurrency`, `parseSheetDate` (Task 4).
- Produces: `type Debt = { name: string; principal: number; currentBalance: number; payment: number; frequency: string; startDate: Date; rate: number; keyword: string }`, `getDebts(): Promise<Debt[]>`, `addDebt(input: Omit<Debt, ...>): Promise<void>`, `matchPayments(debt: Debt, transactions: Transaction[]): Transaction[]`, `estimatePayoffDate(debt: Debt): Date | null`.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/sheets/debts.test.ts
import { describe, it, expect, vi } from 'vitest';
import { matchPayments, estimatePayoffDate } from './debts';
import type { Transaction } from './expenseLog';
import type { Debt } from './debts';

function tx(description: string, amount: number): Transaction {
  return { date: new Date('2026-06-11'), amount, category: '🚗 Transport', description, source: 'Bank', month: 'Jun', year: 2026 };
}

const carLoan: Debt = {
  name: 'Car Loan',
  principal: 20000,
  currentBalance: 12000,
  payment: 323.98,
  frequency: 'Biweekly',
  startDate: new Date('2024-01-01'),
  rate: 6.5,
  keyword: 'LendCare',
};

describe('matchPayments', () => {
  it('matches transactions whose description contains the keyword, case-insensitively', () => {
    const transactions = [
      tx('LendCare car loan payment', 323.98),
      tx('Costco Wholesale Nepean', 175.04),
      tx('lendcare monthly payment', 323.98),
    ];
    const matches = matchPayments(carLoan, transactions);
    expect(matches).toHaveLength(2);
  });
});

describe('estimatePayoffDate', () => {
  it('returns null when payment is zero (can never pay off)', () => {
    expect(estimatePayoffDate({ ...carLoan, payment: 0 })).toBeNull();
  });

  it('estimates a future date based on balance / payment and frequency', () => {
    const result = estimatePayoffDate({ ...carLoan, currentBalance: 647.96, payment: 323.98, frequency: 'Biweekly' });
    expect(result).not.toBeNull();
    // 647.96 / 323.98 = 2 payments remaining, biweekly = 28 days out from today
    const daysFromNow = Math.round((result!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(daysFromNow).toBeGreaterThanOrEqual(27);
    expect(daysFromNow).toBeLessThanOrEqual(29);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sheets/debts.test.ts`
Expected: FAIL — `./debts` does not exist.

- [ ] **Step 3: Implement**

```typescript
// lib/sheets/debts.ts
import { getSheetsClient, getSpreadsheetId } from './client';
import { DEBT_TRACKER_RANGE } from './layout';
import { parseCurrency, parseSheetDate } from './parse';
import type { Transaction } from './expenseLog';

export type Debt = {
  name: string;
  principal: number;
  currentBalance: number;
  payment: number;
  frequency: 'Weekly' | 'Biweekly' | 'Monthly' | 'Annually';
  startDate: Date;
  rate: number;
  keyword: string;
};

const FREQUENCY_DAYS: Record<Debt['frequency'], number> = {
  Weekly: 7,
  Biweekly: 14,
  Monthly: 30,
  Annually: 365,
};

export async function getDebts(): Promise<Debt[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: DEBT_TRACKER_RANGE });
  const rows = (res.data.values ?? []).filter((row) => row[0] && row[0] !== 'Name');

  return rows.map((row) => ({
    name: String(row[0]),
    principal: parseCurrency(String(row[1] ?? '')),
    currentBalance: parseCurrency(String(row[2] ?? '')),
    payment: parseCurrency(String(row[3] ?? '')),
    frequency: (row[4] as Debt['frequency']) ?? 'Monthly',
    startDate: parseSheetDate(String(row[5] ?? '2026-01-01')),
    rate: parseCurrency(String(row[6] ?? '')),
    keyword: String(row[7] ?? ''),
  }));
}

export async function addDebt(input: Debt): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = DEBT_TRACKER_RANGE.match(/^'([^']+)'/)?.[1] ?? '';
  const dateStr = input.startDate.toISOString().slice(0, 10);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${tab}'!A:H`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[input.name, input.principal, input.currentBalance, input.payment, input.frequency, dateStr, input.rate, input.keyword]],
    },
  });
}

export function matchPayments(debt: Debt, transactions: Transaction[]): Transaction[] {
  if (!debt.keyword) return [];
  const keyword = debt.keyword.toLowerCase();
  return transactions
    .filter((t) => t.description.toLowerCase().includes(keyword))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function estimatePayoffDate(debt: Debt): Date | null {
  if (debt.payment <= 0 || debt.currentBalance <= 0) return null;
  const paymentsRemaining = Math.ceil(debt.currentBalance / debt.payment);
  const daysOut = paymentsRemaining * FREQUENCY_DAYS[debt.frequency];
  return new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/sheets/debts.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/sheets/debts.ts lib/sheets/debts.test.ts
git commit -m "feat: add debt repository with payoff estimate and keyword matching"
```

---

### Task 12: Debt Tracker Page + Add Loan Form

**Files:**
- Create: `app/debts/page.tsx`, `app/components/DebtCard.tsx`, `app/components/AddDebtForm.tsx`, `app/api/debts/route.ts`

**Interfaces:**
- Consumes: `getDebts`, `addDebt`, `matchPayments`, `estimatePayoffDate` (Task 11), `getTransactions` (Task 5).

- [ ] **Step 1: API route**

```typescript
// app/api/debts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addDebt } from '@/lib/sheets/debts';

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    await addDebt({
      name: body.name,
      principal: Number(body.principal),
      currentBalance: Number(body.currentBalance),
      payment: Number(body.payment),
      frequency: body.frequency,
      startDate: new Date(body.startDate),
      rate: Number(body.rate),
      keyword: body.keyword,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Debt card component**

```tsx
// app/components/DebtCard.tsx
import type { Debt } from '@/lib/sheets/debts';
import type { Transaction } from '@/lib/sheets/expenseLog';

export function DebtCard({ debt, payments, payoffDate }: { debt: Debt; payments: Transaction[]; payoffDate: Date | null }) {
  const paidSoFar = debt.principal - debt.currentBalance;
  const percentPaid = debt.principal > 0 ? (paidSoFar / debt.principal) * 100 : 0;

  return (
    <div className="rounded-lg bg-slate-900 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">{debt.name}</h3>
        <span className="text-sm text-slate-400">${debt.currentBalance.toFixed(2)} remaining</span>
      </div>
      <div className="mt-2 h-2 rounded bg-slate-800">
        <div className="h-2 rounded bg-blue-500" style={{ width: `${Math.min(100, percentPaid).toFixed(0)}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        ${debt.payment.toFixed(2)} / {debt.frequency}
        {payoffDate && ` · est. payoff ${payoffDate.toLocaleDateString()}`}
      </p>
      <ul className="mt-3 space-y-1 text-xs text-slate-500">
        {payments.slice(0, 5).map((p, i) => (
          <li key={i}>{p.date.toLocaleDateString()} — ${p.amount.toFixed(2)}</li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Add loan form**

```tsx
// app/components/AddDebtForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddDebtForm() {
  const [form, setForm] = useState({
    name: '', principal: '', currentBalance: '', payment: '', frequency: 'Monthly', startDate: '', rate: '', keyword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        principal: Number(form.principal),
        currentBalance: Number(form.currentBalance),
        payment: Number(form.payment),
        rate: Number(form.rate),
      }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setError('Could not add loan');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-4 md:grid-cols-4">
      <input placeholder="Name" value={form.name} onChange={(e) => update('name', e.target.value)} required className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Principal" type="number" value={form.principal} onChange={(e) => update('principal', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Current Balance" type="number" value={form.currentBalance} onChange={(e) => update('currentBalance', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Payment" type="number" value={form.payment} onChange={(e) => update('payment', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <select value={form.frequency} onChange={(e) => update('frequency', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1">
        <option>Weekly</option>
        <option>Biweekly</option>
        <option>Monthly</option>
        <option>Annually</option>
      </select>
      <input placeholder="Start Date" type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Rate %" type="number" value={form.rate} onChange={(e) => update('rate', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Keyword (matches description)" value={form.keyword} onChange={(e) => update('keyword', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <button type="submit" className="col-span-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium md:col-span-4">+ Add loan</button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </form>
  );
}
```

- [ ] **Step 4: Debt Tracker page**

```tsx
// app/debts/page.tsx
import { getDebts, matchPayments, estimatePayoffDate } from '@/lib/sheets/debts';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { DebtCard } from '../components/DebtCard';
import { AddDebtForm } from '../components/AddDebtForm';

export default async function DebtTrackerPage() {
  const [debts, transactions] = await Promise.all([getDebts(), getTransactions()]);

  return (
    <main className="min-h-screen space-y-4 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Debt Tracker</h1>
      <AddDebtForm />
      {debts.length === 0 ? (
        <p className="text-slate-400">No loans configured yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {debts.map((debt) => (
            <DebtCard
              key={debt.name}
              debt={debt}
              payments={matchPayments(debt, transactions)}
              payoffDate={estimatePayoffDate(debt)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Verify in the browser**

On `/debts`, add a loan using data visible in the dev sheet (e.g. name "Car Loan",
keyword "LendCare", using real numbers you can see in the Expense Log). Confirm the
card shows a non-empty payment history pulled from matching transactions, and that
the progress bar and payoff date look sane. Check the dev copy sheet to confirm the
row was appended to Debt Tracker correctly.

- [ ] **Step 6: Commit**

```bash
git add app/debts app/components/DebtCard.tsx app/components/AddDebtForm.tsx app/api/debts
git commit -m "feat: add Debt Tracker page with add-loan form"
```

---

### Task 13: Recurring Expenses — Schema and CRUD

**Files:**
- Create: `lib/sheets/recurring.ts`
- Test: `lib/sheets/recurring.test.ts`

**Interfaces:**
- Consumes: `RECURRING_RANGE` (Task 3), `parseCurrency`, `parseSheetDate` (Task 4).
- Produces: `type RecurringItem = { name: string; category: string; expectedAmount: number; frequency: string; nextDueDate: Date; autoLogEnabled: boolean; lastLoggedDate: Date | null }`, `getRecurringItems(): Promise<RecurringItem[]>`, `addRecurringItem(...): Promise<void>`, `ensureRecurringColumns(): Promise<void>`, `advanceNextDueDate(date: Date, frequency: string): Date`.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/sheets/recurring.test.ts
import { describe, it, expect, vi } from 'vitest';
import { advanceNextDueDate } from './recurring';

describe('advanceNextDueDate', () => {
  it('advances weekly by 7 days', () => {
    const result = advanceNextDueDate(new Date('2026-09-01'), 'Weekly');
    expect(result.toISOString().slice(0, 10)).toBe('2026-09-08');
  });
  it('advances monthly by calendar month, not 30 days', () => {
    const result = advanceNextDueDate(new Date('2026-01-31'), 'Monthly');
    // Jan 31 + 1 month should land in Feb, not overflow into March
    expect(result.getUTCMonth()).toBe(1);
  });
  it('advances annually by one year', () => {
    const result = advanceNextDueDate(new Date('2026-06-01'), 'Annually');
    expect(result.getUTCFullYear()).toBe(2027);
  });
});

describe('ensureRecurringColumns', () => {
  it('adds missing headers without touching existing ones', async () => {
    const updateSpy = vi.fn(async () => ({ data: {} }));
    vi.doMock('./client', () => ({
      getSheetsClient: vi.fn(async () => ({
        spreadsheets: {
          values: {
            get: vi.fn(async () => ({ data: { values: [['Name', 'Amount', 'Category']] } })),
            update: updateSpy,
          },
        },
      })),
      getSpreadsheetId: vi.fn(() => 'test-id'),
    }));
    vi.resetModules();
    const { ensureRecurringColumns } = await import('./recurring');

    await ensureRecurringColumns();

    const writtenHeaders = updateSpy.mock.calls[0][0].requestBody.values[0];
    expect(writtenHeaders).toEqual([
      'Name', 'Amount', 'Category', 'NextDueDate', 'ExpectedAmount', 'Frequency', 'AutoLogEnabled', 'LastLoggedDate',
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sheets/recurring.test.ts`
Expected: FAIL — `./recurring` does not exist.

- [ ] **Step 3: Implement**

```typescript
// lib/sheets/recurring.ts
import { getSheetsClient, getSpreadsheetId } from './client';
import { RECURRING_RANGE } from './layout';
import { parseCurrency, parseSheetDate } from './parse';

export type Frequency = 'Weekly' | 'Biweekly' | 'Monthly' | 'Annually';

export type RecurringItem = {
  name: string;
  category: string;
  expectedAmount: number;
  frequency: Frequency;
  nextDueDate: Date;
  autoLogEnabled: boolean;
  lastLoggedDate: Date | null;
};

const REQUIRED_NEW_COLUMNS = ['NextDueDate', 'ExpectedAmount', 'Frequency', 'AutoLogEnabled', 'LastLoggedDate'];

function tabName(): string {
  return RECURRING_RANGE.match(/^'([^']+)'/)?.[1] ?? '';
}

export async function ensureRecurringColumns(): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = tabName();

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${tab}'!A1:Z1` });
  const existingHeaders = (res.data.values?.[0] ?? []).map(String);

  const missing = REQUIRED_NEW_COLUMNS.filter((col) => !existingHeaders.includes(col));
  if (missing.length === 0) return;

  const newHeaders = [...existingHeaders, ...missing];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tab}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [newHeaders] },
  });
}

export function advanceNextDueDate(date: Date, frequency: Frequency): Date {
  const d = new Date(date);
  switch (frequency) {
    case 'Weekly':
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case 'Biweekly':
      d.setUTCDate(d.getUTCDate() + 14);
      break;
    case 'Monthly':
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case 'Annually':
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
  }
  return d;
}

export async function getRecurringItems(): Promise<RecurringItem[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: RECURRING_RANGE });
  const rows = res.data.values ?? [];
  const header = rows[0] ?? [];
  const dataRows = rows.slice(1).filter((row) => row[0]);

  const idx = (col: string) => header.indexOf(col);

  return dataRows.map((row) => ({
    name: String(row[0] ?? ''),
    category: String(row[idx('Category')] ?? ''),
    expectedAmount: parseCurrency(String(row[idx('ExpectedAmount')] ?? '')),
    frequency: (row[idx('Frequency')] as Frequency) ?? 'Monthly',
    nextDueDate: parseSheetDate(String(row[idx('NextDueDate')] ?? '2026-01-01')),
    autoLogEnabled: String(row[idx('AutoLogEnabled')]).toUpperCase() === 'TRUE',
    lastLoggedDate: row[idx('LastLoggedDate')] ? parseSheetDate(String(row[idx('LastLoggedDate')])) : null,
  }));
}

export async function addRecurringItem(input: {
  name: string;
  category: string;
  expectedAmount: number;
  frequency: Frequency;
  nextDueDate: Date;
  autoLogEnabled: boolean;
}): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = tabName();

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${tab}'!A1:Z1` });
  const header = (res.data.values?.[0] ?? []).map(String);
  const row = header.map((col) => {
    switch (col) {
      case 'Name': return input.name;
      case 'Category': return input.category;
      case 'ExpectedAmount': return input.expectedAmount;
      case 'Frequency': return input.frequency;
      case 'NextDueDate': return input.nextDueDate.toISOString().slice(0, 10);
      case 'AutoLogEnabled': return input.autoLogEnabled ? 'TRUE' : 'FALSE';
      default: return '';
    }
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${tab}'!A:${String.fromCharCode(64 + header.length)}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/sheets/recurring.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Run the real migration once against the dev sheet**

Write a one-off script or temporarily call `ensureRecurringColumns()` from a scratch
API route, hit it once, then confirm in the dev copy sheet that the five new columns
appeared on the Recurring Expenses tab without disturbing existing data. Remove the
scratch route afterward.

- [ ] **Step 6: Commit**

```bash
git add lib/sheets/recurring.ts lib/sheets/recurring.test.ts
git commit -m "feat: add recurring-expense repository and column migration"
```

---

### Task 14: Recurring Scheduler Logic and Cron Route

**Files:**
- Create: `lib/scheduler/computeDue.ts`, `app/api/recurring/scheduler/route.ts`, `vercel.json`
- Modify: `lib/sheets/expenseLog.ts` (add `appendTransaction`)
- Test: `lib/scheduler/computeDue.test.ts`

**Interfaces:**
- Consumes: `RecurringItem`, `advanceNextDueDate` (Task 13).
- Produces: `computeDueRecurringLogs(items: RecurringItem[], today: Date): { item: RecurringItem; newNextDueDate: Date }[]` (pure function — this is the core logic the cron route wires up).

- [ ] **Step 1: Write the failing test**

```typescript
// lib/scheduler/computeDue.test.ts
import { describe, it, expect } from 'vitest';
import { computeDueRecurringLogs } from './computeDue';
import type { RecurringItem } from '@/lib/sheets/recurring';

function item(overrides: Partial<RecurringItem>): RecurringItem {
  return {
    name: 'Rent', category: '🏠 Housing', expectedAmount: 2650, frequency: 'Monthly',
    nextDueDate: new Date('2026-09-01'), autoLogEnabled: true, lastLoggedDate: null,
    ...overrides,
  };
}

describe('computeDueRecurringLogs', () => {
  it('includes items whose next due date has arrived', () => {
    const due = computeDueRecurringLogs([item({ nextDueDate: new Date('2026-09-01') })], new Date('2026-09-05'));
    expect(due).toHaveLength(1);
    expect(due[0].newNextDueDate.toISOString().slice(0, 10)).toBe('2026-10-01');
  });

  it('excludes items not yet due', () => {
    const due = computeDueRecurringLogs([item({ nextDueDate: new Date('2026-09-10') })], new Date('2026-09-05'));
    expect(due).toHaveLength(0);
  });

  it('excludes items with auto-logging disabled', () => {
    const due = computeDueRecurringLogs([item({ nextDueDate: new Date('2026-09-01'), autoLogEnabled: false })], new Date('2026-09-05'));
    expect(due).toHaveLength(0);
  });

  it('does not log the same item twice in one day', () => {
    const due = computeDueRecurringLogs(
      [item({ nextDueDate: new Date('2026-09-01'), lastLoggedDate: new Date('2026-09-05') })],
      new Date('2026-09-05')
    );
    expect(due).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/scheduler/computeDue.test.ts`
Expected: FAIL — `./computeDue` does not exist.

- [ ] **Step 3: Implement**

```typescript
// lib/scheduler/computeDue.ts
import { advanceNextDueDate } from '@/lib/sheets/recurring';
import type { RecurringItem } from '@/lib/sheets/recurring';

function isSameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

export function computeDueRecurringLogs(
  items: RecurringItem[],
  today: Date
): { item: RecurringItem; newNextDueDate: Date }[] {
  return items
    .filter((item) => item.autoLogEnabled)
    .filter((item) => item.nextDueDate.getTime() <= today.getTime())
    .filter((item) => !(item.lastLoggedDate && isSameDay(item.lastLoggedDate, today)))
    .map((item) => ({ item, newNextDueDate: advanceNextDueDate(item.nextDueDate, item.frequency) }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/scheduler/computeDue.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Add `appendTransaction` and the cron route**

```typescript
// append to lib/sheets/expenseLog.ts (getSheetsClient/getSpreadsheetId/EXPENSE_LOG_RANGE
// are already imported at the top of this file from Task 5 — do not re-import them)
export async function appendTransaction(t: {
  date: Date; amount: number; category: string; description: string; source: string;
}): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = EXPENSE_LOG_RANGE.match(/^'([^']+)'/)?.[1] ?? '';
  const dateStr = t.date.toISOString().slice(0, 10);
  const month = t.date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = t.date.getUTCFullYear();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${tab}'!A:G`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[dateStr, t.amount, t.category, t.description, t.source, month, year]] },
  });
}
```

```typescript
// app/api/recurring/scheduler/route.ts
import { NextResponse } from 'next/server';
import { getRecurringItems } from '@/lib/sheets/recurring';
import { computeDueRecurringLogs } from '@/lib/scheduler/computeDue';
import { appendTransaction } from '@/lib/sheets/expenseLog';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const items = await getRecurringItems();
  const due = computeDueRecurringLogs(items, new Date());

  for (const { item } of due) {
    await appendTransaction({
      date: new Date(),
      amount: item.expectedAmount,
      category: item.category,
      description: `${item.name} (auto)`,
      source: 'Auto-Pending',
    });
  }

  return NextResponse.json({ logged: due.map((d) => d.item.name) });
}
```

```json
// vercel.json
{
  "crons": [
    { "path": "/api/recurring/scheduler", "schedule": "0 13 * * *" }
  ]
}
```

Add `CRON_SECRET=<any long random string>` to `.env.local` — Vercel sends this same
value automatically as the `Authorization` header for scheduled cron requests in
production; for local testing, call the route manually with
`curl -H "Authorization: Bearer <value>" http://localhost:3000/api/recurring/scheduler`.

- [ ] **Step 6: Verify against the dev sheet**

Add a recurring item via a temporary direct call to `addRecurringItem` (or a scratch
script) with `nextDueDate` set to today or earlier and `autoLogEnabled: true`. Call
the scheduler route as shown above. Confirm a new row appears in the dev copy's
Expense Log with `Source = Auto-Pending`, and note that the recurring item's
`NextDueDate` in the sheet has NOT changed yet — this task only computes the new
date; writing it back plus `LastLoggedDate` is done in Task 15's `markLogged`.

- [ ] **Step 7: Commit**

```bash
git add lib/scheduler lib/sheets/expenseLog.ts lib/sheets/recurring.ts app/api/recurring/scheduler vercel.json
git commit -m "feat: add recurring-expense auto-logging scheduler"
```

---

### Task 15: Write Back NextDueDate/LastLoggedDate + Confirmation Queue UI

**Files:**
- Modify: `lib/sheets/recurring.ts` (add `markLogged`), `app/api/recurring/scheduler/route.ts` (call it)
- Create: `app/recurring/page.tsx`, `app/components/RecurringForm.tsx`, `app/components/ConfirmationQueue.tsx`, `app/api/transactions/[date]/confirm/route.ts`, `app/api/recurring/route.ts`
- Modify: `lib/sheets/expenseLog.ts` (add `confirmTransaction`)
- Test: `lib/sheets/recurring.test.ts` (extend)

**Interfaces:**
- Consumes: everything from Tasks 13-14.
- Produces: `markLogged(name: string, newNextDueDate: Date, loggedOn: Date): Promise<void>`, `confirmTransaction(originalDescription: string, originalDate: Date, correctedAmount: number): Promise<void>`.

- [ ] **Step 1: Write the failing test**

```typescript
// append to lib/sheets/recurring.test.ts
describe('markLogged', () => {
  it('writes NextDueDate and LastLoggedDate to the row matching the item name', async () => {
    const updateSpy = vi.fn(async () => ({ data: {} }));
    vi.doMock('./client', () => ({
      getSheetsClient: vi.fn(async () => ({
        spreadsheets: {
          values: {
            get: vi.fn(async () => ({
              data: { values: [
                ['Name', 'Category', 'NextDueDate', 'ExpectedAmount', 'Frequency', 'AutoLogEnabled', 'LastLoggedDate'],
                ['Rent', '🏠 Housing', '2026-09-01', '2650', 'Monthly', 'TRUE', ''],
              ] },
            })),
            update: updateSpy,
          },
        },
      })),
      getSpreadsheetId: vi.fn(() => 'test-id'),
    }));
    vi.resetModules();
    const { markLogged } = await import('./recurring');

    await markLogged('Rent', new Date('2026-10-01'), new Date('2026-09-05'));

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: { values: [['2026-10-01', '2026-09-05']] },
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sheets/recurring.test.ts`
Expected: FAIL — `markLogged` is not exported.

- [ ] **Step 3: Implement `markLogged`**

```typescript
// append to lib/sheets/recurring.ts
export async function markLogged(name: string, newNextDueDate: Date, loggedOn: Date): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = tabName();

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${tab}'!A1:Z1000` });
  const rows = res.data.values ?? [];
  const header = rows[0] ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === name);
  if (rowIndex === -1) throw new Error(`Recurring item not found: ${name}`);

  const nextDueCol = header.indexOf('NextDueDate');
  const lastLoggedCol = header.indexOf('LastLoggedDate');
  const colLetter = (i: number) => String.fromCharCode(65 + i);
  const sheetRow = rowIndex + 1; // rowIndex is 0-based within `rows`, which itself starts at sheet row 1

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tab}'!${colLetter(nextDueCol)}${sheetRow + 1}:${colLetter(lastLoggedCol)}${sheetRow + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[newNextDueDate.toISOString().slice(0, 10), loggedOn.toISOString().slice(0, 10)]] },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/sheets/recurring.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire `markLogged` into the scheduler route**

```typescript
// app/api/recurring/scheduler/route.ts — full updated file
import { NextResponse } from 'next/server';
import { getRecurringItems, markLogged } from '@/lib/sheets/recurring';
import { computeDueRecurringLogs } from '@/lib/scheduler/computeDue';
import { appendTransaction } from '@/lib/sheets/expenseLog';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const items = await getRecurringItems();
  const due = computeDueRecurringLogs(items, new Date());

  for (const { item, newNextDueDate } of due) {
    await appendTransaction({
      date: new Date(),
      amount: item.expectedAmount,
      category: item.category,
      description: `${item.name} (auto)`,
      source: 'Auto-Pending',
    });
    await markLogged(item.name, newNextDueDate, new Date());
  }

  return NextResponse.json({ logged: due.map((d) => d.item.name) });
}
```

- [ ] **Step 6: Confirmation flow**

```typescript
// append to lib/sheets/expenseLog.ts
export async function confirmTransaction(originalDescription: string, originalDate: Date, correctedAmount: number): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = EXPENSE_LOG_RANGE.match(/^'([^']+)'/)?.[1] ?? '';

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: EXPENSE_LOG_RANGE });
  const rows = res.data.values ?? [];
  const targetDateStr = originalDate.toISOString().slice(0, 10);
  const rowIndex = rows.findIndex((row) => row[0] === targetDateStr && row[3] === originalDescription && row[4] === 'Auto-Pending');
  if (rowIndex === -1) throw new Error('Pending transaction not found');

  const rangeStartRow = Number(EXPENSE_LOG_RANGE.match(/(\d+)(?=:)/)?.[1] ?? '2');
  const sheetRow = rangeStartRow + rowIndex;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tab}'!B${sheetRow}:E${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[correctedAmount, rows[rowIndex][2], originalDescription, 'Auto-Confirmed']] },
  });
}
```

```typescript
// app/api/transactions/[date]/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { confirmTransaction } from '@/lib/sheets/expenseLog';

export async function POST(req: NextRequest, { params }: { params: { date: string } }) {
  const { description, amount } = await req.json();
  try {
    await confirmTransaction(description, new Date(params.date), Number(amount));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

```tsx
// app/components/ConfirmationQueue.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Transaction } from '@/lib/sheets/expenseLog';

export function ConfirmationQueue({ pending }: { pending: Transaction[] }) {
  const router = useRouter();
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  async function confirm(t: Transaction) {
    const dateStr = t.date.toISOString().slice(0, 10);
    const amount = Number(amounts[dateStr + t.description] ?? t.amount);
    await fetch(`/api/transactions/${dateStr}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: t.description, amount }),
    });
    router.refresh();
  }

  if (pending.length === 0) return <p className="text-slate-400">Nothing pending confirmation.</p>;

  return (
    <ul className="space-y-2">
      {pending.map((t) => {
        const key = t.date.toISOString().slice(0, 10) + t.description;
        return (
          <li key={key} className="flex items-center gap-3 rounded bg-slate-900 p-3">
            <span className="flex-1">{t.description}</span>
            <input
              type="number"
              defaultValue={t.amount}
              onChange={(e) => setAmounts((a) => ({ ...a, [key]: e.target.value }))}
              className="w-28 rounded border border-slate-700 bg-slate-800 px-2 py-1"
            />
            <button onClick={() => confirm(t)} className="rounded bg-blue-600 px-3 py-1 text-sm">Confirm</button>
          </li>
        );
      })}
    </ul>
  );
}
```

```tsx
// app/components/RecurringForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RecurringForm() {
  const [form, setForm] = useState({ name: '', category: '', expectedAmount: '', frequency: 'Monthly', nextDueDate: '', autoLogEnabled: true });
  const router = useRouter();

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, expectedAmount: Number(form.expectedAmount) }),
    });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-4 md:grid-cols-5">
      <input placeholder="Name" value={form.name} onChange={(e) => update('name', e.target.value)} required className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Category" value={form.category} onChange={(e) => update('category', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Expected Amount" type="number" value={form.expectedAmount} onChange={(e) => update('expectedAmount', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <select value={form.frequency} onChange={(e) => update('frequency', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1">
        <option>Weekly</option>
        <option>Biweekly</option>
        <option>Monthly</option>
        <option>Annually</option>
      </select>
      <input placeholder="Next Due Date" type="date" value={form.nextDueDate} onChange={(e) => update('nextDueDate', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <button type="submit" className="col-span-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium md:col-span-5">+ Add recurring expense</button>
    </form>
  );
}
```

```typescript
// app/api/recurring/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addRecurringItem } from '@/lib/sheets/recurring';

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    await addRecurringItem({
      name: body.name,
      category: body.category,
      expectedAmount: Number(body.expectedAmount),
      frequency: body.frequency,
      nextDueDate: new Date(body.nextDueDate),
      autoLogEnabled: Boolean(body.autoLogEnabled),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

```tsx
// app/recurring/page.tsx
import { getRecurringItems } from '@/lib/sheets/recurring';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { RecurringForm } from '../components/RecurringForm';
import { ConfirmationQueue } from '../components/ConfirmationQueue';

export default async function RecurringPage() {
  const [items, transactions] = await Promise.all([getRecurringItems(), getTransactions()]);
  const pending = transactions.filter((t) => t.source === 'Auto-Pending');

  return (
    <main className="min-h-screen space-y-6 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Recurring & Automation</h1>
      <section>
        <h2 className="mb-2 text-sm uppercase text-slate-400">Needs Confirmation</h2>
        <ConfirmationQueue pending={pending} />
      </section>
      <section>
        <h2 className="mb-2 text-sm uppercase text-slate-400">Recurring Items</h2>
        <RecurringForm />
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.name} className="flex justify-between rounded bg-slate-900 p-3 text-sm">
              <span>{item.name} ({item.category})</span>
              <span>${item.expectedAmount.toFixed(2)} / {item.frequency} — next {item.nextDueDate.toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Verify end to end in the browser**

On `/recurring`, add a recurring item with `nextDueDate` in the past and
auto-logging on. Manually call the scheduler route (as in Task 14 Step 6). Reload
`/recurring` and confirm the item now shows tomorrow's/next month's due date (proof
`markLogged` wrote back correctly) and the new transaction appears in the
confirmation queue. Confirm it with a corrected amount, then check the dev copy
sheet directly to confirm the Expense Log row's `Source` flipped to
`Auto-Confirmed` with the corrected amount.

- [ ] **Step 8: Commit**

```bash
git add lib/sheets/recurring.ts lib/sheets/recurring.test.ts lib/sheets/expenseLog.ts app/api/recurring app/api/transactions app/recurring app/components/RecurringForm.tsx app/components/ConfirmationQueue.tsx
git commit -m "feat: complete recurring-expense confirmation loop"
```

---

### Task 16: Annual Summary Page + Navigation Shell

**Files:**
- Create: `lib/sheets/annualSummary.ts`, `app/annual/page.tsx`, `app/components/NavBar.tsx`
- Modify: `app/layout.tsx` (render `NavBar`)
- Test: `lib/sheets/annualSummary.test.ts`

**Interfaces:**
- Consumes: `ANNUAL_SUMMARY_RANGE` (Task 3), `parseCurrency` (Task 4).
- Produces: `type AnnualRow = { category: string; months: number[]; total: number }`, `getAnnualSummary(): Promise<AnnualRow[]>`.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/sheets/annualSummary.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('./client', () => ({
  getSheetsClient: vi.fn(async () => ({
    spreadsheets: {
      values: {
        get: vi.fn(async () => ({
          data: {
            values: [
              ['Category', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'TOTAL'],
              ['🛒 Groceries', '-', '-', '87.50', '720.70', '327.77', '711.74', '1,226.92', '1,659.71', '51.00', '-', '-', '-', '4,785.34'],
            ],
          },
        })),
      },
    },
  })),
  getSpreadsheetId: vi.fn(() => 'test-id'),
}));

describe('getAnnualSummary', () => {
  it('parses month columns into a numeric array and dashes into zero', async () => {
    const { getAnnualSummary } = await import('./annualSummary');
    const rows = await getAnnualSummary();

    expect(rows).toHaveLength(1);
    expect(rows[0].category).toBe('🛒 Groceries');
    expect(rows[0].months).toEqual([0, 0, 87.5, 720.7, 327.77, 711.74, 1226.92, 1659.71, 51, 0, 0, 0]);
    expect(rows[0].total).toBe(4785.34);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/sheets/annualSummary.test.ts`
Expected: FAIL — `./annualSummary` does not exist.

- [ ] **Step 3: Implement**

```typescript
// lib/sheets/annualSummary.ts
import { getSheetsClient, getSpreadsheetId } from './client';
import { ANNUAL_SUMMARY_RANGE } from './layout';
import { parseCurrency } from './parse';

export type AnnualRow = { category: string; months: number[]; total: number };

export async function getAnnualSummary(): Promise<AnnualRow[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: ANNUAL_SUMMARY_RANGE });
  const rows = res.data.values ?? [];
  const dataRows = rows.filter((row) => row[0] && row[0] !== 'Category' && row[0] !== 'TOTAL');

  return dataRows.map((row) => ({
    category: String(row[0]),
    months: row.slice(1, 13).map((cell) => parseCurrency(String(cell))),
    total: parseCurrency(String(row[13] ?? '')),
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/sheets/annualSummary.test.ts`
Expected: PASS.

- [ ] **Step 5: Page and nav shell**

```tsx
// app/components/NavBar.tsx
import Link from 'next/link';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/categories', label: 'Categories' },
  { href: '/debts', label: 'Debt Tracker' },
  { href: '/recurring', label: 'Recurring' },
  { href: '/annual', label: 'Annual' },
];

export function NavBar() {
  return (
    <nav className="flex gap-4 border-b border-slate-800 bg-slate-950 px-6 py-3 text-sm text-slate-300">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="hover:text-white">{l.label}</Link>
      ))}
    </nav>
  );
}
```

Add `<NavBar />` inside the `<body>` of `app/layout.tsx`, above `{children}`.

```tsx
// app/annual/page.tsx
import { getAnnualSummary } from '@/lib/sheets/annualSummary';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default async function AnnualSummaryPage() {
  const rows = await getAnnualSummary();

  return (
    <main className="min-h-screen space-y-4 overflow-x-auto bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Annual Summary</h1>
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="text-left text-slate-400">
            <th className="p-2">Category</th>
            {MONTHS.map((m) => <th key={m} className="p-2 text-right">{m}</th>)}
            <th className="p-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category} className="border-t border-slate-800">
              <td className="p-2">{row.category}</td>
              {row.months.map((v, i) => <td key={i} className="p-2 text-right">{v ? `$${v.toFixed(2)}` : '-'}</td>)}
              <td className="p-2 text-right font-medium">${row.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 6: Verify in the browser**

Confirm the nav bar appears on every page and links work. Confirm `/annual` renders
a table matching the dev sheet's Annual Summary tab numbers for at least two
categories you can hand-check.

- [ ] **Step 7: Commit**

```bash
git add lib/sheets/annualSummary.ts lib/sheets/annualSummary.test.ts app/annual app/components/NavBar.tsx app/layout.tsx
git commit -m "feat: add Annual Summary page and shared navigation"
```

---

### Task 17: Deployment Prep

**Files:**
- Create: `README.md`, `.env.example`

**Interfaces:** none — this task produces documentation and a build check, not code others depend on.

- [ ] **Step 1: Write `.env.example`**

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_SPREADSHEET_ID=
SESSION_SECRET=
DASHBOARD_PASSWORD=
CRON_SECRET=
```

- [ ] **Step 2: Write `README.md`**

Include: what this project is, the env vars from `.env.example` and where each
comes from (service account JSON, shared household password), how to run locally
(`npm install`, `npm run dev`), how to run the discovery script, how to run tests
(`npm test`), and Vercel deployment steps (connect the GitHub repo, add the same env
vars in the Vercel project settings, confirm the cron job in `vercel.json` is
picked up automatically on deploy).

- [ ] **Step 3: Verify the production build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add README.md .env.example
git commit -m "docs: add README and env var template for deployment"
```

- [ ] **Step 5: Stop here for explicit user action**

Actually creating the Vercel project, connecting GitHub, entering production env
vars (pointed at the **original** spreadsheet, not the dev copy), and running the
first deploy are account-holder actions outside this plan's scope — hand the
finished repo and README to the user for that step rather than attempting it.

---

## Self-Review Notes

- **Spec coverage:** §4.1 Overview → Task 7; §4.2 Categories → Tasks 8-10; §4.3 Debt
  Tracker → Tasks 11-12; §4.4 Recurring & Automation → Tasks 13-15; §4.5 Annual
  Summary → Task 16; §3 Architecture/Auth → Tasks 1, 2, 6; §5 Data model → Tasks 3,
  10, 13; §7 Testing → unit tests throughout + manual browser passes; §8 Deployment
  → Task 17. §9 (out of scope) is deliberately not covered by any task.
- **Type consistency:** `Transaction` (Task 5) is the single shape reused by Tasks
  7, 9, 11, 14, 15. `CategoryBudget` (Task 7) is reused by Tasks 8-10. `Debt` (Task
  11) reused by Task 12. `RecurringItem` (Task 13) reused by Tasks 14-15. Field
  names were kept identical across every reuse.
- **Range/layout risk:** every task that reads or writes a specific tab does so
  through the constants in `lib/sheets/layout.ts` (Task 3) rather than a hardcoded
  string, so if Task 3's discovery finds a different structure than assumed here,
  only that one file needs correcting.
