import { TriageResult } from './triage-engine';

export interface Ticket {
  id: string;
  name: string;
  email: string;
  issue: string;
  result: TriageResult;
  timestamp: string;
  status: 'open' | 'in-progress' | 'resolved';
}

// In-memory store for the current process (serverless-safe approach)
// For persistence across restarts, we write to a JSON file in dev
let tickets: Ticket[] = [];

export function getAllTickets(): Ticket[] {
  return [...tickets].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function addTicket(ticket: Ticket): void {
  tickets.unshift(ticket);
}

export function generateId(): string {
  return `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function getStats() {
  const total = tickets.length;
  const high = tickets.filter((t) => t.result.priority === 'High').length;
  const open = tickets.filter((t) => t.status === 'open').length;
  const resolved = tickets.filter((t) => t.status === 'resolved').length;

  const byCategory = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.result.category] = (acc[t.result.category] || 0) + 1;
    return acc;
  }, {});

  return { total, high, open, resolved, byCategory };
}
