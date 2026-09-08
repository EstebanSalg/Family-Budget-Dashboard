import { NextRequest, NextResponse } from 'next/server';
import { confirmTransaction } from '@/lib/sheets/expenseLog';

export async function POST(req: NextRequest, { params }: { params: { date: string } }) {
  const { description, amount } = await req.json();
  try {
    await confirmTransaction(description, new Date(params.date), Number(amount));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
