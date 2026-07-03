// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
import env from "@zazuko/env-node";
import { Parser } from "n3";
import SHACLValidator from "rdf-validate-shacl";
import { describe, expect, it } from "vitest";
import { type A11yScanInput, buildReport } from "./earl.js";
import { a11yReportShapeTtl } from "./shape.js";

const BASE = "https://alice.example/a11y/scan-1.ttl";

function toDataset(quads: Iterable<Parameters<ReturnType<typeof env.dataset>["add"]>[0]>) {
  const ds = env.dataset();
  for (const q of quads) ds.add(q);
  return ds;
}

const shapes = toDataset(new Parser().parse(a11yReportShapeTtl()));

function validate(quads: Iterable<Parameters<ReturnType<typeof env.dataset>["add"]>[0]>) {
  return new SHACLValidator(shapes, { factory: env }).validate(toDataset(quads));
}

function validateTtl(ttl: string) {
  return validate(new Parser({ baseIRI: BASE }).parse(ttl));
}

const FIXTURE: A11yScanInput = {
  toolName: "AccessRadar",
  toolVersion: "4.9.1",
  pages: [
    {
      url: "https://site.example/",
      passes: 12,
      inapplicable: 2,
      issues: [
        {
          ruleId: "image-alt",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.9/image-alt",
          wcag: [{ version: "2.2", name: "Non-text Content" }],
          nodes: [
            { selector: "img.a", failureSummary: "no alt" },
            { selector: "img.b", failureSummary: "empty alt" },
          ],
        },
        {
          ruleId: "region",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.9/region",
          wcag: [],
          nodes: [{ selector: "footer" }],
        },
      ],
    },
  ],
};

describe("SHACL shape (shapes/a11y-report.ttl)", () => {
  it("a full built report (failures + roll-ups) conforms", async () => {
    const report = await validate(buildReport(BASE, FIXTURE));
    expect(report.conforms).toBe(true);
  });

  it("an assertion missing earl:test is non-conforming (minCount 1)", async () => {
    const ttl = `
      @prefix earl: <http://www.w3.org/ns/earl#> .
      <#a> a earl:Assertion ;
        earl:subject <https://site.example/> ;
        earl:assertedBy <${BASE}#assertor> ;
        earl:mode earl:automatic ;
        earl:result <#r> .
      <#r> a earl:TestResult ; earl:outcome earl:failed .
    `;
    const report = await validateTtl(ttl);
    expect(report.conforms).toBe(false);
    expect(report.results.some((r) => String(r.path?.value).endsWith("test"))).toBe(true);
  });

  it("an assertion with TWO earl:subject values is non-conforming (maxCount 1)", async () => {
    const ttl = `
      @prefix earl: <http://www.w3.org/ns/earl#> .
      <#a> a earl:Assertion ;
        earl:subject <https://site.example/a>, <https://site.example/b> ;
        earl:test <https://www.w3.org/TR/WCAG22/#non-text-content> ;
        earl:assertedBy <${BASE}#assertor> ;
        earl:mode earl:automatic ;
        earl:result <#r> .
      <#r> a earl:TestResult ; earl:outcome earl:failed .
    `;
    const report = await validateTtl(ttl);
    expect(report.conforms).toBe(false);
    expect(report.results.some((r) => String(r.path?.value).endsWith("subject"))).toBe(true);
  });

  it("a result whose earl:outcome is not one of the five individuals is non-conforming", async () => {
    const ttl = `
      @prefix earl: <http://www.w3.org/ns/earl#> .
      <#a> a earl:Assertion ;
        earl:subject <https://site.example/> ;
        earl:test <https://www.w3.org/TR/WCAG22/#non-text-content> ;
        earl:assertedBy <${BASE}#assertor> ;
        earl:mode earl:automatic ;
        earl:result <#r> .
      <#r> a earl:TestResult ; earl:outcome earl:bogusOutcome .
    `;
    const report = await validateTtl(ttl);
    expect(report.conforms).toBe(false);
    expect(report.results.some((r) => String(r.path?.value).endsWith("outcome"))).toBe(true);
  });

  it("an assertion with an unknown earl:mode is non-conforming (sh:in)", async () => {
    const ttl = `
      @prefix earl: <http://www.w3.org/ns/earl#> .
      <#a> a earl:Assertion ;
        earl:subject <https://site.example/> ;
        earl:test <https://www.w3.org/TR/WCAG22/#non-text-content> ;
        earl:assertedBy <${BASE}#assertor> ;
        earl:mode earl:teleport ;
        earl:result <#r> .
      <#r> a earl:TestResult ; earl:outcome earl:failed .
    `;
    const report = await validateTtl(ttl);
    expect(report.conforms).toBe(false);
    expect(report.results.some((r) => String(r.path?.value).endsWith("mode"))).toBe(true);
  });
});
