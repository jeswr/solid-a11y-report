// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
/**
 * The typed EARL accessibility-report model — build / serialise / parse W3C EARL
 * 1.0 + ACT Rules Format 1.1 assertions from a framework-neutral, axe-shaped scan.
 *
 * **One assertion per (rule x page x failing node x WCAG success criterion).**
 * axe reports multiple failing NODES per rule per page and a rule can map to
 * several success criteria; fanning out to the finest grain means no
 * selector-level failure and no criterion is silently collapsed away. Each
 * `earl:Assertion` pins exactly one `earl:subject` (the page), one `earl:test`
 * (a WCAG success-criterion `earl:TestRequirement`, or the axe rule doc as an
 * `earl:TestCase` when the rule maps to no SC), one `earl:result`
 * (`earl:outcome earl:failed` + `earl:info` failure summary + a
 * `ptr:CSSSelectorPointer` selector), one `earl:assertedBy` (the shared
 * `earl:Software` scanner), and `earl:mode earl:automatic`. Optional per-page
 * roll-up assertions carry passed / inapplicable counts.
 *
 * **Typed accessors, never hand-built triples (house rule).** The graph is built
 * with `@rdfjs/wrapper` `OptionalFrom`/`OptionalAs`/`SetFrom` mappers on an n3
 * `Store`; serialisation is `n3.Writer`; parsing a fetched body is
 * `@jeswr/fetch-rdf`'s `parseRdf`. Untrusted object-property IRIs (page URL,
 * tool homepage, axe helpUrl) pass through the http(s)-only {@link httpIriOrUndefined}
 * filter — a non-http(s) value is dropped, never coerced into a malformed
 * NamedNode. On parse, every typed read is `tryRead`-guarded so a malformed
 * foreign literal drops the field (or the whole assertion, for a required one)
 * rather than aborting the parse.
 */

import type { DatasetCore, Quad_Subject, Term } from "@rdfjs/types";
import {
  LiteralFrom,
  NamedNodeAs,
  NamedNodeFrom,
  OptionalAs,
  OptionalFrom,
  SetFrom,
  TermWrapper,
} from "@rdfjs/wrapper";
import { DataFactory, Store, Writer } from "n3";
import { httpIriOrUndefined } from "./iri.js";
import {
  DCT_DESCRIPTION,
  DCT_HAS_VERSION,
  DCT_REFERENCES,
  DCT_TITLE,
  EARL_ASSERTED_BY,
  EARL_ASSERTION,
  EARL_AUTOMATIC,
  EARL_CANT_TELL,
  EARL_FAILED,
  EARL_INAPPLICABLE,
  EARL_INFO,
  EARL_MANUAL,
  EARL_MODE,
  EARL_OUTCOME,
  EARL_PASSED,
  EARL_POINTER,
  EARL_RESULT,
  EARL_SEMI_AUTO,
  EARL_SOFTWARE,
  EARL_SUBJECT,
  EARL_TEST,
  EARL_TEST_CASE,
  EARL_TEST_REQUIREMENT,
  EARL_TEST_RESULT,
  EARL_TEST_SUBJECT,
  EARL_UNDISCLOSED,
  EARL_UNKNOWN_MODE,
  EARL_UNTESTED,
  PREFIXES,
  PROV_GENERATED_AT_TIME,
  PTR_CSS_SELECTOR_POINTER,
  RDF_TYPE,
  RDF_VALUE,
  SCHEMA_URL,
  SCHEMA_VALUE,
} from "./vocab.js";
import { type WcagRef, wcagCriterionUri } from "./wcag.js";

const { namedNode } = DataFactory;

// --- Input model (framework-neutral; mirrors AccessRadar's ScanResult) --------

/** A framework-neutral accessibility scan — the input to {@link buildReport}. */
export interface A11yScanInput {
  /** Scanner name → `earl:Software` `dcterms:title` (e.g. "AccessRadar"). */
  toolName: string;
  /** Scanner/engine version → `dcterms:hasVersion` (e.g. the axe-core version). */
  toolVersion?: string;
  /** Scanner homepage → `schema:url` (dropped unless an absolute http(s) IRI). */
  toolHomepage?: string;
  /** Optional provenance stamp → `prov:generatedAtTime` on the assertor. */
  generatedAt?: Date;
  /** The scanned pages. */
  pages: A11yPageInput[];
}

