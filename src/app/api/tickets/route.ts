import { NextResponse } from 'next/server';
import { getAllTickets, getStats } from '@/lib/store';

export async function GET() {
  const tickets = getAllTickets();
  const stats = getStats();
  return NextResponse.json({ tickets, stats });
}
