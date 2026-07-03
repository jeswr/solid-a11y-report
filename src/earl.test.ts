// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
import { DataFactory, Parser, Store } from "n3";
import { describe, expect, it } from "vitest";
import {
  type A11yScanInput,
  buildReport,
  parseReport,
  parseReportTtl,
  serializeReport,
} from "./earl.js";
import { EARL_ASSERTION, EARL_TEST_REQUIREMENT, RDF_TYPE } from "./vocab.js";

const BASE = "https://alice.example/a11y/scan-1.ttl";

/** A representative axe-shaped fixture: 2 pages; a 2-node rule; a best-practice rule. */
const FIXTURE: A11yScanInput = {
  toolName: "AccessRadar",
  toolVersion: "4.9.1",
  toolHomepage: "https://accessradar.example/",
  pages: [
    {
      url: "https://site.example/",
      passes: 40,
      inapplicable: 5,
      issues: [
        {
          ruleId: "image-alt",
          description: "Images must have alternate text",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.9/image-alt",
          impact: "critical",
          wcag: [{ version: "2.2", name: "Non-text Content", id: "1.1.1", level: "A" }],
          nodes: [
            {
              selector: "html > body > img:nth-child(1)",
              failureSummary: "Element has no alt attribute",
            },
            { selector: "main > img", failureSummary: "Element has an empty alt" },
          ],
        },
        {
          // A rule that maps to TWO success criteria across versions.
          ruleId: "link-name",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.9/link-name",
          impact: "serious",
          wcag: [
            { version: "2.1", name: "Link Purpose (In Context)", id: "2.4.4", level: "A" },
            { version: "2.2", name: "Name, Role, Value", id: "4.1.2", level: "A" },
          ],
          nodes: [
            {
              selector: "a.icon",
              failureSummary: "Element is in tab order and has no accessible text",
            },
          ],
        },
        {
          // Best-practice rule: empty wcag[] → falls back to the axe helpUrl TestCase.
          ruleId: "region",
          description: "All page content should be contained by landmarks",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.9/region",
          wcag: [],
          nodes: [{ selector: "footer" }],
        },
      ],
    },
    {
      url: "https://site.example/about",
      issues: [
        {
          ruleId: "color-contrast",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.9/color-contrast",
          impact: "serious",
          wcag: [{ version: "2.1", name: "Contrast (Minimum)", id: "1.4.3", level: "AA" }],
          nodes: [{ selector: ".cta", failureSummary: "Insufficient colour contrast" }],
        },
      ],
    },
  ],
};

