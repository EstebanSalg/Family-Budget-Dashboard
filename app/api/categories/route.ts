import { NextRequest, NextResponse } from 'next/server';
import { addCategory } from '@/lib/sheets/budgets';

export async function POST(req: NextRequest) {
  const { emoji, name, startingBudget } = await req.json();
  if (!name || typeof startingBudget !== 'number') {
    return NextResponse.json({ error: 'name and startingBudget are required' }, { status: 400 });
  }
  // addCategory interpolates the category label (emoji + name) directly into
  // Sheets formula text inside SUMPRODUCT(...) string-literal comparisons
  // (e.g. 'Expense Log'!C2:C10029="<category>"). A double-quote in either
  // field would break that formula's string quoting and corrupt the row's
  // (and TOTAL's) formulas. Reject at the API boundary rather than trying to
  // escape quotes inside generated formula text.
  if ((typeof name === 'string' && name.includes('"')) || (typeof emoji === 'string' && emoji.includes('"'))) {
    return NextResponse.json({ error: 'Category name cannot contain a quotation mark' }, { status: 400 });
  }
  try {
    await addCategory({ emoji: emoji || '📁', name, startingBudget });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
