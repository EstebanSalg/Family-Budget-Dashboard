import { NextRequest, NextResponse } from 'next/server';
import { setSelectedMonth } from '@/lib/sheets/budgets';

export async function PATCH(req: NextRequest) {
  const { month } = await req.json();
  if (typeof month !== 'string') {
    return NextResponse.json({ error: 'month must be a string' }, { status: 400 });
  }
  try {
    await setSelectedMonth(month);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
