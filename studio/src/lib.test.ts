import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Schema } from "./api";
import { changedFields, contrastRatio, keyForEditId, valueText } from "./lib";

const schema: Schema = {
  home: { label: "Home", group: "Pages", fields: { title: { type: "text", label: "T" } } },
  "home.hero": { label: "Hero", group: "Pages", fields: { headlineEnd: { type: "text", label: "E" } } },
};

describe("Studio helpers", () => {
  it("maps a clicked element to the most specific key and its field", () => {
    assert.deepEqual(keyForEditId(schema, "home.hero.headlineEnd"), { key: "home.hero", field: "headlineEnd" });
    assert.deepEqual(keyForEditId(schema, "home.hero.unknown"), { key: "home.hero", field: null });
    assert.deepEqual(keyForEditId(schema, "home.title"), { key: "home", field: "title" });
    assert.equal(keyForEditId(schema, "footer.heading"), null);
  });

  it("computes WCAG contrast (white on the site navy passes AA)", () => {
    assert.equal(contrastRatio("#ffffff", "#000000"), 21);
    assert.ok((contrastRatio("#ffffff", "#264a7f") ?? 0) >= 4.5);
    assert.ok((contrastRatio("#ffffff", "#ffff66") ?? 99) < 3);
    assert.equal(contrastRatio("red", "#fff"), null);
  });

  it("lists only the fields a publish would change", () => {
    assert.deepEqual(changedFields({ a: "x", b: [1] }, { a: "x", b: [2], c: "gone" }), ["b", "c"]);
    assert.deepEqual(changedFields(null, null), []);
    assert.equal(valueText(""), "(site default)");
    assert.equal(valueText([{ label: "Jobs", path: "/jobs" }]), "1 item: Jobs · /jobs");
  });
});
