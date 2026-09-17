export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // Opt-in only: Fly.io keeps this process running continuously with no
  // external cron trigger (unlike Vercel's vercel.json crons), so it needs
  // its own timer. Leave RUN_IN_PROCESS_SCHEDULER unset on Vercel/local dev
  // to avoid double-logging recurring items alongside vercel.json's cron.
  if (process.env.RUN_IN_PROCESS_SCHEDULER !== 'true') return;

  const { runRecurringScheduler } = await import('@/lib/scheduler/runRecurringScheduler');

  // Hourly is just a check-in cadence -- computeDueRecurringLogs' own
  // due-date and same-day-already-logged filters decide whether anything
  // actually needs logging, so a missed or extra tick is harmless.
  const HOUR_MS = 60 * 60 * 1000;
  setInterval(() => {
    runRecurringScheduler().catch((err) => {
      console.error('[recurring scheduler] in-process run failed:', err);
    });
  }, HOUR_MS);
}
