// Native RecruitKrBot engine: intent detection → router → response builder.
// Pure in-memory rule/keyword logic over the structured knowledge base — no
// external AI provider, no database reads, no private data. Fast (<1ms typical).

import { GLOBAL_FAQS, KB, PAGES } from './knowledge.js';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'is', 'are', 'do', 'does',
  'how', 'what', 'where', 'can', 'i', 'my', 'me', 'you', 'your', 'please', 'help', 'with',
  'this', 'that', 'it', 'about', 'tell', 'show', 'get', 'want', 'need', 'page',
]);

const NAV_VERBS = /\b(open|go to|goto|take me to|navigate( to)?|show me|visit|launch|bring me to)\b/;
const JOB_HINT = /\b(job|jobs|vacancy|vacancies|opening|openings|role|roles|hiring|career|careers)\b/;

const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (s) => normalize(s).split(' ').filter((w) => w.length >= 2 && !STOPWORDS.has(w));

const pageByRoute = (route) => {
  if (!route) return null;
  const clean = String(route).split('?')[0].replace(/\/+$/, '') || '/';
  return PAGES.find((p) => p.route === clean) || null;
};

/** Best page match for "open X" / "explain X". Returns {page, score} or null. */
const resolvePage = (text) => {
  const t = normalize(text);
  const qt = tokens(text);
  let best = null;
  for (const page of PAGES) {
    let score = 0;
    for (const kw of [page.title, ...page.keywords]) {
      const nk = normalize(kw);
      if (t.includes(nk)) score += nk.split(' ').length * 2; // phrase hit
    }
    const kwTokens = new Set(tokens([page.title, ...page.keywords].join(' ')));
    for (const w of qt) if (kwTokens.has(w)) score += 1;
    if (score > 0 && (!best || score > best.score)) best = { page, score };
  }
  return best;
};

/** Keyword search across all FAQs (global + page-level). Returns {faq, score} or null. */
const searchFaqs = (text) => {
  const qt = tokens(text);
  if (qt.length === 0) return null;
  const t = normalize(text);

  const candidates = [
    ...KB.map((f) => ({ ...f, page: null })),
    ...GLOBAL_FAQS.map((f) => ({ ...f, page: null })),
    ...PAGES.flatMap((p) => (p.faqs || []).map((f) => ({ ...f, page: p }))),
  ];

  let best = null;
  for (const f of candidates) {
    const hay = normalize(`${f.q} ${(f.keywords || []).join(' ')} ${f.a}`);
    const hayTokens = new Set(tokens(`${f.q} ${(f.keywords || []).join(' ')}`));
    let score = 0;
    for (const w of qt) if (hayTokens.has(w)) score += 1;
    for (const kw of f.keywords || []) if (t.includes(normalize(kw))) score += 3; // explicit keyword phrase
    // small bonus for answer-body overlap
    for (const w of qt) if (hay.includes(w)) score += 0.25;
    if (score > 0 && (!best || score > best.score)) best = { faq: f, score };
  }
  return best && best.score >= 1.25 ? best : null;
};

const SUGGESTIONS = {
  default: ['How do I apply for a job?', 'How do I post a job?', 'Where do I upload my resume?'],
  candidate: ['Find React jobs', 'Where do I see my applications?', 'How do I chat with an employer?'],
  employer: ['How do I post a job?', 'How do I search candidates?', 'How do I schedule an interview?'],
};

const navAction = (to, label) => ({ type: 'navigate', to, label });

/**
 * Main entry. message: user text. page: current route (for "explain this page").
 * Returns { reply, intent, action?, suggestions, source }.
 */