/** A single scanned page. */
export interface A11yPageInput {
  /** The page URL → the `earl:TestSubject` IRI (page dropped unless http(s)). */
  url: string;
  /** The failing rules found on this page. */
  issues: A11yIssueInput[];
  /** Count of passed automated checks → an optional per-page `earl:passed` roll-up. */
  passes?: number;
  /** Count of inapplicable checks → an optional per-page `earl:inapplicable` roll-up. */
  inapplicable?: number;
}

/** A failing axe rule on a page. */
export interface A11yIssueInput {
  /** axe rule id, e.g. "image-alt". */
  ruleId: string;
  /** Short rule description → `dcterms:description` on the rule's `earl:TestCase`. */
  description?: string;
  /** Link to the axe/Deque rule documentation → an `earl:TestCase`. */
  helpUrl?: string;
  /** axe impact band (informational; not currently written to the graph). */
  impact?: "critical" | "serious" | "moderate" | "minor";
  /** WCAG success criteria this rule maps to (may be empty for best-practice rules). */
  wcag: WcagRef[];
  /** The failing elements (one assertion per node). */
  nodes: A11yNodeInput[];
}

/** A single failing element. */
export interface A11yNodeInput {
  /** CSS selector locating the element → the `ptr:CSSSelectorPointer` `rdf:value`. */
  selector: string;
  /** axe's plain-language failure summary → `earl:info`. */
  failureSummary?: string;
  /** The offending HTML snippet (informational; not currently written to the graph). */
  html?: string;
}

// --- Output model (the parsed, typed view) ------------------------------------

/** An EARL outcome, as the short ACT-outcome string. */
export type A11yOutcome = "passed" | "failed" | "cantTell" | "inapplicable" | "untested";

/** An EARL test mode, as a short string. */
export type A11yMode = "automatic" | "manual" | "semiAuto" | "undisclosed" | "unknownMode";

/** One parsed assertion — the typed read of an `earl:Assertion`. */
export interface A11yAssertionData {
  /** `earl:subject` — the page IRI. */
  subject: string;
  /** `earl:test` — the WCAG SC (`earl:TestRequirement`) or axe rule (`earl:TestCase`) IRI. */
  test: string;
  /** `earl:result` → `earl:outcome`, as the short outcome string. */
  outcome: A11yOutcome;
  /** `earl:mode`, as the short mode string. */
  mode?: A11yMode;
  /** `earl:assertedBy` — the assertor IRI. */
  assertedBy?: string;
  /** The `ptr:CSSSelectorPointer` selector from `earl:result` `earl:pointer`. */
  selector?: string;
  /** `earl:info` on the result — axe's failure summary. */
  info?: string;
  /** `dcterms:references` — the axe rule documentation `earl:TestCase` IRI. */
  testCase?: string;
  /** `schema:value` on the result — a roll-up passed/inapplicable count. */
  value?: number;
}

/** A parsed EARL report — the list of typed assertions. */
export interface A11yReportData {
  /** The assertions, sorted deterministically by (subject, test, selector, outcome, info). */
  assertions: A11yAssertionData[];
}

// --- Outcome / mode <-> IRI maps ----------------------------------------------

const OUTCOME_TO_IRI: Record<A11yOutcome, string> = {
  passed: EARL_PASSED,
  failed: EARL_FAILED,
  cantTell: EARL_CANT_TELL,
  inapplicable: EARL_INAPPLICABLE,
  untested: EARL_UNTESTED,
};
const IRI_TO_OUTCOME: Record<string, A11yOutcome> = Object.fromEntries(
  Object.entries(OUTCOME_TO_IRI).map(([k, v]) => [v, k as A11yOutcome]),
);

const MODE_TO_IRI: Record<A11yMode, string> = {
  automatic: EARL_AUTOMATIC,
  manual: EARL_MANUAL,
  semiAuto: EARL_SEMI_AUTO,
  undisclosed: EARL_UNDISCLOSED,
  unknownMode: EARL_UNKNOWN_MODE,
};
const IRI_TO_MODE: Record<string, A11yMode> = Object.fromEntries(
  Object.entries(MODE_TO_IRI).map(([k, v]) => [v, k as A11yMode]),
);

