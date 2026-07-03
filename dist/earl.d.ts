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
import type { DatasetCore, Term } from "@rdfjs/types";
import { TermWrapper } from "@rdfjs/wrapper";
import { Store } from "n3";
import { type WcagRef } from "./wcag.js";
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
/** The `earl:outcome` object IRI for a short outcome string. */
export declare function outcomeIri(outcome: A11yOutcome): string;
/** The `earl:mode` object IRI for a short mode string. */
export declare function modeIri(mode: A11yMode): string;
/** Base wrapper: a live `rdf:type` set, read/written through the vetted mappers. */
declare class RdfNode extends TermWrapper {
    /** The `rdf:type` set as a live set of IRI strings. */
    get types(): Set<string>;
    /** Stamp `rdf:type typeIri`. Idempotent; returns `this` for chaining. */
    addType(typeIri: string): this;
    /**
     * The first LITERAL object of `predicate` on this node, or `undefined`.
     * **Strict on read (untrusted-input hardening):** a non-literal object (a
     * NamedNode / blank node where a literal is expected) is skipped, so a hostile
     * document can never smuggle an IRI in as a string field — the field simply
     * drops. (The wrapper's `LiteralAs.string` is lax here — it returns a
     * NamedNode's IRI value — so the literal getters use this instead.)
     */
    protected literalString(predicate: string): string | undefined;
    /** The first literal object of `predicate` parsed as a finite number, else `undefined`. */
    protected literalNumber(predicate: string): number | undefined;
    /** The first literal object of `predicate` parsed as a valid Date, else `undefined`. */
    protected literalDate(predicate: string): Date | undefined;
}
/** Typed view of the `earl:Software` scanner assertor. */
export declare class Software extends RdfNode {
    /** Stamp `rdf:type earl:Software`. */
    mark(): this;
    get name(): string | undefined;
    set name(value: string | undefined);
    get version(): string | undefined;
    set version(value: string | undefined);
    /** `schema:url` — the tool homepage (an http(s) IRI). */
    get homepage(): string | undefined;
    set homepage(value: string | undefined);
    get generatedAt(): Date | undefined;
    set generatedAt(value: Date | undefined);
}
/** Typed view of an `earl:TestCase` (an axe rule doc, or the roll-up check-suite). */
export declare class TestCaseNode extends RdfNode {
    /** Stamp `rdf:type earl:TestCase`. */
    mark(): this;
    get title(): string | undefined;
    set title(value: string | undefined);
    get description(): string | undefined;
    set description(value: string | undefined);
}
/** Typed view of an `earl:TestResult`. */
export declare class TestResult extends RdfNode {
    /** Stamp `rdf:type earl:TestResult`. */
    mark(): this;
    /** The `earl:outcome` individual IRI (e.g. `earl:failed`). */
    get outcome(): string | undefined;
    set outcome(value: string | undefined);
    /** `earl:info` — the failure summary. */
    get info(): string | undefined;
    set info(value: string | undefined);
    /** `schema:value` — a roll-up passed/inapplicable count. */
    get count(): number | undefined;
    set count(value: number | undefined);
    /**
     * Attach a CSS-selector pointer as an `earl:pointer` edge to a fresh blank node
     * typed `ptr:CSSSelectorPointer` carrying the selector as an `rdf:value` literal
     * — the ACT-context-correct shape. Never hand-built as a text triple; the blank
     * node + its two edges are added as RDF/JS quads through the wrapper's factory +
     * dataset.
     */
    setPointer(selector: string): void;
    /**
     * Read the CSS selector back, accepting EITHER the `ptr:CSSSelectorPointer`
     * blank-node form (a pointer node with an `rdf:value` selector literal) OR a
     * plain string-literal object of `earl:pointer` (the alternate ACT shape).
     * Returns `undefined` if neither is present or the value is not a literal.
     */
    get pointerSelector(): string | undefined;
}
/** Typed view of a single `earl:Assertion`. */
export declare class Assertion extends RdfNode {
    /** Stamp `rdf:type earl:Assertion`. */
    mark(): this;
    /** `earl:assertedBy` — the assertor IRI. */
    get assertedBy(): string | undefined;
    set assertedBy(value: string | undefined);
    /** `earl:subject` — the page IRI. */
    get testSubject(): string | undefined;
    set testSubject(value: string | undefined);
    /** `earl:test` — the criterion IRI (a WCAG SC requirement, or an axe TestCase). */
    get test(): string | undefined;
    set test(value: string | undefined);
    /** `earl:mode` — the test-mode individual IRI. */
    get mode(): string | undefined;
    set mode(value: string | undefined);
    /** `dcterms:references` — the axe rule documentation `earl:TestCase` IRI. */
    get testCase(): string | undefined;
    set testCase(value: string | undefined);
    /** Point `earl:result` at `resultIri` (a NamedNode). */
    setResult(resultIri: string): void;
    /**
     * The `earl:result` object term (NamedNode OR blank node — tolerant on read so
     * a foreign report using a blank-node result still parses). `undefined` if
     * absent.
     */
    get resultNode(): Term | undefined;
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
export declare function buildReport(reportBaseUrl: string, input: A11yScanInput): Store;
/** Serialise any n3 `Store` to Turtle with the model's prefixes. */
export declare function storeToTurtle(store: Store): Promise<string>;
/**
 * Serialise the EARL report for `input` to Turtle (via {@link buildReport} +
 * `n3.Writer`). Never hand-concatenates RDF.
 */
export declare function serializeReport(reportBaseUrl: string, input: A11yScanInput): Promise<string>;
/**
 * Parse an EARL report graph back to typed assertions. Every read is
 * `tryRead`-guarded: a malformed foreign literal drops the field (or the whole
 * assertion, for a required `earl:subject`/`earl:test`/outcome) rather than
 * aborting the parse. Assertions are returned in a deterministic order.
 */
export declare function parseReport(dataset: DatasetCore): A11yReportData;
/**
 * Parse a Turtle / JSON-LD EARL report body, dispatching on `contentType` via
 * `@jeswr/fetch-rdf`'s `parseRdf` (the suite's vetted RDF parser — never a
 * bespoke one).
 *
 * @param url         - the report resource URL (base IRI for relative refs).
 * @param body        - the raw response body.
 * @param contentType - the `Content-Type` (null ⇒ text/turtle, per Solid §5.2).
 */
export declare function parseReportTtl(url: string, body: string, contentType?: string | null): Promise<A11yReportData>;
export {};
//# sourceMappingURL=earl.d.ts.map