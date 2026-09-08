# Family Budget Dashboard

A private, dynamic Next.js dashboard for visualizing household finances from a Google Sheet. Track spending by category, manage debt payoff goals, and automatically log recurring bank debits that would otherwise go unnoticed.

## Features

- **Overview Dashboard**: Monthly income, expenses, savings, and budget status at a glance.
- **Categories**: Budget vs. actual spending per category with 6-month trends, transaction search, and inline editing.
- **Debt Tracker**: Manage loans with payoff progress, payment history, and estimated payoff dates.
- **Recurring Expenses & Automation**: Auto-log known recurring debits (rent, car loan, insurance, subscriptions) and confirm them with one-click corrections.
- **Annual Summary**: Year-at-a-glance spending by category.
- **Password Protected**: Single shared household password; no per-user accounts.

## Tech Stack

- **Next.js** 14 (App Router, TypeScript)
- **Google Sheets API** v4 for all data reads and writes
- **Tailwind CSS** for styling
- **Recharts** for charts and visualizations
- **Vitest** for unit tests
- **Vercel** for hosting and scheduled cron jobs

## Environment Variables

Create a `.env.local` file in the project root with the variables listed in `.env.example`. Here's what each one is and where to get it:

### OAuth Credentials (Google Cloud Console)

1. **GOOGLE_OAUTH_CLIENT_ID** and **GOOGLE_OAUTH_CLIENT_SECRET**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create or select a project and enable the **Google Sheets API** (APIs & Services → Library → search "Google Sheets API" → Enable)
   - Configure the OAuth consent screen (APIs & Services → OAuth consent screen):
     - User type: **External**
     - Fill in app name, user support email, and developer contact email
     - Add scope: `https://www.googleapis.com/auth/spreadsheets`
     - Add your Google account under "Test users"
     - **Keep it in "Testing" status** (Production requires domain verification we can't fulfill)
   - Create an OAuth Client ID (APIs & Services → Credentials → Create Credentials → OAuth client ID):
     - Application type: **Web application**
     - Authorized redirect URIs:
       - `https://developers.google.com/oauthplayground` (for getting a refresh token)
       - `http://localhost:3000/api/auth/google/callback` (for local development)
       - `https://<your-deployed-app-domain>/api/auth/google/callback` (add after first Vercel deploy)
   - Copy the **Client ID** and **Client Secret** to `.env.local`

### Refresh Token (OAuth Playground)

2. **GOOGLE_OAUTH_REFRESH_TOKEN**
   - Go to [Google's OAuth Playground](https://developers.google.com/oauthplayground/)
   - Click the gear icon (top right) → check "Use your own OAuth credentials"
   - Paste in the Client ID and Client Secret from above
   - Find "Google Sheets API v4" in the left panel and select the `https://www.googleapis.com/auth/spreadsheets` scope → click **Authorize APIs**
   - Sign in with the Google account that owns your spreadsheet and consent (click through the "unverified app" warning)
   - Click **Exchange authorization code for tokens** → copy the **Refresh token** and paste it to `.env.local`

### Spreadsheet ID

3. **GOOGLE_SPREADSHEET_ID**
   - Open your Google Sheet in the browser
   - The ID is the long string in the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
   - Development: use the dev copy sheet ID during setup and testing
   - Production: point to the original sheet after verifying all write paths

### Security & Session

4. **SESSION_SECRET**
   - Generate a random 64-character hex string (e.g., using `openssl rand -hex 32`)
   - Used to sign the authentication cookie

5. **DASHBOARD_PASSWORD**
   - The shared household password that gates access to the dashboard
   - If the password contains a literal `$`, escape it as `\$` (Next.js env-file parsing treats `$` as variable interpolation start)

### Scheduled Jobs

6. **CRON_SECRET**
   - Generate a random 64-character hex string (e.g., using `openssl rand -hex 32`)
   - Used to authenticate scheduled cron job requests from Vercel

## Running Locally

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The app will hot-reload as you edit.

### Run the Discovery Script
This utility analyzes your Google Sheet's layout and identifies categories, debts, and recurring expenses:
```bash
npm run discover-layout
```

### Run Tests
```bash
npm test
```

## Deployment to Vercel

### First-Time Setup

1. **Push to GitHub**: Ensure this repo is pushed to your GitHub account
2. **Create Vercel Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import the GitHub repository
   - Vercel will auto-detect Next.js and suggest sensible defaults — confirm
3. **Add Environment Variables**:
   - In the Vercel project settings (Settings → Environment Variables), add all 7 variables from `.env.local`
   - For production, point `GOOGLE_SPREADSHEET_ID` to your **original** sheet (not the dev copy)
   - Do NOT include the values in version control — Vercel provides a secure store
4. **Deploy**: Click "Deploy" — Vercel will build and host the app
5. **Confirm Cron Job**: After deployment, go to project Settings → Cron Jobs and verify the recurring-expense scheduler is listed (picked up automatically from `vercel.json`)

### Notes on OAuth in Production

- The app authenticates as your own Google account (OAuth 2.0 with refresh token), not as a separate service account
- In "Testing" status, refresh tokens expire after **7 days**; Task 18 (Reconnect flow) adds an in-app recovery page (`/reconnect`) to get a fresh token without returning to Google Cloud Console
- To update the refresh token after it expires: visit the `/reconnect` page, sign in with Google again, and the page will display the new refresh token — it is **not** saved anywhere automatically. Copy it and manually update `GOOGLE_OAUTH_REFRESH_TOKEN` in Vercel's project environment variables, then redeploy for it to take effect

### Subsequent Deployments

Push changes to the `main` branch (or your configured branch) — Vercel will automatically rebuild and deploy.

## Testing OAuth Limitations

Because the app stays in Google OAuth "Testing" status (required for a household-only app without domain verification):
- Refresh tokens expire after 7 days of inactivity
- When the token expires, the dashboard will show an error on data load
- Visit `/reconnect` to re-authenticate and get a fresh token (a 30-second in-app fix)

## Project Structure

```
app/                      # Next.js App Router pages and layouts
├── (auth)/               # Authentication pages
├── api/                  # API routes (Sheets reads/writes, cron jobs, OAuth)
├── layout.tsx            # Root layout
└── page.tsx              # Overview dashboard

lib/
├── sheets/               # Google Sheets API client and utilities
├── auth.ts              # Session and password handling
└── ...                  # Utilities for parsing, formatting, etc.

scripts/
├── discover-layout.ts   # Utility to inspect sheet structure

public/                   # Static assets

tests/ (or .test.ts files)
                          # Unit tests for parsing, scheduling, etc.

vercel.json              # Cron job configuration
.env.example             # Template for required env variables
.env.local (not committed) # Your actual secrets
```

## Troubleshooting

### Build Fails Locally
Run `npm run lint` to check for TypeScript and ESLint errors, then `npm run build` to verify the production build. Most issues are type mismatches.

### "Unauthorized" Error on Data Load
- Verify all 7 env variables are set in `.env.local`
- Double-check the `GOOGLE_OAUTH_REFRESH_TOKEN` — if you see "invalid_grant" in logs, the token has expired
  - Visit `/reconnect` to refresh it (Task 18)
  - Or re-run the OAuth Playground flow to get a new token

### Cron Job Not Running
After deployment, check:
1. Vercel project Settings → Cron Jobs — the scheduler job should be listed
2. Check the cron job logs in the Vercel deployment (Monitoring → Function Logs)
3. Verify `CRON_SECRET` env var matches what the cron route expects

### Sheet Updates Not Appearing
- Reads are cached for ~30-60 seconds — wait a moment and refresh
- Check the browser console for API errors (F12 → Console)
- Verify the Sheets API is enabled in Google Cloud Console

## Further Reading

- [Design Spec](docs/superpowers/specs/2026-09-05-family-budget-dashboard-design.md) — Feature and architecture details
- [Implementation Plan](docs/superpowers/plans/2026-09-05-family-budget-dashboard.md) — Task-by-task breakdown and setup prerequisites
- [Google Sheets API Docs](https://developers.google.com/sheets/api)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)

## License

Private household use.
