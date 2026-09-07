import { NextRequest, NextResponse } from 'next/server';
import { addDebt } from '@/lib/sheets/debts';

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    await addDebt({
      name: body.name,
      principal: Number(body.principal),
      currentBalance: Number(body.currentBalance),
      payment: Number(body.payment),
      frequency: body.frequency,
      startDate: new Date(body.startDate),
      rate: Number(body.rate),
      keyword: body.keyword,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
