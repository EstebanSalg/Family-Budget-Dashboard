import { getRecurringItems, markLogged } from '@/lib/sheets/recurring';
import { computeDueRecurringLogs } from '@/lib/scheduler/computeDue';
import { appendTransaction } from '@/lib/sheets/expenseLog';

export type RecurringSchedulerResult = {
  succeeded: string[];
  failed: { name: string; error: string }[];
};

// Shared by the /api/recurring/scheduler route (for an external cron caller,
// e.g. Vercel's vercel.json crons) and instrumentation.ts's in-process timer
// (for an always-on host like Fly.io, which has no external cron trigger).
export async function runRecurringScheduler(): Promise<RecurringSchedulerResult> {
  const items = await getRecurringItems();
  const due = computeDueRecurringLogs(items, new Date());

  const succeeded: string[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const { item, newNextDueDate } of due) {
    try {
      await appendTransaction({
        date: new Date(),
        amount: item.expectedAmount,
        category: item.category,
        description: `${item.name} (auto)`,
        source: 'Auto-Pending',
      });
      await markLogged(item.name, newNextDueDate, new Date());
      succeeded.push(item.name);
    } catch (err) {
      // Isolate per-item failures so one bad item (e.g. markLogged failing
      // after appendTransaction already wrote the expense row, or a
      // duplicate-name row match) can't silently abort every other due item
      // for the day. Log server-side (no secrets) so a partial failure is
      // visible in the host's logs, and report it in the response instead of
      // throwing.
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[recurring scheduler] failed to log "${item.name}": ${message}`);
      failed.push({ name: item.name, error: message });
    }
  }

  return { succeeded, failed };
}