describe("buildReport / round-trip", () => {
  it("round-trips through serialize → parseReportTtl preserving every assertion", async () => {
    const ttl = await serializeReport(BASE, FIXTURE);
    const parsed = await parseReportTtl(BASE, ttl);

    // image-alt (2 nodes × 1 SC) = 2
    // link-name (1 node × 2 SC)  = 2
    // region    (1 node × 1 TestCase fallback) = 1
    // color-contrast (1 node × 1 SC) = 1
    // roll-ups: passed + inapplicable on page 1 = 2
    // total = 8
    expect(parsed.assertions).toHaveLength(8);

    // Every failing assertion carries a determinable outcome + assertor + mode.
    for (const a of parsed.assertions) {
      expect(a.assertedBy).toBe(`${BASE}#assertor`);
      expect(a.mode).toBe("automatic");
      expect(["failed", "passed", "inapplicable"]).toContain(a.outcome);
    }
  });

  it("fans out per failing node — 2 nodes → 2 assertions with DISTINCT selectors", async () => {
    const parsed = parseReport(buildReport(BASE, FIXTURE));
    const imageAlt = parsed.assertions.filter(
      (a) => a.test === "https://www.w3.org/TR/WCAG22/#non-text-content",
    );
    expect(imageAlt).toHaveLength(2);
    const selectors = imageAlt.map((a) => a.selector).sort();
    expect(selectors).toEqual(["html > body > img:nth-child(1)", "main > img"]);
    // Both reference the same axe rule doc.
    for (const a of imageAlt) {
      expect(a.testCase).toBe("https://dequeuniversity.com/rules/axe/4.9/image-alt");
    }
  });

  it("emits one assertion per (node × success criterion) for a multi-SC rule", async () => {
    const parsed = parseReport(buildReport(BASE, FIXTURE));
    const linkName = parsed.assertions.filter(
      (a) => a.testCase === "https://dequeuniversity.com/rules/axe/4.9/link-name",
    );
    expect(linkName).toHaveLength(2);
    expect(linkName.map((a) => a.test).sort()).toEqual([
      "https://www.w3.org/TR/WCAG21/#link-purpose-in-context",
      "https://www.w3.org/TR/WCAG22/#name-role-value",
    ]);
  });

  it("uses the version-specific WCAG URI (2.2 vs 2.1)", async () => {
    const parsed = parseReport(buildReport(BASE, FIXTURE));
    const tests = new Set(parsed.assertions.map((a) => a.test));
    expect(tests.has("https://www.w3.org/TR/WCAG22/#non-text-content")).toBe(true);
    expect(tests.has("https://www.w3.org/TR/WCAG21/#contrast-minimum")).toBe(true);
    expect(tests.has("https://www.w3.org/TR/WCAG21/#link-purpose-in-context")).toBe(true);
  });

  it("a best-practice rule (empty wcag[]) falls back to the axe helpUrl as the earl:test", async () => {
    const parsed = parseReport(buildReport(BASE, FIXTURE));
    const region = parsed.assertions.filter(
      (a) => a.test === "https://dequeuniversity.com/rules/axe/4.9/region",
    );
    expect(region).toHaveLength(1);
    expect(region[0]?.outcome).toBe("failed");
    expect(region[0]?.selector).toBe("footer");
  });

  it("types the WCAG SC as earl:TestRequirement and the assertion as earl:Assertion", async () => {
    const { namedNode } = DataFactory;
    const store = buildReport(BASE, FIXTURE);
    const reqs = [...store.match(null, namedNode(RDF_TYPE), namedNode(EARL_TEST_REQUIREMENT))];
    expect(reqs.length).toBeGreaterThan(0);
    const assertions = [...store.match(null, namedNode(RDF_TYPE), namedNode(EARL_ASSERTION))];
    expect(assertions).toHaveLength(8);
  });

  it("a WCAG 2.0 rule WITHOUT a legacy anchor falls back to the axe helpUrl TestCase", async () => {
    // 2.0 anchors aren't slug-derivable → wcagCriterionUri throws → the SC is
    // dropped and the rule doc becomes the earl:test (fail-closed, no broken IRI).
    const parsed = parseReport(
      buildReport(BASE, {
        toolName: "AccessRadar",
        pages: [
          {
            url: "https://site.example/",
            issues: [
              {
                ruleId: "image-alt",
                helpUrl: "https://dequeuniversity.com/rules/axe/4.9/image-alt",
                wcag: [{ version: "2.0", name: "Non-text Content" }],
                nodes: [{ selector: "img" }],
              },
            ],
          },
        ],
      }),
    );
    expect(parsed.assertions).toHaveLength(1);
    expect(parsed.assertions[0]?.test).toBe("https://dequeuniversity.com/rules/axe/4.9/image-alt");
  });

  it("a WCAG 2.0 rule WITH a legacy anchor references the 2.0 SC IRI", async () => {
    const parsed = parseReport(
      buildReport(BASE, {
        toolName: "AccessRadar",
        pages: [
          {
            url: "https://site.example/",
            issues: [
              {
                ruleId: "image-alt",
                helpUrl: "https://dequeuniversity.com/rules/axe/4.9/image-alt",
                wcag: [{ version: "2.0", name: "Non-text Content", anchor: "text-equiv-all" }],
                nodes: [{ selector: "img" }],
              },
            ],
          },
        ],
      }),
    );
    expect(parsed.assertions.map((a) => a.test)).toContain(
      "https://www.w3.org/TR/WCAG20/#text-equiv-all",
    );
  });

  it("emits per-page roll-ups for passed / inapplicable counts", async () => {
    const parsed = parseReport(buildReport(BASE, FIXTURE));
    const passed = parsed.assertions.find((a) => a.outcome === "passed");
    const inapplicable = parsed.assertions.find((a) => a.outcome === "inapplicable");
    expect(passed?.value).toBe(40);
    expect(inapplicable?.value).toBe(5);
    expect(passed?.test).toBe(`${BASE}#automated-checks`);
  });
});

