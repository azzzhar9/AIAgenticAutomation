import { NextRequest, NextResponse } from 'next/server';
import { triageTicket } from '@/lib/triage-engine';
import { triageWithClaude } from '@/lib/claude';
import { addTicket, generateId, Ticket } from '@/lib/store';
import { isAirtableConfigured, saveTicketToAirtable } from '@/lib/airtable-client';

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/ticket-submitted';

async function fireN8nWebhook(ticket: Ticket): Promise<void> {
  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',   // required for localtunnel public URLs
        'User-Agent': 'TriageAI-Webhook/1.0',
      },
      body: JSON.stringify({ ticket }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn(`[n8n] Webhook responded with ${res.status}`);
    } else {
      console.log(`[n8n] Ticket ${ticket.id} routed to ${ticket.result.team}`);
    }
  } catch (err) {
    console.warn('[n8n] Webhook unreachable — skipping automation:', (err as Error).message);
  }
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { name, email, issue } = body as Record<string, string>;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 422 });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 422 });
  }
  if (!issue || typeof issue !== 'string' || issue.trim().length < 10) {
    return NextResponse.json({ error: 'Issue description must be at least 10 characters.' }, { status: 422 });
  }
  if (issue.trim().length > 2000) {
    return NextResponse.json({ error: 'Issue description must not exceed 2000 characters.' }, { status: 422 });
  }

  const safeName = name.trim().slice(0, 100);
  const safeEmail = email.trim().slice(0, 254);
  const safeIssue = issue.trim().slice(0, 2000);

  // Triage: Claude API first, keyword engine as fallback
  let result;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      result = await triageWithClaude(safeName, safeIssue);
    } catch (err) {
      console.error('[triage] Claude API failed, falling back to keyword engine:', err);
      result = triageTicket(safeName, safeIssue);
    }
  } else {
    result = triageTicket(safeName, safeIssue);
  }

  const ticket: Ticket = {
    id: generateId(),
    name: safeName,
    email: safeEmail,
    issue: safeIssue,
    result,
    timestamp: new Date().toISOString(),
    status: 'open',
  };

  // Storage: Airtable if configured, in-memory fallback
  if (isAirtableConfigured()) {
    try {
      await saveTicketToAirtable(ticket);
    } catch (err) {
      console.error('[triage] Airtable save failed, falling back to in-memory:', err);
      addTicket(ticket);
    }
  } else {
    addTicket(ticket);
  }

  // Fire-and-forget: trigger n8n workflow for routing & notifications
  fireN8nWebhook(ticket);

  return NextResponse.json({ ticket }, { status: 201 });
}
