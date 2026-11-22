/**
 * Salary is stored in LPA. A monthly ₹14,000 typed as 14000 went live as "₹14000L PA";
 * the label now leaves out impossible values.
 * Run with: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { salaryLabel } from "../format";

describe("salaryLabel", () => {
  it("prints lakhs, rounded to two decimals", () => {
    assert.equal(salaryLabel(1.68, 2.16), "₹1.68L - ₹2.16L PA");
    assert.equal(salaryLabel(1.6800000001, 2.1599999), "₹1.68L - ₹2.16L PA");
    assert.equal(salaryLabel(0.3, undefined), "₹30K PA");
  });

  it("never shows a monthly amount typed into the yearly field", () => {
    assert.equal(salaryLabel(14000, 18000), "Not disclosed");
    assert.equal(salaryLabel(3, 25000), "₹3L PA");
    assert.equal(salaryLabel(0, 0), "Not disclosed");
  });
});