export const handleMessage = ({ message, page } = {}) => {
  const raw = String(message || '').trim();
  const t = normalize(raw);

  if (!raw) {
    return {
      intent: 'empty',
      reply: 'Ask me anything about RecruitKr — finding jobs, hiring, your dashboard, or how something works.',
      suggestions: SUGGESTIONS.default,
      source: 'system',
    };
  }

  // 1) Greetings
  if (/^(hi|hello|hey|hii|yo|namaste|good (morning|afternoon|evening))\b/.test(t)) {
    return {
      intent: 'greeting',
      reply: "👋 Hi! I'm RecruitKrBot. I can help you find jobs, hire candidates, navigate the site, or explain how things work. What would you like to do?",
      suggestions: SUGGESTIONS.default,
      source: 'system',
    };
  }

  // 2) Thanks
  if (/\b(thanks|thank you|thx|ty)\b/.test(t)) {
    return { intent: 'thanks', reply: "You're welcome! Anything else I can help with?", suggestions: SUGGESTIONS.default, source: 'system' };
  }

  // 3) "Explain this page" — uses the current route as context
  if (/\b(this page|here|current page)\b/.test(t) && /\b(explain|what|tell|about|do)\b/.test(t)) {
    const current = pageByRoute(page);
    if (current) {
      return {
        intent: 'explain',
        reply: `**${current.title}** — ${current.purpose}\n\n${current.description}`,
        suggestions: SUGGESTIONS.default,
        source: 'knowledge',
      };
    }
  }

  // 4) Job search ("find react jobs", "jobs for sales", "show me openings").
  // "how/what/where ..." questions fall through to the FAQ instead.
  if (
    JOB_HINT.test(t) &&
    /\b(find|search|looking|show|browse|want|apply|for|need)\b/.test(t) &&
    !/^(how|what|why|when|where|explain|do)\b/.test(t)
  ) {
    const query = tokens(raw)
      .filter((w) => !['job', 'jobs', 'vacancy', 'vacancies', 'opening', 'openings', 'find', 'search', 'browse', 'looking', 'apply', 'role', 'roles', 'hiring', 'career', 'careers'].includes(w))
      .join(' ');
    const to = query ? `/jobs?search=${encodeURIComponent(query)}` : '/jobs';
    return {
      intent: 'search_jobs',
      reply: query
        ? `Here are jobs matching “${query}”. I’ll open the Jobs page with that search.`
        : 'I’ll open the Jobs page so you can browse and search all verified roles.',
      action: navAction(to, query ? `Search “${query}”` : 'Browse jobs'),
      suggestions: SUGGESTIONS.candidate,
      source: 'search',
    };
  }

  // 5) Explicit navigation ("open jobs", "go to my dashboard")
  if (NAV_VERBS.test(t)) {
    const hit = resolvePage(raw);
    if (hit) {
      const { page: p } = hit;
      return {
        intent: 'navigate',
        reply: `Opening **${p.title}**${p.auth ? ' (you’ll need to be logged in)' : ''}.`,
        action: navAction(p.route, `Open ${p.title}`),
        suggestions: SUGGESTIONS.default,
        source: 'navigation',
      };
    }
  }

  // 6) FAQ / knowledge answer
  const faqHit = searchFaqs(raw);
  if (faqHit) {
    const { faq } = faqHit;
    return {
      intent: 'faq',
      reply: faq.a,
      action: faq.action || (faq.page ? navAction(faq.page.route, `Open ${faq.page.title}`) : undefined),
      suggestions: SUGGESTIONS.default,
      source: 'faq',
    };
  }

  // 7) "Explain X" page knowledge (no nav verb) — describe the matched page
  const pageHit = resolvePage(raw);
  if (pageHit && pageHit.score >= 2) {
    const p = pageHit.page;
    return {
      intent: 'explain',
      reply: `**${p.title}** — ${p.purpose}\n\n${p.description}`,
      action: navAction(p.route, `Open ${p.title}`),
      suggestions: SUGGESTIONS.default,
      source: 'knowledge',
    };
  }

  // 8) Fallback
  return {
    intent: 'fallback',
    reply:
      "I’m not sure about that yet. I can help you find jobs, post a job, navigate the site (try “open jobs” or “take me to my dashboard”), or answer questions about how RecruitKr works. For anything else, the Contact page is the best place to reach a human.",
    action: navAction('/contact', 'Contact us'),
    suggestions: SUGGESTIONS.default,
    source: 'system',
  };
};
