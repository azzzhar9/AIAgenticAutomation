import type { Ticket } from './store';

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE_NAME || 'Tickets';

export function isAirtableConfigured(): boolean {
  return !!(API_KEY && BASE_ID);
}

function tableUrl(): string {
  return `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function saveTicketToAirtable(ticket: Ticket): Promise<void> {
  const res = await fetch(tableUrl(), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      records: [
        {
          fields: {
            'Ticket ID': ticket.id,
            Name: ticket.name,
            Email: ticket.email,
            Issue: ticket.issue,
            Category: ticket.result.category,
            Priority: ticket.result.priority,
            Team: ticket.result.team,
            'Draft Response': ticket.result.draft_response,
            Confidence: ticket.result.confidence,
            Timestamp: ticket.timestamp,
            Status: ticket.status,
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Airtable save failed (${res.status}): ${JSON.stringify(err)}`);
  }
}

export async function getAllTicketsFromAirtable(): Promise<Ticket[]> {
  const tickets: Ticket[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(tableUrl());
    url.searchParams.set('sort[0][field]', 'Timestamp');
    url.searchParams.set('sort[0][direction]', 'desc');
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Airtable fetch failed (${res.status}): ${JSON.stringify(err)}`);
    }

    const data = await res.json() as {
      records: Array<{ id: string; fields: Record<string, unknown> }>;
      offset?: string;
    };

    offset = data.offset;

    for (const record of data.records) {
      const f = record.fields;
      tickets.push({
        id: (f['Ticket ID'] as string) ?? record.id,
        name: (f['Name'] as string) ?? '',
        email: (f['Email'] as string) ?? '',
        issue: (f['Issue'] as string) ?? '',
        result: {
          category: (f['Category'] as 'Billing' | 'Bug/Technical' | 'Feature Request' | 'General Query') ?? 'General Query',
          priority: (f['Priority'] as 'High' | 'Medium' | 'Low') ?? 'Medium',
          team: (f['Team'] as 'Billing Team' | 'Engineering Team' | 'Product Team' | 'General Support') ?? 'General Support',
          draft_response: (f['Draft Response'] as string) ?? '',
          confidence: (f['Confidence'] as number) ?? 60,
        },
        timestamp: (f['Timestamp'] as string) ?? new Date().toISOString(),
        status: (f['Status'] as 'open' | 'in-progress' | 'resolved') ?? 'open',
      });
    }
  } while (offset);

  return tickets;
}
