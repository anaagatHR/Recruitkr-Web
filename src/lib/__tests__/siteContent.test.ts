/**
 * Site Studio content on the website: with nothing published (or junk
 * published) every component keeps its built-in defaults, and a theme only
 * produces CSS when one is actually published. Run with: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getContent, hexToHslTriplet, themeCss, themeFontsHref } from "../siteContentCore";

const DEFAULTS = { headlineEnd: "that’s verified & free.", roles: [{ name: "Sales" }] };

describe("getContent", () => {
  it("returns the defaults when nothing is published or the API is down ({})", () => {
    assert.equal(getContent(undefined, "home.hero", DEFAULTS), DEFAULTS);
    assert.equal(getContent({}, "home.hero", DEFAULTS), DEFAULTS);
  });

  it("lays valid published fields over the defaults and drops invalid ones", () => {
    const out = getContent({ "home.hero": { headlineEnd: "Free, always.", helper: 7, evil: "<script>" } }, "home.hero", DEFAULTS);
    assert.deepEqual(out, { headlineEnd: "Free, always.", roles: [{ name: "Sales" }] });
  });

  it("keeps the default list when a published list is empty or all invalid", () => {
    const out = getContent({ "home.hero": { roles: [{ name: 42 }] } }, "home.hero", DEFAULTS);
    assert.deepEqual(out.roles, [{ name: "Sales" }]);
  });

  it("ignores keys the registry does not know", () => {
    assert.deepEqual(getContent({ "page.unknown": { a: 1 } }, "page.unknown", DEFAULTS), DEFAULTS);
  });
});

describe("theme", () => {
  it("emits nothing without a published theme", () => {
    assert.equal(themeCss({}), "");
    assert.equal(themeFontsHref({}), null);
  });

  it("maps colours to the site's HSL tokens (light mode only) and fonts to its font variables", () => {
    assert.equal(hexToHslTriplet("#264a7f"), "216 54% 32%");
    const css = themeCss({ theme: { primary: "#264a7f", radius: 0.5, fontBody: "Poppins", background: "javascript:x" } });
    assert.match(css, /html:root:not\(\.dark\)\{--primary:216 54% 32%/);
    assert.match(css, /--radius:0\.5rem/);
    assert.match(css, /--font-body:"Poppins"/);
    assert.doesNotMatch(css, /javascript/);
    assert.equal(
      themeFontsHref({ theme: { fontBody: "Poppins", fontDisplay: "Sora" } }),
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap",
    );
  });
});
