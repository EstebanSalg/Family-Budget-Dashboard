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
