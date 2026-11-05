/**
 * Site Studio content registry: every key the no-code editor may write, the
 * fields under it, and the one validator both sides use.
 *
 * The backend validates with it on save AND publish (strict: anything unknown
 * or malformed is an error). The website imports this same file and cleans
 * published values with it (lenient: a bad field is dropped and the hardcoded
 * default shows). It has no dependencies on purpose: the backend runs zod 4, the
 * website zod 3, and a shared file must not care which one it lands next to.
 *
 * Keys read page.section; fields are what the Studio inspector edits.
 */

export const FONT_ALLOWLIST = [
  'Inter',
  'Sora',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Nunito',
  'DM Sans',
  'Manrope',
  'Playfair Display',
  'Merriweather',
];

// Home page sections after the hero, in their current order. The hero holds the
// page's only <h1>, so it always stays first and visible.
export const HOME_SECTION_IDS = [
  'latest-jobs',
  'job-showcase',
  'why-us',
  'placement',
  'testimonials',
  'closing-cta',
];

const text = (label, max = 200, extra = {}) => ({ type: 'text', label, max, ...extra });
const image = (label) => ({ type: 'image', label });
const color = (label) => ({ type: 'color', label });
const font = (label) => ({ type: 'font', label, options: FONT_ALLOWLIST });
const toggle = (label) => ({ type: 'toggle', label });
const number = (label, min, max, step = 1, unit = '') => ({
  type: 'number',
  label,
  min,
  max,
  step,
  unit,
});
const url = (label) => ({ type: 'url', label });
const path = (label) => ({ type: 'path', label });
const email = (label) => ({ type: 'email', label });
const tel = (label) => ({ type: 'tel', label });
const select = (label, options) => ({ type: 'select', label, options });
const list = (label, item, max) => ({ type: 'list', label, item, max });

export const SITE_CONTENT_SCHEMA = {
  brand: {
    label: 'Brand',
    group: 'Brand',
    fields: {
      siteName: text('Site name (logo alt text)', 60),
      logo: image('Logo (light background)'),
      logoDark: image('Logo (dark background)'),
      favicon: image('Favicon (square PNG)'),
    },
  },
  theme: {
    label: 'Theme',
    group: 'Theme',
    fields: {
      primary: color('Primary (navy)'),
      secondary: color('Secondary (green)'),
      background: color('Page background'),
      foreground: color('Body text'),
      fontBody: font('Body font'),
      fontDisplay: font('Heading font'),
      radius: number('Corner radius', 0, 2, 0.05, 'rem'),
    },
  },
  nav: {
    label: 'Navigation bar',
    group: 'Pages',
    fields: {
      items: list(
        'Menu links',
        { label: text('Label', 30), path: path('Link (e.g. /employers)'), visible: toggle('Show') },
        10,
      ),
    },
  },
  'home.hero': {
    label: 'Home · Hero',
    group: 'Pages',
    fields: {
      badgeFree: text('Badge: free for job seekers', 60),
      headlineStart: text('Headline: before the role', 40),
      headlineMiddle: text('Headline: between role and city', 40),
      headlineEnd: text('Headline: ending (green)', 60),
      helper: text('Line under the headline', 200),
      buttonPrefix: text('Button word before the role ("Show")', 20),
      searchPlaceholder: text('Search box placeholder', 60),
      roles: list('Roles the headline cycles through', { name: text('Role', 30) }, 20),
      photos: list(
        'Photos in the headline',
        { src: image('Photo'), alt: text('Describe the photo', 140) },
        6,
      ),
    },
  },
  'home.sections': {
    label: 'Home · Section order',
    group: 'Pages',
    fields: {
      order: list(
        'Sections below the hero',
        { id: select('Section', HOME_SECTION_IDS), visible: toggle('Show') },
        HOME_SECTION_IDS.length,
      ),
    },
  },
  footer: {
    label: 'Footer',
    group: 'Pages',
    fields: {
      heading: text('Heading', 60),
      intro: text('Intro text', 400),
      phones: list(
        'Phone numbers',
        { label: text('Label', 40), display: text('Shown as', 30), tel: tel('Number to dial') },
        4,
      ),
      emails: list('Email addresses', { label: text('Label', 40), email: email('Email') }, 4),
      ctaLabel: text('Button label', 40),
      visitHeading: text('Visit heading', 60),
      visitIntro: text('Visit intro', 200),
      copyright: text('Copyright line (after the year)', 120),
      social: list(
        'Social links',
        {
          network: select('Network', ['linkedin', 'facebook', 'instagram']),
          href: url('Profile URL'),
        },
        3,
      ),
    },
  },
};

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
// Control characters never belong in copy; tabs and newlines are fine.
const stripControl = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

