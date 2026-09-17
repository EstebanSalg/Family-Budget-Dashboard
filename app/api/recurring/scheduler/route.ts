import { NextResponse } from 'next/server';
import { runRecurringScheduler } from '@/lib/scheduler/runRecurringScheduler';

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result = await runRecurringScheduler();
  return NextResponse.json(result);
}
