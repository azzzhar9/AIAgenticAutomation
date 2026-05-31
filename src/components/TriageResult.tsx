'use client';

import { useState } from 'react';
import { Ticket } from '@/lib/store';
import { Category, Priority } from '@/lib/triage-engine';

interface Props {
  ticket: Ticket;
  onReset: () => void;
}

const categoryColors: Record<Category, string> = {
  Billing: 'bg-purple-100 text-purple-800 border-purple-200',
  'Bug/Technical': 'bg-red-100 text-red-800 border-red-200',
  'Feature Request': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'General Query': 'bg-sky-100 text-sky-800 border-sky-200',
};

const priorityColors: Record<Priority, string> = {
  High: 'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
};

const priorityDot: Record<Priority, string> = {
  High: 'bg-red-500',
  Medium: 'bg-amber-500',
  Low: 'bg-green-500',
};

export default function TriageResult({ ticket, onReset }: Props) {
  const [copied, setCopied] = useState(false);
  const { result } = ticket;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.draft_response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-green-800">Ticket triaged successfully!</p>
          <p className="text-sm text-green-600">ID: <span className="font-mono">{ticket.id}</span></p>
        </div>
      </div>

      {/* Classification Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Category</p>
          <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full border ${categoryColors[result.category]}`}>
            {result.category}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Priority</p>
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${priorityColors[result.priority]}`}>
            <span className={`w-2 h-2 rounded-full ${priorityDot[result.priority]}`} />
            {result.priority}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Confidence</p>
          <span className="text-lg font-bold text-slate-800">{result.confidence}%</span>
        </div>
      </div>

      {/* Routing */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <span className="text-xs text-blue-500 uppercase tracking-wide font-medium">Routed to</span>
          <p className="font-semibold text-blue-900">{result.team}</p>
        </div>
      </div>

      {/* Draft Response */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Draft Response
          </h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="px-5 py-4 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
          {result.draft_response}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Submit Another Ticket
        </button>
        <a
          href="/queue"
          className="flex-1 text-center bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-lg border border-slate-200 transition-colors"
        >
          View Queue
        </a>
      </div>
    </div>
  );
}
