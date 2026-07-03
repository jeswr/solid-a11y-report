// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
//
// CHARACTERIZATION / GOLDEN-MASTER suite — pins the package's OBSERVABLE
// behaviour so a structural change is proven not to alter it. Two axes:
//
//   1. The PUBLIC API contract — the exact RUNTIME named-export set of every
//      entry point (`.`, `./earl`, `./wcag`, `./shape`), plus compile-time
//      assertions for the named type-only exports (which are type-erased, so
//      they can't appear in the runtime set). A runtime export added/removed/
//      renamed, or a named type removed/renamed, fails; a deliberate change is a
//      reviewed CONTRACT diff. (Mirrors what api-extractor's
//      `etc/solid-a11y-report.api.md` snapshots for the main entry, in-repo.)
//
//   2. The EMITTED RDF — canonical sorted, blank-node-normalised N-Triples for a
//      representative report build. The exact IRIs / predicates / classes an EARL
//      consumer binds to are pinned line-for-line: a refactor that silently
//      changes one breaks this test. The build is deterministic (no wall-clock
//      time unless `generatedAt` is passed), and pointer blank nodes are relabelled
//      by their CSS selector so the snapshot is stable across runs.
//
// Snapshots are NEVER `--update`d to make a red test green mid-refactor — an
// unexpected diff here is stop-the-line.

import type { Quad, Term } from "@rdfjs/types";
import type { Store } from "n3";
import { describe, expect, it } from "vitest";
import type {
  A11yAssertionData,
  A11yIssueInput,
  A11yMode,
  A11yNodeInput,
  A11yOutcome,
  A11yPageInput,
  A11yReportData,
  A11yScanInput,
} from "./earl.js";
import * as earlEntry from "./earl.js";
import { buildReport } from "./earl.js";
import * as mainEntry from "./index.js";
import * as shapeEntry from "./shape.js";
import { RDF_VALUE, XSD } from "./vocab.js";
import type { WcagRef, WcagVersion } from "./wcag.js";
import * as wcagEntry from "./wcag.js";

// --- 0. Type-only export contract (compile-time) ------------------------------
// The runtime `Object.keys` checks below cannot see TYPE-only exports (they erase
// at runtime); these imports are the compile-time contract — a rename/removal on
// a subpath breaks `tsc`. The values pin the type SHAPE consumers rely on.
const _scan: A11yScanInput = { toolName: "t", pages: [] };
const _page: A11yPageInput = { url: "https://x/", issues: [] };
const _issue: A11yIssueInput = { ruleId: "r", wcag: [], nodes: [] };
const _node: A11yNodeInput = { selector: "img" };
const _outcome: A11yOutcome = "failed";
const _mode: A11yMode = "automatic";
const _assertion: A11yAssertionData = {
  subject: "https://x/",
  test: "https://y/",
  outcome: "failed",
};
const _report: A11yReportData = { assertions: [] };
const _wcagRef: WcagRef = { version: "2.2", name: "Non-text Content" };
const _wcagVersion: WcagVersion = "2.1";
void [_scan, _page, _issue, _node, _outcome, _mode, _assertion, _report, _wcagRef, _wcagVersion];

// --- 1. Public-API contract ----------------------------------------------------

/** Sorted list of a module's own named exports (the public surface of an entry). */
function exportNames(mod: Record<string, unknown>): string[] {
  return Object.keys(mod).sort();
}