const HTTP_URL = /^https?:\/\/[^\s<>"']+$/i;
const LOCAL_PATH = /^\/(?!\/)[A-Za-z0-9\-._~/%]*$/;
const INTERNAL_LINK = /^\/(?!\/)[A-Za-z0-9\-._~/%?=&#]*$/;

const escapeAttr = (s) =>
  s
    .replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
const escapeText = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
const RICH_TAGS = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a']);

/**
 * Rich text keeps a few formatting tags and nothing else: no attributes except
 * an http(s)/mailto/site-relative href on <a>, no script/style/iframe content,
 * no event handlers. Stray angle brackets in text are escaped.
 */
export const sanitizeRichText = (input) => {
  const html = String(input ?? '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(
      /<(script|style|iframe|object|embed|template|noscript|svg|math|textarea|select)\b[\s\S]*?<\/\1\s*>/gi,
      '',
    );
  const out = [];
  let last = 0;
  const tagRe = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*)>/g;
  let m;
  while ((m = tagRe.exec(html))) {
    out.push(escapeText(html.slice(last, m.index)));
    last = tagRe.lastIndex;
    const [, closing, rawName, attrs] = m;
    const name = rawName.toLowerCase();
    if (!RICH_TAGS.has(name)) continue;
    if (closing) {
      if (name !== 'br') out.push(`</${name}>`);
      continue;
    }
    if (name === 'a') {
      const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrs);
      const value = href ? (href[1] ?? href[2] ?? href[3] ?? '').trim() : '';
      out.push(
        /^(https?:\/\/|mailto:|\/(?!\/))/i.test(value)
          ? `<a href="${escapeAttr(value)}" rel="noopener noreferrer">`
          : '<a>',
      );
      continue;
    }
    out.push(`<${name}>`);
  }
  out.push(escapeText(html.slice(last)));
  return out.join('');
};

/** One field: returns { ok, value } or { ok: false, error }; never throws. */
const checkField = (spec, raw) => {
  switch (spec.type) {
    case 'text': {
      if (typeof raw !== 'string') return { ok: false, error: 'must be text' };
      const v = stripControl(raw).trim();
      return v.length > spec.max
        ? { ok: false, error: `must be at most ${spec.max} characters` }
        : { ok: true, value: v };
    }
    case 'richtext': {
      if (typeof raw !== 'string') return { ok: false, error: 'must be text' };
      const v = sanitizeRichText(stripControl(raw)).trim();
      return v.length > spec.max
        ? { ok: false, error: `must be at most ${spec.max} characters` }
        : { ok: true, value: v };
    }
    case 'image':
    case 'video': {
      const v = typeof raw === 'string' ? raw.trim() : null;
      return v !== null && v.length <= 2048 && (HTTP_URL.test(v) || LOCAL_PATH.test(v))
        ? { ok: true, value: v }
        : { ok: false, error: 'must be an http(s) link or a site path' };
    }
    case 'url': {
      const v = typeof raw === 'string' ? raw.trim() : null;
      return v !== null && v.length <= 2048 && HTTP_URL.test(v)
        ? { ok: true, value: v }
        : { ok: false, error: 'must be an http(s) link' };
    }
    case 'path': {
      const v = typeof raw === 'string' ? raw.trim() : null;
      return v !== null && v.length <= 200 && INTERNAL_LINK.test(v)
        ? { ok: true, value: v }
        : { ok: false, error: 'must be a page on this site, starting with /' };
    }
    case 'email': {
      const v = typeof raw === 'string' ? raw.trim().toLowerCase() : null;
      return v !== null && v.length <= 120 && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(v)
        ? { ok: true, value: v }
        : { ok: false, error: 'must be an email address' };
    }
    case 'tel': {
      const v = typeof raw === 'string' ? raw.replace(/\s+/g, '') : null;
      return v !== null && /^\+?[0-9]{6,15}$/.test(v)
        ? { ok: true, value: v }
        : { ok: false, error: 'must be a phone number' };
    }
    case 'color': {
      const v = typeof raw === 'string' ? raw.trim().toLowerCase() : null;
      return v !== null && /^#[0-9a-f]{6}$/.test(v)
        ? { ok: true, value: v }
        : { ok: false, error: 'must be a colour like #264a7f' };
    }
    case 'font':
    case 'select':
      return spec.options.includes(raw)
        ? { ok: true, value: raw }
        : { ok: false, error: 'is not one of the allowed choices' };
    case 'toggle':
      return typeof raw === 'boolean'
        ? { ok: true, value: raw }
        : { ok: false, error: 'must be on or off' };
    case 'number': {
      const v = typeof raw === 'number' ? raw : Number.NaN;
      return Number.isFinite(v) && v >= spec.min && v <= spec.max
        ? { ok: true, value: v }
        : { ok: false, error: `must be between ${spec.min} and ${spec.max}` };
    }
    default:
      return { ok: false, error: 'has an unknown type' };
  }
};

