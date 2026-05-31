export type Category = 'Billing' | 'Bug/Technical' | 'Feature Request' | 'General Query';
export type Priority = 'High' | 'Medium' | 'Low';
export type Team = 'Billing Team' | 'Engineering Team' | 'Product Team' | 'General Support';

export interface TriageResult {
  category: Category;
  priority: Priority;
  team: Team;
  draft_response: string;
  confidence: number;
}

interface Rule {
  keywords: string[];
  category: Category;
  priority: Priority;
  team: Team;
  weight: number;
}

const RULES: Rule[] = [
  {
    // Billing keywords are highly specific — boost weight so "payment"+"failed" beats generic "failed"
    keywords: [
      'payment', 'invoice', 'billing', 'charge', 'charged', 'refund', 'subscription',
      'credit card', 'debit', 'transaction', 'receipt', 'overcharged', 'fee', 'plan',
      'upgrade plan', 'downgrade plan', 'cancel subscription', 'money', 'cost', 'price',
      'billed', 'bill', 'amount', 'paid', 'pay', 'checkout', 'purchase', 'order',
    ],
    category: 'Billing',
    priority: 'High',
    team: 'Billing Team',
    weight: 15, // Higher weight — billing terms are unambiguous
  },
  {
    // Remove generic terms (failed, cannot, unable) that also appear in billing context
    keywords: [
      'bug', 'crash', 'crashes', 'error', 'broken', 'not working', 'exception',
      '500', '404', 'glitch', 'freeze', 'stuck', 'blank screen', 'won\'t load',
      'does not load', 'keeps crashing', 'pdf upload', 'file upload', 'upload fails',
      'login error', 'sign in error', 'authenticate', 'timeout', 'server error',
      'null pointer', 'stack trace', 'cors', 'api error', 'technical issue',
    ],
    category: 'Bug/Technical',
    priority: 'High',
    team: 'Engineering Team',
    weight: 12,
  },
  {
    keywords: [
      'feature', 'request', 'suggestion', 'would like', 'wish', 'could you add',
      'dark mode', 'new feature', 'enhancement', 'improvement', 'add support',
      'integrate', 'consider adding', 'nice to have', 'future update', 'can you add',
      'please add', 'would be great', 'would love', 'missing feature',
    ],
    category: 'Feature Request',
    priority: 'Low',
    team: 'Product Team',
    weight: 12,
  },
  {
    keywords: [
      'how do i', 'how to', 'help', 'question', 'info', 'information', 'guide',
      'reset password', 'forgot password', 'change password', 'account', 'setup',
      'configure', 'what is', 'where can', 'documentation', 'tutorial', 'explain',
      'understand', 'learn', 'access', 'get started', 'steps to', 'instructions',
    ],
    category: 'General Query',
    priority: 'Medium',
    team: 'General Support',
    weight: 10,
  },
];

function scoreText(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((score, kw) => {
    const regex = new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lower.match(regex);
    return score + (matches ? matches.length : 0);
  }, 0);
}

function buildDraftResponse(
  name: string,
  category: Category,
  priority: Priority,
  team: Team,
): string {
  const greeting = `Hi ${name},\n\nThank you for reaching out to us.`;

  const body: Record<Category, string> = {
    Billing: `We've received your billing inquiry and understand this is urgent. Our ${team} has been notified and will review your account details promptly. We aim to resolve all billing matters within 1 business day.\n\nPlease have your account information ready in case we need to verify your identity.`,
    'Bug/Technical': `We're sorry to hear you're experiencing a technical issue. Our ${team} has been alerted and is investigating this as a high-priority matter. We'll keep you updated on our progress and work to get this resolved as quickly as possible.\n\nIf the issue persists, please try clearing your browser cache or restarting the application.`,
    'Feature Request': `Thank you for your feature suggestion! We truly appreciate feedback from our users — it helps us build a better product. Your request has been forwarded to our ${team} for consideration in our upcoming roadmap.\n\nWe'll reach out if we have any follow-up questions.`,
    'General Query': `We'd be happy to help answer your question. Your ticket has been assigned to our ${team} who will provide a detailed response shortly. Most general queries are resolved within 24 hours.`,
  };

  const closing = `\nIf you have any additional information to share, feel free to reply to this message.\n\nBest regards,\nSupport Team\n[Priority: ${priority} | Team: ${team}]`;

  return `${greeting}\n\n${body[category]}${closing}`;
}

export function triageTicket(
  name: string,
  issue: string,
): TriageResult {
  const scores = RULES.map((rule) => ({
    ...rule,
    score: scoreText(issue, rule.keywords) * rule.weight,
  }));

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  const totalScore = scores.reduce((s, r) => s + r.score, 0);
  const confidence = totalScore > 0 ? Math.min(100, Math.round((best.score / totalScore) * 100)) : 60;

  return {
    category: best.category,
    priority: best.priority,
    team: best.team,
    draft_response: buildDraftResponse(name, best.category, best.priority, best.team),
    confidence: confidence || 60,
  };
}