/** The `earl:outcome` object IRI for a short outcome string. */
export function outcomeIri(outcome: A11yOutcome): string {
  return OUTCOME_TO_IRI[outcome];
}

/** The `earl:mode` object IRI for a short mode string. */
export function modeIri(mode: A11yMode): string {
  return MODE_TO_IRI[mode];
}

// --- Small shared helpers -----------------------------------------------------

/** Assign `target[key] = value` only when `value` is defined. */
function setIfDefined<T, K extends keyof T>(target: T, key: K, value: T[K] | undefined): void {
  if (value !== undefined) target[key] = value;
}

/** Run `fn`, returning `undefined` if it throws — the per-field fail-closed read guard. */
function tryRead<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

// --- Typed node wrappers ------------------------------------------------------

/** Base wrapper: a live `rdf:type` set, read/written through the vetted mappers. */
class RdfNode extends TermWrapper {
  /** The `rdf:type` set as a live set of IRI strings. */
  get types(): Set<string> {
    return SetFrom.subjectPredicate(this, RDF_TYPE, NamedNodeAs.string, NamedNodeFrom.string);
  }
  /** Stamp `rdf:type typeIri`. Idempotent; returns `this` for chaining. */
  addType(typeIri: string): this {
    this.types.add(typeIri);
    return this;
  }

  /**
   * The first LITERAL object of `predicate` on this node, or `undefined`.
   * **Strict on read (untrusted-input hardening):** a non-literal object (a
   * NamedNode / blank node where a literal is expected) is skipped, so a hostile
   * document can never smuggle an IRI in as a string field — the field simply
   * drops. (The wrapper's `LiteralAs.string` is lax here — it returns a
   * NamedNode's IRI value — so the literal getters use this instead.)
   */
  protected literalString(predicate: string): string | undefined {
    const self = this as unknown as Term;
    for (const quad of this.dataset.match(self, this.factory.namedNode(predicate), null)) {
      if (quad.object.termType === "Literal") return quad.object.value;
    }
    return undefined;
  }

  /** The first literal object of `predicate` parsed as a finite number, else `undefined`. */
  protected literalNumber(predicate: string): number | undefined {
    const lexical = this.literalString(predicate);
    if (lexical === undefined) return undefined;
    const n = Number(lexical);
    return Number.isFinite(n) ? n : undefined;
  }

  /** The first literal object of `predicate` parsed as a valid Date, else `undefined`. */
  protected literalDate(predicate: string): Date | undefined {
    const lexical = this.literalString(predicate);
    if (lexical === undefined) return undefined;
    const d = new Date(lexical);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
}

/** Typed view of the `earl:Software` scanner assertor. */
export class Software extends RdfNode {
  /** Stamp `rdf:type earl:Software`. */
  mark(): this {
    return this.addType(EARL_SOFTWARE);
  }
  get name(): string | undefined {
    return this.literalString(DCT_TITLE);
  }
  set name(value: string | undefined) {
    OptionalAs.object(this, DCT_TITLE, value, LiteralFrom.string);
  }
  get version(): string | undefined {
    return this.literalString(DCT_HAS_VERSION);
  }
  set version(value: string | undefined) {
    OptionalAs.object(this, DCT_HAS_VERSION, value, LiteralFrom.string);
  }
  /** `schema:url` — the tool homepage (an http(s) IRI). */
  get homepage(): string | undefined {
    return OptionalFrom.subjectPredicate(this, SCHEMA_URL, NamedNodeAs.string);
  }
  set homepage(value: string | undefined) {
    OptionalAs.object(this, SCHEMA_URL, value, NamedNodeFrom.string);
  }
  get generatedAt(): Date | undefined {
    return this.literalDate(PROV_GENERATED_AT_TIME);
  }
  set generatedAt(value: Date | undefined) {
    OptionalAs.object(this, PROV_GENERATED_AT_TIME, value, LiteralFrom.dateTime);
  }
}

/** Typed view of an `earl:TestCase` (an axe rule doc, or the roll-up check-suite). */
export class TestCaseNode extends RdfNode {
  /** Stamp `rdf:type earl:TestCase`. */
  mark(): this {
    return this.addType(EARL_TEST_CASE);
  }
  get title(): string | undefined {
    return this.literalString(DCT_TITLE);
  }
  set title(value: string | undefined) {
    OptionalAs.object(this, DCT_TITLE, value, LiteralFrom.string);
  }
  get description(): string | undefined {
    return this.literalString(DCT_DESCRIPTION);
  }
  set description(value: string | undefined) {
    OptionalAs.object(this, DCT_DESCRIPTION, value, LiteralFrom.string);
  }
}

/** Typed view of an `earl:TestResult`. */
export class TestResult extends RdfNode {
  /** Stamp `rdf:type earl:TestResult`. */
  mark(): this {
    return this.addType(EARL_TEST_RESULT);
  }
  /** The `earl:outcome` individual IRI (e.g. `earl:failed`). */
  get outcome(): string | undefined {
    return OptionalFrom.subjectPredicate(this, EARL_OUTCOME, NamedNodeAs.string);
  }
  set outcome(value: string | undefined) {
    OptionalAs.object(this, EARL_OUTCOME, value, NamedNodeFrom.string);
  }
  /** `earl:info` — the failure summary. */
  get info(): string | undefined {
    return this.literalString(EARL_INFO);
  }
  set info(value: string | undefined) {
    OptionalAs.object(this, EARL_INFO, value, LiteralFrom.string);
  }
  /** `schema:value` — a roll-up passed/inapplicable count. */
  get count(): number | undefined {
    return this.literalNumber(SCHEMA_VALUE);
  }
  set count(value: number | undefined) {
    OptionalAs.object(this, SCHEMA_VALUE, value, LiteralFrom.integer);
  }

