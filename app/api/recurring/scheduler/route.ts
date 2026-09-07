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
