// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
/**
 * `@jeswr/solid-a11y-report` — the typed EARL (Evaluation And Report Language)
 * RDF data-model for accessibility test results.
 *
 * Turns a framework-neutral, axe-shaped scan (mirroring AccessRadar's
 * `ScanResult`) into W3C EARL 1.0 + ACT Rules Format 1.1 assertions — one
 * `earl:Assertion` per (rule × page × failing node × WCAG success criterion),
 * with WCAG-SC `earl:TestRequirement` IRIs (the version-specific W3C TR anchors),
 * axe-rule `earl:TestCase` docs, `ptr:CSSSelectorPointer` selectors, and
 * `earl:automatic` mode. Built with typed `@rdfjs/wrapper` accessors, serialised
 * with `n3.Writer`, parsed back with `@jeswr/fetch-rdf`. Reuses standard
 * vocabulary only (`earl:`, `ptr:`, `dcterms:`, `schema:`, `prov:`) — mints
 * nothing — and ships the SHACL shape that pins the contract.
 *
 * The `node:fs`/`node:url`-using shape helpers (`a11yReportShapeTtl`,
 * `A11Y_REPORT_SHAPE_PATH`) live ONLY behind the `./shape` subpath — never here —
 * so this root barrel stays bundlable by a browser bundler. See
 * `src/browser-bundle.test.ts`.
 *
 * @packageDocumentation
 */
export { aclUrlFor, buildOwnerAcl, writeOwnerAcl, } from "./acl.js";
export { Assertion, buildReport, modeIri, outcomeIri, parseReport, parseReportTtl, Software, serializeReport, storeToTurtle, TestCaseNode, TestResult, } from "./earl.js";
export { httpIriOrUndefined, isHttpIri } from "./iri.js";
export * from "./vocab.js";
export { slugify, wcagCriterionUri, wcagVersionFromAxeTag, } from "./wcag.js";
//# sourceMappingURL=index.js.map