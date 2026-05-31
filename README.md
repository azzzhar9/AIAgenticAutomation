# TriageAI — Support Triage Agent

> AI-powered support ticket classification, routing, and response drafting — Andela Capstone 2026

**Muhammad Yasir** · mmyasir101@gmail.com

[![Live Demo](https://img.shields.io/badge/Live%20Demo-triageai--two.vercel.app-blue)](https://triageai-two.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-azzzhar9%2FAIAgenticAutomation-181717)](https://github.com/azzzhar9/AIAgenticAutomation)

---

## What is TriageAI?

TriageAI is an AI-powered support ticket triage system that automatically:

- **Classifies** incoming tickets into Billing, Bug/Technical, Feature Request, or General Query
- **Assigns priority** (High / Medium / Low) based on issue type
- **Routes** each ticket to the correct team queue
- **Drafts** a professional first-response email personalised to the customer
- **Stores** every ticket in Airtable with full audit history
- **Automates** team routing and notifications via n8n workflows

All of this happens in under 2 seconds, powered by the Claude AI API.

---

## Live Demo

| | |
|---|---|
| **App URL** | https://triageai-two.vercel.app |
| **Submit Ticket** | https://triageai-two.vercel.app |
| **Ticket Queue** | https://triageai-two.vercel.app/queue |
| **Demo Video** | `TriageAI-Demo.mp4` (in repo root) |

---

## Ticket Categories

| Issue Type | Priority | Routed To |
|---|---|---|
| Billing (payment, invoice, refund, subscription) | High | Billing Team |
| Bug / Technical (crash, error, 500, upload fails) | High | Engineering Team |
| Feature Request (dark mode, add feature, suggestion) | Low | Product Team |
| General Query (how to, password reset, account help) | Medium | General Support |

---

## Tech Stack

| Tool | Purpose |
|---|---|
| **Next.js 16** | Full-stack framework (App Router, API Routes) |
| **TypeScript** | Type-safe codebase |
| **Tailwind CSS 4** | Responsive UI styling |
| **Claude AI API** | Intelligent ticket classification + response drafting |
| **Airtable** | Persistent ticket storage |
| **n8n** | Workflow automation — routing + notifications |
| **Vercel** | Production deployment + CI/CD |

---

## Project Structure

```
triageai/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Ticket submission form
│   │   ├── queue/page.tsx            # Ticket queue dashboard
│   │   ├── api/
│   │   │   ├── triage/route.ts       # POST /api/triage — core triage endpoint
│   │   │   └── tickets/route.ts      # GET  /api/tickets — queue + stats
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── TicketForm.tsx            # Submission form component
│   │   └── TriageResult.tsx          # Result display + copy-to-clipboard
│   └── lib/
│       ├── claude.ts                 # Claude API triage (tool_use structured output)
│       ├── airtable-client.ts        # Airtable REST CRUD
│       ├── triage-engine.ts          # Keyword-based fallback engine
│       └── store.ts                  # In-memory store (local dev fallback)
├── n8n-workflow.json                 # n8n automation workflow (import-ready)
├── TriageAI-Demo.mp4                 # Demo video
└── .env.local.example                # Environment variables template
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/azzzhar9/AIAgenticAutomation.git
cd AIAgenticAutomation/triageai
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

```env
# Claude AI — https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-...

# Airtable — https://airtable.com
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_TABLE_NAME=Tickets

# n8n Webhook (optional)
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/ticket-submitted
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Airtable Setup

Create a table named **`Tickets`** with these fields:

| Field | Type |
|---|---|
| Ticket ID | Single line text |
| Name | Single line text |
| Email | Email |
| Issue | Long text |
| Category | Single select: `Billing`, `Bug/Technical`, `Feature Request`, `General Query` |
| Priority | Single select: `High`, `Medium`, `Low` |
| Team | Single line text |
| Draft Response | Long text |
| Confidence | Number |
| Timestamp | Single line text |
| Status | Single select: `open`, `in-progress`, `resolved` |

Get your **API key** at [airtable.com/create/tokens](https://airtable.com/create/tokens)
(scopes: `data.records:read` + `data.records:write`)

Your **Base ID** is in the Airtable URL: `airtable.com/appXXXXXXXXXXXXXX/...`

---

## n8n Workflow

Import `n8n-workflow.json` into your n8n instance. The workflow handles:

1. **Webhook Trigger** — receives ticket on every submission
2. **Process Ticket** — extracts and formats all ticket fields
3. **Route by Team** — Switch node routes to the correct team branch
4. **Notify Teams** — sends notification to Billing / Engineering / Product / General Support

```
Ticket Submitted → Process Ticket → Route by Team ──→ Notify Billing Team
                                                   ──→ Notify Engineering Team
                                                   ──→ Notify Product Team
                                                   ──→ Notify General Support
```

---

## API Reference

### `POST /api/triage`

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "issue": "My payment failed twice and I was still charged."
}
```

**Response:**
```json
{
  "ticket": {
    "id": "TKT-1780205429208-XZ1ZE",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "issue": "My payment failed twice...",
    "result": {
      "category": "Billing",
      "priority": "High",
      "team": "Billing Team",
      "draft_response": "Hi Jane Smith,\n\nThank you for reaching out...",
      "confidence": 100
    },
    "timestamp": "2026-05-31T05:30:29.208Z",
    "status": "open"
  }
}
```

### `GET /api/tickets`

```json
{
  "tickets": [...],
  "stats": {
    "total": 12,
    "high": 7,
    "open": 10,
    "resolved": 2,
    "byCategory": { "Billing": 4, "Bug/Technical": 3, "Feature Request": 3, "General Query": 2 }
  }
}
```

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in **Vercel Dashboard → Project → Settings → Environment Variables**.

---

## Test Cases

All 5 spec ticket types classify correctly:

| Input | Expected | Result |
|---|---|---|
| "My payment failed twice" | Billing / High | ✅ |
| "App crashes on PDF upload" | Bug/Technical / High | ✅ |
| "Can you add dark mode?" | Feature Request / Low | ✅ |
| "How do I reset my password?" | General Query / Medium | ✅ |
| "Invoice shows wrong amount" | Billing / High | ✅ |

---

## Key Features

- **AI Triage** — Claude Haiku with `tool_use` for guaranteed structured JSON output
- **Graceful Fallbacks** — keyword engine when no Claude key; in-memory store when no Airtable
- **Rate Limiting** — 20 requests/minute per IP
- **Copy-to-Clipboard** — instant copy of draft responses
- **Live Queue** — auto-refreshes every 10 seconds
- **Priority Filtering** — filter queue by High / Medium / Low
- **Responsive UI** — works on mobile and desktop

---

## License

MIT — Andela Capstone 2026 · Muhammad Yasir