describe("untrusted-input hardening", () => {
  it("drops a non-http(s) page URL — no assertions minted for that page", async () => {
    const parsed = parseReport(
      buildReport(BASE, {
        toolName: "AccessRadar",
        pages: [
          {
            url: "javascript:alert(1)",
            issues: [
              {
                ruleId: "image-alt",
                helpUrl: "https://dequeuniversity.com/rules/axe/4.9/image-alt",
                wcag: [{ version: "2.2", name: "Non-text Content" }],
                nodes: [{ selector: "img" }],
              },
            ],
          },
        ],
      }),
    );
    expect(parsed.assertions).toHaveLength(0);
  });

  it("drops a non-http(s) tool homepage and a non-http(s) helpUrl", async () => {
    const ttl = await serializeReport(BASE, {
      toolName: "AccessRadar",
      toolHomepage: "javascript:evil()",
      pages: [
        {
          url: "https://site.example/",
          issues: [
            {
              ruleId: "region",
              helpUrl: "data:text/html,x",
              wcag: [],
              nodes: [{ selector: "footer" }],
            },
          ],
        },
      ],
    });
    // homepage dropped → no schema:url; helpUrl dropped → the region issue has no
    // valid earl:test (no SC + no http helpUrl) → skipped entirely.
    expect(ttl).not.toMatch(/schema:url/);
    expect(ttl).not.toMatch(/javascript:|data:text/);
    const parsed = await parseReportTtl(BASE, ttl);
    expect(parsed.assertions).toHaveLength(0);
  });

  it("a malformed foreign literal drops the FIELD, not the whole assertion", async () => {
    // earl:info carries an IRI object instead of a literal → LiteralAs.string
    // throws → tryRead drops `info`, but the assertion (subject/test/outcome) survives.
    const ttl = `
      @prefix earl: <http://www.w3.org/ns/earl#> .
      <#a> a earl:Assertion ;
        earl:assertedBy <${BASE}#assertor> ;
        earl:subject <https://site.example/> ;
        earl:test <https://www.w3.org/TR/WCAG22/#non-text-content> ;
        earl:mode earl:automatic ;
        earl:result <#r> .
      <#r> a earl:TestResult ;
        earl:outcome earl:failed ;
        earl:info <https://not-a-literal.example/> .
    `;
    const store = new Store(new Parser({ baseIRI: BASE }).parse(ttl));
    const parsed = parseReport(store);
    expect(parsed.assertions).toHaveLength(1);
    expect(parsed.assertions[0]?.outcome).toBe("failed");
    expect(parsed.assertions[0]?.info).toBeUndefined();
  });

  it("an assertion missing earl:test is dropped (required field), others survive", async () => {
    const ttl = `
      @prefix earl: <http://www.w3.org/ns/earl#> .
      <#bad> a earl:Assertion ;
        earl:subject <https://site.example/> ;
        earl:result <#rb> .
      <#rb> a earl:TestResult ; earl:outcome earl:failed .
      <#ok> a earl:Assertion ;
        earl:subject <https://site.example/> ;
        earl:test <https://www.w3.org/TR/WCAG22/#non-text-content> ;
        earl:result <#ro> .
      <#ro> a earl:TestResult ; earl:outcome earl:passed .
    `;
    const store = new Store(new Parser({ baseIRI: BASE }).parse(ttl));
    const parsed = parseReport(store);
    expect(parsed.assertions).toHaveLength(1);
    expect(parsed.assertions[0]?.outcome).toBe("passed");
  });

  it("throws (fail-closed) on a non-http(s) reportBaseUrl", () => {
    expect(() => buildReport("urn:x:y", { toolName: "t", pages: [] })).toThrow(/http/);
  });

  it("skips a roll-up whose count is not a safe non-negative integer (no invalid xsd:integer)", async () => {
    for (const bad of [-3, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const parsed = parseReport(
        buildReport(BASE, {
          toolName: "AccessRadar",
          pages: [{ url: "https://site.example/", passes: bad, inapplicable: bad, issues: [] }],
        }),
      );
      // No failing issues + no valid counts → no assertions at all.
      expect(parsed.assertions).toHaveLength(0);
    }
    // A valid count still emits (and 0 is a legitimate count).
    const ok = parseReport(
      buildReport(BASE, {
        toolName: "AccessRadar",
        pages: [{ url: "https://site.example/", passes: 0, inapplicable: 7, issues: [] }],
      }),
    );
    expect(ok.assertions.map((a) => a.outcome).sort()).toEqual(["inapplicable", "passed"]);
    expect(ok.assertions.find((a) => a.outcome === "passed")?.value).toBe(0);
  });
});

describe("parse tolerance", () => {
  it("reads a plain string-literal earl:pointer (the alternate ACT shape)", () => {
    const ttl = `
      @prefix earl: <http://www.w3.org/ns/earl#> .
      <#a> a earl:Assertion ;
        earl:subject <https://site.example/> ;
        earl:test <https://www.w3.org/TR/WCAG22/#non-text-content> ;
        earl:result <#r> .
      <#r> a earl:TestResult ;
        earl:outcome earl:failed ;
        earl:pointer "html > body > h1:first-child" .
    `;
    const store = new Store(new Parser({ baseIRI: BASE }).parse(ttl));
    const parsed = parseReport(store);
    expect(parsed.assertions[0]?.selector).toBe("html > body > h1:first-child");
  });
});