  /**
   * Attach a CSS-selector pointer as an `earl:pointer` edge to a fresh blank node
   * typed `ptr:CSSSelectorPointer` carrying the selector as an `rdf:value` literal
   * — the ACT-context-correct shape. Never hand-built as a text triple; the blank
   * node + its two edges are added as RDF/JS quads through the wrapper's factory +
   * dataset.
   */
  setPointer(selector: string): void {
    const f = this.factory;
    const self = this as unknown as Quad_Subject;
    const ptrNode = f.blankNode();
    this.dataset.add(f.quad(self, f.namedNode(EARL_POINTER), ptrNode));
    this.dataset.add(f.quad(ptrNode, f.namedNode(RDF_TYPE), f.namedNode(PTR_CSS_SELECTOR_POINTER)));
    this.dataset.add(f.quad(ptrNode, f.namedNode(RDF_VALUE), f.literal(selector)));
  }

  /**
   * Read the CSS selector back, accepting EITHER the `ptr:CSSSelectorPointer`
   * blank-node form (a pointer node with an `rdf:value` selector literal) OR a
   * plain string-literal object of `earl:pointer` (the alternate ACT shape).
   * Returns `undefined` if neither is present or the value is not a literal.
   */
  get pointerSelector(): string | undefined {
    const f = this.factory;
    const self = this as unknown as Term;
    for (const q of this.dataset.match(self, f.namedNode(EARL_POINTER), null)) {
      const pointer = q.object;
      if (pointer.termType === "Literal") return pointer.value;
      for (const v of this.dataset.match(pointer as Quad_Subject, f.namedNode(RDF_VALUE), null)) {
        if (v.object.termType === "Literal") return v.object.value;
      }
    }
    return undefined;
  }
}

/** Typed view of a single `earl:Assertion`. */
export class Assertion extends RdfNode {
  /** Stamp `rdf:type earl:Assertion`. */
  mark(): this {
    return this.addType(EARL_ASSERTION);
  }
  /** `earl:assertedBy` — the assertor IRI. */
  get assertedBy(): string | undefined {
    return OptionalFrom.subjectPredicate(this, EARL_ASSERTED_BY, NamedNodeAs.string);
  }
  set assertedBy(value: string | undefined) {
    OptionalAs.object(this, EARL_ASSERTED_BY, value, NamedNodeFrom.string);
  }
  /** `earl:subject` — the page IRI. */
  get testSubject(): string | undefined {
    return OptionalFrom.subjectPredicate(this, EARL_SUBJECT, NamedNodeAs.string);
  }
  set testSubject(value: string | undefined) {
    OptionalAs.object(this, EARL_SUBJECT, value, NamedNodeFrom.string);
  }
  /** `earl:test` — the criterion IRI (a WCAG SC requirement, or an axe TestCase). */
  get test(): string | undefined {
    return OptionalFrom.subjectPredicate(this, EARL_TEST, NamedNodeAs.string);
  }
  set test(value: string | undefined) {
    OptionalAs.object(this, EARL_TEST, value, NamedNodeFrom.string);
  }
  /** `earl:mode` — the test-mode individual IRI. */
  get mode(): string | undefined {
    return OptionalFrom.subjectPredicate(this, EARL_MODE, NamedNodeAs.string);
  }
  set mode(value: string | undefined) {
    OptionalAs.object(this, EARL_MODE, value, NamedNodeFrom.string);
  }
  /** `dcterms:references` — the axe rule documentation `earl:TestCase` IRI. */
  get testCase(): string | undefined {
    return OptionalFrom.subjectPredicate(this, DCT_REFERENCES, NamedNodeAs.string);
  }
  set testCase(value: string | undefined) {
    OptionalAs.object(this, DCT_REFERENCES, value, NamedNodeFrom.string);
  }
  /** Point `earl:result` at `resultIri` (a NamedNode). */
  setResult(resultIri: string): void {
    OptionalAs.object(this, EARL_RESULT, resultIri, NamedNodeFrom.string);
  }
  /**
   * The `earl:result` object term (NamedNode OR blank node — tolerant on read so
   * a foreign report using a blank-node result still parses). `undefined` if
   * absent.
   */
  get resultNode(): Term | undefined {
    const self = this as unknown as Term;
    for (const q of this.dataset.match(self, this.factory.namedNode(EARL_RESULT), null)) {
      return q.object;
    }
    return undefined;
  }
}

// --- Build --------------------------------------------------------------------

/** Canonical http(s) report base, fragment stripped; throws on a non-http(s) base. */
function normalizeReportBase(reportBaseUrl: string): string {
  let u: URL;
  try {
    u = new URL(reportBaseUrl);
  } catch {
    throw new Error(
      `buildReport: reportBaseUrl must be an absolute http(s) URL (got ${JSON.stringify(
        reportBaseUrl,
      )}).`,
    );
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error(
      `buildReport: reportBaseUrl must be http(s) (got ${u.protocol}) — refusing to mint report IRIs under a non-http scheme.`,
    );
  }
  u.hash = "";
  return u.href;
}

/** Ensure `subjectIri rdf:type typeIri` through the typed set accessor (idempotent). */
function markType(store: Store, subjectIri: string, typeIri: string): void {
  new RdfNode(subjectIri, store, DataFactory).addType(typeIri);
}

interface TestTarget {
  iri: string;
  kind: "requirement" | "testcase";
}

/**
 * Build an n3 `Store` holding the EARL report for `input`, rooted at
 * `reportBaseUrl`. Mints addressable fragment IRIs under the base: `#assertor`
 * (the shared `earl:Software`), `#automated-checks` (the roll-up `earl:TestCase`),
 * and `#assertion-<n>` / `#assertion-<n>-result` per assertion. Pure and
 * deterministic — no wall-clock time is stamped unless `input.generatedAt` is set.
 *
 * A page whose `url` is not an absolute http(s) IRI is skipped (it cannot be a
 * well-formed `earl:TestSubject`); an issue with neither a WCAG SC nor an http(s)
 * `helpUrl` is skipped (an assertion needs an `earl:test`). Every object-property
 * IRI is http(s)-filtered.
 *
 * @throws if `reportBaseUrl` is not an absolute http(s) URL (fail-closed).
 */
export function buildReport(reportBaseUrl: string, input: A11yScanInput): Store {
  const base = normalizeReportBase(reportBaseUrl);
  const store = new Store();

  const assertorIri = `${base}#assertor`;
  const software = new Software(assertorIri, store, DataFactory).mark();
  software.name = input.toolName || undefined;
  software.version = input.toolVersion || undefined;
  software.homepage = httpIriOrUndefined(input.toolHomepage);
  if (input.generatedAt) software.generatedAt = input.generatedAt;

  const automatedChecksIri = `${base}#automated-checks`;

  let counter = 0;
  const nextAssertion = (): string => `${base}#assertion-${counter++}`;

  const buildFailAssertion = (
    subjectIri: string,
    target: TestTarget,
    helpUrlIri: string | undefined,
    info: string | undefined,
    selector: string | undefined,
  ): void => {
    const assertionIri = nextAssertion();
    const assertion = new Assertion(assertionIri, store, DataFactory).mark();
    assertion.assertedBy = assertorIri;
    assertion.testSubject = subjectIri;
    assertion.test = target.iri;
    assertion.mode = EARL_AUTOMATIC;
    markType(
      store,
      target.iri,
      target.kind === "requirement" ? EARL_TEST_REQUIREMENT : EARL_TEST_CASE,
    );
    if (helpUrlIri) {
      assertion.testCase = helpUrlIri;
      markType(store, helpUrlIri, EARL_TEST_CASE);
    }
    const resultIri = `${assertionIri}-result`;
    assertion.setResult(resultIri);
    const result = new TestResult(resultIri, store, DataFactory).mark();
    result.outcome = EARL_FAILED;
    result.info = info || undefined;
    if (selector && selector.trim().length > 0) result.setPointer(selector);
  };

  const emitRollup = (subjectIri: string, outcome: string, count: number): void => {
    const checks = new TestCaseNode(automatedChecksIri, store, DataFactory).mark();
    checks.title = "Automated accessibility checks";
    const assertionIri = nextAssertion();
    const assertion = new Assertion(assertionIri, store, DataFactory).mark();
    assertion.assertedBy = assertorIri;
    assertion.testSubject = subjectIri;
    assertion.test = automatedChecksIri;
    assertion.mode = EARL_AUTOMATIC;
    const resultIri = `${assertionIri}-result`;
    assertion.setResult(resultIri);
    const result = new TestResult(resultIri, store, DataFactory).mark();
    result.outcome = outcome;
    result.count = count;
  };

  for (const page of input.pages) {
    const subjectIri = httpIriOrUndefined(page.url);
    if (!subjectIri) continue; // no valid TestSubject IRI → skip page
    markType(store, subjectIri, EARL_TEST_SUBJECT);

    for (const issue of page.issues ?? []) {
      const helpUrlIri = httpIriOrUndefined(issue.helpUrl);

      // The rule's TestCase node carries its description (idempotent per helpUrl).
      if (helpUrlIri && issue.description) {
        new TestCaseNode(helpUrlIri, store, DataFactory).mark().description = issue.description;
      }

      // Resolve the WCAG SC requirement IRIs (guarded: an unknown version is
      // dropped, not fatal). If none, fall back to the axe rule doc as the test.
      const requirementIris: string[] = [];
      for (const ref of issue.wcag ?? []) {
        const uri = tryRead(() => wcagCriterionUri(ref));
        if (uri) requirementIris.push(uri);
      }
      let testTargets: TestTarget[];
      if (requirementIris.length > 0) {
        testTargets = requirementIris.map((iri) => ({ iri, kind: "requirement" }));
      } else if (helpUrlIri) {
        testTargets = [{ iri: helpUrlIri, kind: "testcase" }];
      } else {
        continue; // no valid earl:test possible → skip the issue
      }

      const nodeList: (A11yNodeInput | undefined)[] =
        issue.nodes && issue.nodes.length > 0 ? issue.nodes : [undefined];

      for (const node of nodeList) {
        const info = node ? node.failureSummary : issue.description;
        const selector = node?.selector;
        for (const target of testTargets) {
          buildFailAssertion(subjectIri, target, helpUrlIri, info, selector);
        }
      }
    }

    if (typeof page.passes === "number") emitRollup(subjectIri, EARL_PASSED, page.passes);
    if (typeof page.inapplicable === "number") {
      emitRollup(subjectIri, EARL_INAPPLICABLE, page.inapplicable);
    }
  }

  return store;
}

// --- Serialise ----------------------------------------------------------------

/** Serialise any n3 `Store` to Turtle with the model's prefixes. */
export function storeToTurtle(store: Store): Promise<string> {
  const writer = new Writer({ prefixes: { ...PREFIXES } });
  writer.addQuads([...store]);
  return new Promise<string>((resolve, reject) => {
    writer.end((error, result) => (error ? reject(error) : resolve(result)));
  });
}

/**
 * Serialise the EARL report for `input` to Turtle (via {@link buildReport} +
 * `n3.Writer`). Never hand-concatenates RDF.
 */
export async function serializeReport(
  reportBaseUrl: string,
  input: A11yScanInput,
): Promise<string> {
  return storeToTurtle(buildReport(reportBaseUrl, input));
}

// --- Parse --------------------------------------------------------------------

/** Stable ordering for parsed assertions (deterministic regardless of quad order). */
function compareAssertions(a: A11yAssertionData, b: A11yAssertionData): number {
  return (
    a.subject.localeCompare(b.subject) ||
    a.test.localeCompare(b.test) ||
    (a.selector ?? "").localeCompare(b.selector ?? "") ||
    a.outcome.localeCompare(b.outcome) ||
    (a.info ?? "").localeCompare(b.info ?? "")
  );
}

/** Parse a single `earl:Assertion` subject; `undefined` if it is not well-formed. */
function parseAssertion(subject: Term, dataset: DatasetCore): A11yAssertionData | undefined {
  const assertion = new Assertion(subject, dataset, DataFactory);
  const subjectIri = tryRead(() => assertion.testSubject);
  const testIri = tryRead(() => assertion.test);
  if (!subjectIri || !testIri) return undefined;

  const resultNode = tryRead(() => assertion.resultNode);
  let outcome: A11yOutcome | undefined;
  let info: string | undefined;
  let selector: string | undefined;
  let value: number | undefined;
  if (resultNode) {
    const result = new TestResult(resultNode, dataset, DataFactory);
    const readOutcome = tryRead(() => result.outcome);
    outcome = readOutcome ? IRI_TO_OUTCOME[readOutcome] : undefined;
    info = tryRead(() => result.info);
    selector = tryRead(() => result.pointerSelector);
    value = tryRead(() => result.count);
  }
  if (!outcome) return undefined; // a well-formed assertion carries a determinable outcome

  const data: A11yAssertionData = { subject: subjectIri, test: testIri, outcome };
  setIfDefined(
    data,
    "assertedBy",
    tryRead(() => assertion.assertedBy),
  );
  const readMode = tryRead(() => assertion.mode);
  setIfDefined(data, "mode", readMode ? IRI_TO_MODE[readMode] : undefined);
  setIfDefined(
    data,
    "testCase",
    tryRead(() => assertion.testCase),
  );
  setIfDefined(data, "info", info);
  setIfDefined(data, "selector", selector);
  setIfDefined(data, "value", value);
  return data;
}

/**
 * Parse an EARL report graph back to typed assertions. Every read is
 * `tryRead`-guarded: a malformed foreign literal drops the field (or the whole
 * assertion, for a required `earl:subject`/`earl:test`/outcome) rather than
 * aborting the parse. Assertions are returned in a deterministic order.
 */
export function parseReport(dataset: DatasetCore): A11yReportData {
  const assertions: A11yAssertionData[] = [];
  const seen = new Set<string>();
  for (const quad of dataset.match(null, namedNode(RDF_TYPE), namedNode(EARL_ASSERTION))) {
    const key = quad.subject.value;
    if (seen.has(key)) continue;
    seen.add(key);
    const data = tryRead(() => parseAssertion(quad.subject, dataset));
    if (data) assertions.push(data);
  }
  assertions.sort(compareAssertions);
  return { assertions };
}

/**
 * Parse a Turtle / JSON-LD EARL report body, dispatching on `contentType` via
 * `@jeswr/fetch-rdf`'s `parseRdf` (the suite's vetted RDF parser — never a
 * bespoke one).
 *
 * @param url         - the report resource URL (base IRI for relative refs).
 * @param body        - the raw response body.
 * @param contentType - the `Content-Type` (null ⇒ text/turtle, per Solid §5.2).
 */
export async function parseReportTtl(
  url: string,
  body: string,
  contentType: string | null = "text/turtle",
): Promise<A11yReportData> {
  const resolvedContentType = contentType ?? "text/turtle";
  const { parseRdf } = await import("@jeswr/fetch-rdf");
  const dataset = await parseRdf(body, resolvedContentType, { baseIRI: url });
  return parseReport(dataset);
}
