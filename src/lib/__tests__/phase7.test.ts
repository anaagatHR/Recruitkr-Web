/**
 * Phase 7 (audit §6): pure helpers behind the dashboard UX.
 * Run with: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PLACEHOLDER_LOCATION, scoreJobMatch } from "../jobs";
import { APPLY_GATE_MIN_SCORE, computeProfileCompletion } from "../profileCompletion";

describe("scoreJobMatch (Best match sort)", () => {
  const prefs = { preferredRole: "Sales Executive", preferredLocation: "Jaipur", skills: ["Excel", "Hindi"] };

  it("ranks role words, then location, then shared skills", () => {
    assert.equal(scoreJobMatch({ jobTitle: "Senior Sales Executive", jobLocation: "Jaipur, RJ", skills: ["excel"] }, prefs), 3 + 3 + 2 + 1);
    assert.equal(scoreJobMatch({ jobTitle: "Store Manager", jobLocation: "Delhi" }, prefs), 0);
  });

  it("is safe with missing preferences and fields", () => {
    assert.equal(scoreJobMatch({}, {}), 0);
  });

  it("the API's location placeholder is a known constant (never offered as a filter)", () => {
    assert.equal(PLACEHOLDER_LOCATION, "Location not shared");
  });
});

describe("shared completion engine from the UI", () => {
  it("is the server's function: required-only profile scores 63 and cannot apply", () => {
    const result = computeProfileCompletion({
      profile: {
        fullName: "Priya Sharma",
        highestQualification: "MBA",
        experienceStatus: "fresher",
        skills: ["Sales", "Excel", "Billing", "Inventory", "Hindi"],
        preferences: { preferredRole: "Sales Executive", preferredLocation: "Jaipur", workModes: ["On-site"] },
      },
      user: { email: "priya@example.com", mobile: "9876543210" },
      resume: { resumeType: "uploaded", resumeFileId: "f1" },
    });
    assert.equal(result.score, 63);
    assert.equal(result.canApply, false);
    assert.equal(result.threshold, APPLY_GATE_MIN_SCORE);
  });

  it("splits raw comma-separated editor text the same way (empty entries ignored)", () => {
    const result = computeProfileCompletion({ profile: { skills: "Sales, , Excel,Billing".split(",") } });
    assert.equal(result.fields.find((f: { key: string }) => f.key === "skills").points, 5);
  });
});
