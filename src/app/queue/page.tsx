'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '@/lib/store';
import { Category, Priority } from '@/lib/triage-engine';

interface Stats {
  total: number;
  high: number;
  open: number;
  resolved: number;
  byCategory: Record<string, number>;
}

const categoryColors: Record<Category, string> = {
  Billing: 'bg-purple-100 text-purple-800',
  'Bug/Technical': 'bg-red-100 text-red-800',
  'Feature Request': 'bg-emerald-100 text-emerald-800',
  'General Query': 'bg-sky-100 text-sky-800',
};

const priorityColors: Record<Priority, string> = {
  High: 'text-red-600 bg-red-50 border-red-200',
  Medium: 'text-amber-600 bg-amber-50 border-amber-200',
  Low: 'text-green-600 bg-green-50 border-green-200',
};

export default function QueuePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Priority>('all');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setStats(data.stats ?? null);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.result.priority === filter);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ticket Queue</h1>
          <p className="text-slate-500 text-sm mt-1">All submitted and triaged tickets</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-300 px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Tickets" value={stats.total} color="blue" />
          <StatCard label="High Priority" value={stats.high} color="red" />
          <StatCard label="Open" value={stats.open} color="amber" />
          <StatCard label="Resolved" value={stats.resolved} color="green" />
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'High', 'Medium', 'Low'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors font-medium ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading tickets…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">No tickets yet</p>
          <p className="text-slate-400 text-sm mt-1">
            <a href="/" className="text-blue-500 hover:underline">Submit a ticket</a> to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-green-50 border-green-200 text-green-700',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const [expanded, setExpanded] = useState(false);
  const cat = ticket.result.category as Category;
  const pri = ticket.result.priority as Priority;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-slate-400">{ticket.id}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[cat] ?? 'bg-slate-100 text-slate-600'}`}>
              {ticket.result.category}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityColors[pri] ?? ''}`}>
              {ticket.result.priority}
            </span>
          </div>
          <p className="font-medium text-slate-800 mt-1 truncate">{ticket.name}</p>
          <p className="text-sm text-slate-500 truncate">{ticket.issue}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-400">{new Date(ticket.timestamp).toLocaleDateString()}</p>
          <p className="text-xs text-slate-400">{new Date(ticket.timestamp).toLocaleTimeString()}</p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-slate-50">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Customer</p>
            <p className="text-sm text-slate-700">{ticket.name} · <a href={`mailto:${ticket.email}`} className="text-blue-500 hover:underline">{ticket.email}</a></p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Issue</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.issue}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Routed to</p>
            <p className="text-sm font-medium text-blue-700">{ticket.result.team}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Draft Response</p>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-white border border-slate-200 rounded-lg p-4 leading-relaxed">
              {ticket.result.draft_response}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
