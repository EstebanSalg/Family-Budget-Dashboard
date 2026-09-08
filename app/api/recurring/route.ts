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
