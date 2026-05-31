import Anthropic from '@anthropic-ai/sdk';
import type { TriageResult } from './triage-engine';

const TRIAGE_TOOL: Anthropic.Tool = {
  name: 'triage_ticket',
  description: 'Classify a support ticket and draft a professional first response',
  input_schema: {
    type: 'object' as const,
    properties: {
      category: {
        type: 'string',
        enum: ['Billing', 'Bug/Technical', 'Feature Request', 'General Query'],
        description: 'Issue category',
      },
      priority: {
        type: 'string',
        enum: ['High', 'Medium', 'Low'],
        description: 'Priority level',
      },
      team: {
        type: 'string',
        enum: ['Billing Team', 'Engineering Team', 'Product Team', 'General Support'],
        description: 'Team to route the ticket to',
      },
      draft_response: {
        type: 'string',
        description: 'Complete professional email response to the customer',
      },
      confidence: {
        type: 'number',
        description: 'Classification confidence score 0–100',
      },
    },
    required: ['category', 'priority', 'team', 'draft_response', 'confidence'],
  },
};

const SYSTEM_PROMPT = `You are a support ticket triage AI. Classify each ticket using these rules:

- Billing (payment, invoice, refund, subscription, charge, overcharged) → High priority → Billing Team
- Bug/Technical (crash, error, broken, not working, exception, 500, upload fails) → High priority → Engineering Team
- Feature Request (add feature, suggestion, enhancement, dark mode, would love, can you add) → Low priority → Product Team
- General Query (how to, help, question, password reset, account, guide) → Medium priority → General Support

Write a complete, empathetic, professional first-response email. Address the customer by name. Match the tone to the issue severity.`;

export async function triageWithClaude(name: string, issue: string): Promise<TriageResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [TRIAGE_TOOL],
    tool_choice: { type: 'tool', name: 'triage_ticket' },
    messages: [
      {
        role: 'user',
        content: `Customer name: ${name}\nIssue description: ${issue}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block');
  }

  return toolUse.input as TriageResult;
}
