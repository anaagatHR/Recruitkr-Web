/**
 * Footer links in Site Studio: pages on the site and outside https links are
 * fine; script and protocol-relative tricks are not. Run with: npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cleanContent, validateContent } from '../src/shared/siteContentSchema.js';

describe('footer links', () => {
  it('accepts site pages and https links, in any column', () => {
    const r = validateContent('footer', {
      links: [
        { column: 'Company', label: 'About Us', href: '/about' },
        { column: 'Partners', label: 'Partner with us', href: '/partners/apply' },
        { column: 'Partners', label: 'LinkedIn', href: 'https://www.linkedin.com/company/recruitkr/' },
      ],
      legal: [{ label: 'Privacy Policy', href: '/privacy-policy' }],
    });
    assert.equal(r.ok, true, r.errors.join());
  });

  it('refuses javascript:, protocol-relative and data: links', () => {
    for (const href of ['javascript:alert(1)', '//evil.example', 'data:text/html,hi']) {
      assert.equal(validateContent('footer', { links: [{ column: 'X', label: 'Y', href }] }).ok, false, href);
    }
    assert.deepEqual(cleanContent('footer', { legal: [{ label: 'Bad', href: 'javascript:x' }] }), {
      legal: [{ label: 'Bad' }],
    });
  });
});