const checkObject = (fields, raw, strict, where, errors) => {
  const out = {};
  if (!isPlainObject(raw)) {
    errors.push(`${where || 'value'} must be an object`);
    return out;
  }
  for (const [name, value] of Object.entries(raw)) {
    const spec = Object.prototype.hasOwnProperty.call(fields, name) ? fields[name] : null;
    const at = where ? `${where}.${name}` : name;
    if (!spec) {
      errors.push(`${at} is not an editable field`);
      continue;
    }
    if (value === null || value === undefined || value === '') continue; // unset = use the site default
    if (spec.type === 'list') {
      if (!Array.isArray(value)) {
        errors.push(`${at} must be a list`);
        continue;
      }
      if (value.length > spec.max) errors.push(`${at} can hold at most ${spec.max} items`);
      const items = [];
      value.slice(0, spec.max).forEach((item, i) => {
        const itemErrors = [];
        const cleaned = checkObject(spec.item, item, strict, `${at}[${i}]`, itemErrors);
        errors.push(...itemErrors);
        if (Object.keys(cleaned).length && (!strict || !itemErrors.length)) items.push(cleaned);
      });
      out[name] = items;
      continue;
    }
    const r = checkField(spec, value);
    if (r.ok) out[name] = r.value;
    else errors.push(`${at} ${r.error}`);
  }
  return out;
};

/**
 * Validate one key's value.
 *   strict (save/publish): `ok` is false on any unknown key/field or bad value.
 *   lenient (website read): `value` holds only the parts that passed.
 * Returns { ok, value, errors }.
 */
export const validateContent = (key, raw, { strict = true } = {}) => {
  const entry = Object.prototype.hasOwnProperty.call(SITE_CONTENT_SCHEMA, key)
    ? SITE_CONTENT_SCHEMA[key]
    : null;
  if (!entry)
    return { ok: false, value: {}, errors: [`"${key}" is not an editable part of the site`] };
  const errors = [];
  const value = checkObject(entry.fields, raw, strict, '', errors);
  return { ok: errors.length === 0, value, errors };
};

/** Only the parts of a stored value that are safe to render. */
export const cleanContent = (key, raw) => validateContent(key, raw, { strict: false }).value;

/**
 * An uploaded SVG is accepted only if it has no way to run code or pull in
 * outside resources. Returns the SVG text, or null when it must be rejected.
 */
export const sanitizeSvg = (input) => {
  const svg = String(input ?? '').replace(/<!--[\s\S]*?-->/g, '');
  if (!/<svg[\s>]/i.test(svg)) return null;
  const unsafe =
    /<\s*(script|foreignObject|iframe|embed|object|audio|video|image|use|animate|set|handler|listener)\b|\son[a-z]+\s*=|javascript:|data:|<!ENTITY|<!DOCTYPE|(?:xlink:)?href\s*=\s*["']?\s*(?!#)/i;
  return unsafe.test(svg) ? null : svg;
};