describe("public API contract (golden export set per entry point)", () => {
  it("`.` (the main entry) exports exactly this set (browser-safe; no node:fs/node:url — see src/browser-bundle.test.ts)", () => {
    expect(exportNames(mainEntry)).toEqual([
      "ACL",
      "Assertion",
      "DCT",
      "DCT_DESCRIPTION",
      "DCT_HAS_VERSION",
      "DCT_REFERENCES",
      "DCT_TITLE",
      "EARL",
      "EARL_ASSERTED_BY",
      "EARL_ASSERTION",
      "EARL_ASSERTOR",
      "EARL_AUTOMATIC",
      "EARL_CANNOT_TELL",
      "EARL_CANT_TELL",
      "EARL_FAIL",
      "EARL_FAILED",
      "EARL_INAPPLICABLE",
      "EARL_INFO",
      "EARL_MAIN_ASSERTOR",
      "EARL_MANUAL",
      "EARL_MODE",
      "EARL_NOT_APPLICABLE",
      "EARL_NOT_TESTED",
      "EARL_OUTCOME",
      "EARL_OUTCOME_VALUE",
      "EARL_PASS",
      "EARL_PASSED",
      "EARL_POINTER",
      "EARL_RESULT",
      "EARL_SEMI_AUTO",
      "EARL_SOFTWARE",
      "EARL_SUBJECT",
      "EARL_TEST",
      "EARL_TEST_CASE",
      "EARL_TEST_CRITERION",
      "EARL_TEST_MODE",
      "EARL_TEST_REQUIREMENT",
      "EARL_TEST_RESULT",
      "EARL_TEST_SUBJECT",
      "EARL_UNDISCLOSED",
      "EARL_UNKNOWN_MODE",
      "EARL_UNTESTED",
      "PREFIXES",
      "PROV",
      "PROV_GENERATED_AT_TIME",
      "PTR",
      "PTR_CSS_SELECTOR_POINTER",
      "RDF",
      "RDFS",
      "RDF_TYPE",
      "RDF_VALUE",
      "SCHEMA",
      "SCHEMA_URL",
      "SCHEMA_VALUE",
      "Software",
      "TestCaseNode",
      "TestResult",
      "XSD",
      "acl",
      "aclUrlFor",
      "buildOwnerAcl",
      "buildReport",
      "dct",
      "earl",
      "httpIriOrUndefined",
      "isHttpIri",
      "modeIri",
      "outcomeIri",
      "parseReport",
      "parseReportTtl",
      "prov",
      "ptr",
      "rdf",
      "rdfs",
      "schema",
      "serializeReport",
      "slugify",
      "storeToTurtle",
      "wcagCriterionUri",
      "wcagVersionFromAxeTag",
      "writeOwnerAcl",
      "xsd",
    ]);
  });

  it("`./earl` exports exactly the model builders/parsers/wrappers", () => {
    expect(exportNames(earlEntry)).toEqual([
      "Assertion",
      "Software",
      "TestCaseNode",
      "TestResult",
      "buildReport",
      "modeIri",
      "outcomeIri",
      "parseReport",
      "parseReportTtl",
      "serializeReport",
      "storeToTurtle",
    ]);
  });

  it("`./wcag` exports exactly the pure WCAG helpers", () => {
    expect(exportNames(wcagEntry)).toEqual([
      "slugify",
      "wcagCriterionUri",
      "wcagVersionFromAxeTag",
    ]);
  });

  it("`./shape` (Node-only) exports exactly the shape accessors", () => {
    expect(exportNames(shapeEntry)).toEqual(["A11Y_REPORT_SHAPE_PATH", "a11yReportShapeTtl"]);
  });
});

// --- 2. Emitted-RDF golden master ---------------------------------------------

const BASE = "https://alice.example/a11y/scan-1.ttl";
const SNAPSHOT_INPUT: A11yScanInput = {
  toolName: "AccessRadar",
  toolVersion: "4.9.1",
  toolHomepage: "https://accessradar.example/",
  pages: [
    {
      url: "https://site.example/",
      passes: 12,
      inapplicable: 2,
      issues: [
        {
          ruleId: "image-alt",
          description: "Images must have alternate text",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.9/image-alt",
          impact: "critical",
          wcag: [{ version: "2.2", name: "Non-text Content", id: "1.1.1", level: "A" }],
          nodes: [
            { selector: "img.hero", failureSummary: "Element has no alt attribute" },
            { selector: "img.logo", failureSummary: "Element has an empty alt attribute" },
          ],
        },
        {
          ruleId: "region",
          description: "All content should be in a landmark",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.9/region",
          wcag: [],
          nodes: [{ selector: "div.orphan" }],
        },
      ],
    },
  ],
};

/**
 * Canonical, blank-node-normalised N-Triples for a store: literals carry their
 * datatype (xsd:string elided), and each pointer blank node is relabelled by the
 * CSS selector it carries (`rdf:value`) so the output is stable across runs.
 */
function canonicalTriples(store: Store): string {
  const selectorOf = new Map<string, string>();
  for (const quad of store as Iterable<Quad>) {
    if (quad.subject.termType === "BlankNode" && quad.predicate.value === RDF_VALUE) {
      selectorOf.set(quad.subject.value, quad.object.value);
    }
  }
  const relabel = new Map<string, string>();
  const sortedBlanks = [...selectorOf.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  sortedBlanks.forEach(([id], i) => {
    relabel.set(id, `_:ptr${i}`);
  });

  const render = (t: Term): string => {
    if (t.termType === "BlankNode") return relabel.get(t.value) ?? `_:b_${t.value}`;
    if (t.termType === "Literal") {
      const dt = t.datatype.value;
      return dt === `${XSD}string`
        ? JSON.stringify(t.value)
        : `${JSON.stringify(t.value)}^^<${dt}>`;
    }
    return `<${t.value}>`;
  };

  return [...(store as Iterable<Quad>)]
    .map((q) => `${render(q.subject)} ${render(q.predicate)} ${render(q.object)} .`)
    .sort()
    .join("\n");
}

describe("emitted RDF golden master", () => {
  it("buildReport emits the pinned canonical triples", () => {
    expect(canonicalTriples(buildReport(BASE, SNAPSHOT_INPUT))).toMatchSnapshot();
  });
});
