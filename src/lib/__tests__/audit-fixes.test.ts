/**
 * Unit tests for the pure helpers added in the Oct-2026 audit fixes.
 * Run with: npm test   (tsx --test; no browser needed)
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeApiJob, displayCompany, daysUntilDeadline, isExpired, pluralize, formatExperience, homepageEligible } from "../jobs";
import { formatCount, formatJobCount, normalizeStats, countFor } from "../stats";
import { safeRedirectPath } from "../url";
import { parseDescription } from "../../components/job/JobDescription";

describe("normalizeApiJob", () => {
  const base = { _id: "abc", jobTitle: "Store Manager ", jobLocation: "Jaipur", createdAt: "2026-10-01T00:00:00Z" };

  it("never invents a company — empty stays empty and displays as Confidential Employer", () => {
    const job = normalizeApiJob({ ...base, companyName: "" })!;
    assert.equal(job.company, "");
    assert.equal(displayCompany(job), "Confidential Employer");
    assert.equal(job.isComplete, false);
  });

  it("treats the stored placeholder 'Company' as missing", () => {
    const job = normalizeApiJob({ ...base, companyName: "Company" })!;
    assert.equal(job.company, "");
  });

  it("trims and collapses whitespace in titles", () => {
    assert.equal(normalizeApiJob(base)!.title, "Store Manager");
  });

  it("is complete with a company and a real description", () => {
    const job = normalizeApiJob({ ...base, companyName: "Acme", description: "A proper forty-plus character description of the role." })!;
    assert.equal(job.isComplete, true);
    assert.equal(homepageEligible(job), true);
  });

  it("honours an explicit isComplete flag from the API", () => {
    const job = normalizeApiJob({ ...base, companyName: "Acme", description: "short", isComplete: true })!;
    assert.equal(job.isComplete, true);
  });

  it("carries deadline and canApply through", () => {
    const soon = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const job = normalizeApiJob({ ...base, applicationDeadline: soon, canApply: true })!;
    assert.equal(job.applicationDeadline, soon);
    assert.equal(job.canApply, true);
    assert.equal(daysUntilDeadline(job), 3);
    assert.equal(isExpired(job), false);
    const past = normalizeApiJob({ ...base, applicationDeadline: "2020-01-01T00:00:00Z" })!;
    assert.equal(isExpired(past), true);
    assert.equal(homepageEligible({ ...past, isComplete: true }), false);
  });
});

describe("copy helpers", () => {
  it("pluralize", () => {
    assert.equal(pluralize(1, "opening"), "1 opening");
    assert.equal(pluralize(3, "opening"), "3 openings");
    assert.equal(pluralize(1, "job"), "1 job");
  });
  it("formatExperience adds the missing unit", () => {
    assert.equal(formatExperience("2-4"), "2–4 years experience");
    assert.equal(formatExperience("5+"), "5+ years experience");
    assert.equal(formatExperience("Fresher"), "Fresher");
    assert.equal(formatExperience("Not specified"), "");
    assert.equal(formatExperience("3 yrs"), "3 years experience");
  });
});

describe("stats", () => {
  it("formatCount is exact below 100 and only ever rounds DOWN", () => {
    assert.equal(formatCount(0), "0");
    assert.equal(formatCount(68), "68");
    assert.equal(formatCount(149), "100+");
    assert.equal(formatCount(1_240), "1,000+");
    assert.equal(formatJobCount(1), "1 job");
    assert.equal(formatJobCount(5), "5 jobs");
    assert.equal(formatJobCount(0), "No jobs yet");
  });
  it("normalizeStats tolerates partial payloads", () => {
    const s = normalizeStats({ data: { activeJobs: "68", companies: 2, byType: { "Full-time": 40, Internship: 5 } } });
    assert.equal(s.activeJobs, 68);
    assert.equal(s.companies, 2);
    assert.equal(countFor(s.byType, "full"), 40);
    assert.equal(countFor(s.byType, "intern"), 5);
    assert.equal(countFor(s.byMode, "remote"), 0);
  });
});

describe("safeRedirectPath", () => {
  it("accepts relative paths and falls back otherwise", () => {
    assert.equal(safeRedirectPath("/jobs/1?x=1#a", "/d"), "/jobs/1?x=1#a");
    assert.equal(safeRedirectPath("//evil.com", "/d"), "/d");
    assert.equal(safeRedirectPath("https://evil.com", "/d"), "/d");
    assert.equal(safeRedirectPath("/\\evil.com", "/d"), "/d");
    assert.equal(safeRedirectPath("/jobs/..//evil.com", "/d"), "/d");
    assert.equal(safeRedirectPath("/login?x=1", "/d"), "/d");
    assert.equal(safeRedirectPath(null, "/d"), "/d");
  });
});

describe("parseDescription", () => {
  it("splits headings, bullets and paragraphs", () => {
    const blocks = parseDescription(
      "About the Role:\nWe build hiring tools.\n\nKey Responsibilities:\n- Ship features\n- Review PRs\n1. Mentor juniors\n\nApply today.",
    );
    assert.deepEqual(
      blocks.map((b) => b.kind),
      ["h", "p", "h", "ul", "p"],
    );
    const list = blocks[3];
    assert.equal(list.kind, "ul");
    if (list.kind === "ul") assert.deepEqual(list.items, ["Ship features", "Review PRs", "Mentor juniors"]);
  });
  it("returns nothing for empty text", () => {
    assert.deepEqual(parseDescription("   \n  "), []);
  });
});
