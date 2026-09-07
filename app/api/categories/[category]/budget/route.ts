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
