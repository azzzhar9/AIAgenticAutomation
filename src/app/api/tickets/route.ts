import { NextResponse } from 'next/server';
import { getAllTickets, getStats, computeStats } from '@/lib/store';
import { isAirtableConfigured, getAllTicketsFromAirtable } from '@/lib/airtable-client';

export async function GET() {
  if (isAirtableConfigured()) {
    try {
      const tickets = await getAllTicketsFromAirtable();
      const stats = computeStats(tickets);
      return NextResponse.json({ tickets, stats });
    } catch (err) {
      console.error('[tickets] Airtable fetch failed, falling back to in-memory:', err);
    }
  }

  return NextResponse.json({ tickets: getAllTickets(), stats: getStats() });
}
