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
import { LiteralFrom, NamedNodeAs, NamedNodeFrom, OptionalAs, OptionalFrom, SetFrom, TermWrapper, } from "@rdfjs/wrapper";
import { DataFactory, Store, Writer } from "n3";
import { httpIriOrUndefined } from "./iri.js";
import { DCT_DESCRIPTION, DCT_HAS_VERSION, DCT_REFERENCES, DCT_TITLE, EARL_ASSERTED_BY, EARL_ASSERTION, EARL_AUTOMATIC, EARL_CANT_TELL, EARL_FAILED, EARL_INAPPLICABLE, EARL_INFO, EARL_MANUAL, EARL_MODE, EARL_OUTCOME, EARL_PASSED, EARL_POINTER, EARL_RESULT, EARL_SEMI_AUTO, EARL_SOFTWARE, EARL_SUBJECT, EARL_TEST, EARL_TEST_CASE, EARL_TEST_REQUIREMENT, EARL_TEST_RESULT, EARL_TEST_SUBJECT, EARL_UNDISCLOSED, EARL_UNKNOWN_MODE, EARL_UNTESTED, PREFIXES, PROV_GENERATED_AT_TIME, PTR_CSS_SELECTOR_POINTER, RDF_TYPE, RDF_VALUE, SCHEMA_URL, SCHEMA_VALUE, } from "./vocab.js";
import { wcagCriterionUri } from "./wcag.js";
const { namedNode } = DataFactory;
// --- Outcome / mode <-> IRI maps ----------------------------------------------
const OUTCOME_TO_IRI = {
    passed: EARL_PASSED,
    failed: EARL_FAILED,
    cantTell: EARL_CANT_TELL,
    inapplicable: EARL_INAPPLICABLE,
    untested: EARL_UNTESTED,
};
const IRI_TO_OUTCOME = Object.fromEntries(Object.entries(OUTCOME_TO_IRI).map(([k, v]) => [v, k]));
const MODE_TO_IRI = {
    automatic: EARL_AUTOMATIC,
    manual: EARL_MANUAL,
    semiAuto: EARL_SEMI_AUTO,
    undisclosed: EARL_UNDISCLOSED,
    unknownMode: EARL_UNKNOWN_MODE,
};
const IRI_TO_MODE = Object.fromEntries(Object.entries(MODE_TO_IRI).map(([k, v]) => [v, k]));
/** The `earl:outcome` object IRI for a short outcome string. */
export function outcomeIri(outcome) {
    return OUTCOME_TO_IRI[outcome];
}
/** The `earl:mode` object IRI for a short mode string. */
export function modeIri(mode) {
    return MODE_TO_IRI[mode];
}
// --- Small shared helpers -----------------------------------------------------
/** Assign `target[key] = value` only when `value` is defined. */
function setIfDefined(target, key, value) {
    if (value !== undefined)
        target[key] = value;
}
/** Run `fn`, returning `undefined` if it throws — the per-field fail-closed read guard. */
function tryRead(fn) {
    try {
        return fn();
    }
    catch {
        return undefined;
    }
}
// --- Typed node wrappers ------------------------------------------------------
/** Base wrapper: a live `rdf:type` set, read/written through the vetted mappers. */
class RdfNode extends TermWrapper {
    /** The `rdf:type` set as a live set of IRI strings. */
    get types() {
        return SetFrom.subjectPredicate(this, RDF_TYPE, NamedNodeAs.string, NamedNodeFrom.string);
    }
    /** Stamp `rdf:type typeIri`. Idempotent; returns `this` for chaining. */
    addType(typeIri) {
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
    literalString(predicate) {
        const self = this;
        for (const quad of this.dataset.match(self, this.factory.namedNode(predicate), null)) {
            if (quad.object.termType === "Literal")
                return quad.object.value;
        }
        return undefined;
    }
    /** The first literal object of `predicate` parsed as a finite number, else `undefined`. */
    literalNumber(predicate) {
        const lexical = this.literalString(predicate);
        if (lexical === undefined)
            return undefined;
        const n = Number(lexical);
        return Number.isFinite(n) ? n : undefined;
    }
    /** The first literal object of `predicate` parsed as a valid Date, else `undefined`. */
    literalDate(predicate) {
        const lexical = this.literalString(predicate);
        if (lexical === undefined)
            return undefined;
        const d = new Date(lexical);
        return Number.isNaN(d.getTime()) ? undefined : d;
    }
}
/** Typed view of the `earl:Software` scanner assertor. */
export class Software extends RdfNode {
    /** Stamp `rdf:type earl:Software`. */
    mark() {
        return this.addType(EARL_SOFTWARE);
    }
    get name() {
        return this.literalString(DCT_TITLE);
    }
    set name(value) {
        OptionalAs.object(this, DCT_TITLE, value, LiteralFrom.string);
    }
    get version() {
        return this.literalString(DCT_HAS_VERSION);
    }
    set version(value) {
        OptionalAs.object(this, DCT_HAS_VERSION, value, LiteralFrom.string);
    }
    /** `schema:url` — the tool homepage (an http(s) IRI). */
    get homepage() {
        return OptionalFrom.subjectPredicate(this, SCHEMA_URL, NamedNodeAs.string);
    }
    set homepage(value) {
        OptionalAs.object(this, SCHEMA_URL, value, NamedNodeFrom.string);
    }
    get generatedAt() {
        return this.literalDate(PROV_GENERATED_AT_TIME);
    }
    set generatedAt(value) {
        OptionalAs.object(this, PROV_GENERATED_AT_TIME, value, LiteralFrom.dateTime);
    }
}
/** Typed view of an `earl:TestCase` (an axe rule doc, or the roll-up check-suite). */
export class TestCaseNode extends RdfNode {
    /** Stamp `rdf:type earl:TestCase`. */
    mark() {
        return this.addType(EARL_TEST_CASE);
    }
    get title() {
        return this.literalString(DCT_TITLE);
    }
    set title(value) {
        OptionalAs.object(this, DCT_TITLE, value, LiteralFrom.string);
    }
    get description() {
        return this.literalString(DCT_DESCRIPTION);
    }
    set description(value) {
        OptionalAs.object(this, DCT_DESCRIPTION, value, LiteralFrom.string);
    }
}
/** Typed view of an `earl:TestResult`. */
export class TestResult extends RdfNode {
    /** Stamp `rdf:type earl:TestResult`. */
    mark() {
        return this.addType(EARL_TEST_RESULT);
    }
    /** The `earl:outcome` individual IRI (e.g. `earl:failed`). */
    get outcome() {
        return OptionalFrom.subjectPredicate(this, EARL_OUTCOME, NamedNodeAs.string);
    }
    set outcome(value) {
        OptionalAs.object(this, EARL_OUTCOME, value, NamedNodeFrom.string);
    }
    /** `earl:info` — the failure summary. */
    get info() {
        return this.literalString(EARL_INFO);
    }
    set info(value) {
        OptionalAs.object(this, EARL_INFO, value, LiteralFrom.string);
    }
    /** `schema:value` — a roll-up passed/inapplicable count. */
    get count() {
        return this.literalNumber(SCHEMA_VALUE);
    }
    set count(value) {
        OptionalAs.object(this, SCHEMA_VALUE, value, LiteralFrom.integer);
    }
    /**
     * Attach a CSS-selector pointer as an `earl:pointer` edge to a fresh blank node
     * typed `ptr:CSSSelectorPointer` carrying the selector as an `rdf:value` literal
     * — the ACT-context-correct shape. Never hand-built as a text triple; the blank
     * node + its two edges are added as RDF/JS quads through the wrapper's factory +
     * dataset.
     */
    setPointer(selector) {
        const f = this.factory;
        const self = this;
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
    get pointerSelector() {
        const f = this.factory;
        const self = this;
        for (const q of this.dataset.match(self, f.namedNode(EARL_POINTER), null)) {
            const pointer = q.object;
            if (pointer.termType === "Literal")
                return pointer.value;
            for (const v of this.dataset.match(pointer, f.namedNode(RDF_VALUE), null)) {
                if (v.object.termType === "Literal")
                    return v.object.value;
            }
        }
        return undefined;
    }
}
/** Typed view of a single `earl:Assertion`. */
export class Assertion extends RdfNode {
    /** Stamp `rdf:type earl:Assertion`. */
    mark() {
        return this.addType(EARL_ASSERTION);
    }
    /** `earl:assertedBy` — the assertor IRI. */
    get assertedBy() {
        return OptionalFrom.subjectPredicate(this, EARL_ASSERTED_BY, NamedNodeAs.string);
    }
    set assertedBy(value) {
        OptionalAs.object(this, EARL_ASSERTED_BY, value, NamedNodeFrom.string);
    }
    /** `earl:subject` — the page IRI. */
    get testSubject() {
        return OptionalFrom.subjectPredicate(this, EARL_SUBJECT, NamedNodeAs.string);
    }
    set testSubject(value) {
        OptionalAs.object(this, EARL_SUBJECT, value, NamedNodeFrom.string);
    }
    /** `earl:test` — the criterion IRI (a WCAG SC requirement, or an axe TestCase). */
    get test() {
        return OptionalFrom.subjectPredicate(this, EARL_TEST, NamedNodeAs.string);
    }
    set test(value) {
        OptionalAs.object(this, EARL_TEST, value, NamedNodeFrom.string);
    }
    /** `earl:mode` — the test-mode individual IRI. */
    get mode() {
        return OptionalFrom.subjectPredicate(this, EARL_MODE, NamedNodeAs.string);
    }
    set mode(value) {
        OptionalAs.object(this, EARL_MODE, value, NamedNodeFrom.string);
    }
    /** `dcterms:references` — the axe rule documentation `earl:TestCase` IRI. */
    get testCase() {
        return OptionalFrom.subjectPredicate(this, DCT_REFERENCES, NamedNodeAs.string);
    }
    set testCase(value) {
        OptionalAs.object(this, DCT_REFERENCES, value, NamedNodeFrom.string);
    }
    /** Point `earl:result` at `resultIri` (a NamedNode). */
    setResult(resultIri) {
        OptionalAs.object(this, EARL_RESULT, resultIri, NamedNodeFrom.string);
    }
    /**
     * The `earl:result` object term (NamedNode OR blank node — tolerant on read so
     * a foreign report using a blank-node result still parses). `undefined` if
     * absent.
     */
    get resultNode() {
        const self = this;
        for (const q of this.dataset.match(self, this.factory.namedNode(EARL_RESULT), null)) {
            return q.object;
        }
        return undefined;
    }
}
// --- Build --------------------------------------------------------------------
/** Canonical http(s) report base, fragment stripped; throws on a non-http(s) base. */
function normalizeReportBase(reportBaseUrl) {
    let u;
    try {
        u = new URL(reportBaseUrl);
    }
    catch {
        throw new Error(`buildReport: reportBaseUrl must be an absolute http(s) URL (got ${JSON.stringify(reportBaseUrl)}).`);
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
        throw new Error(`buildReport: reportBaseUrl must be http(s) (got ${u.protocol}) — refusing to mint report IRIs under a non-http scheme.`);
    }
    u.hash = "";
    return u.href;
}
/** Ensure `subjectIri rdf:type typeIri` through the typed set accessor (idempotent). */
function markType(store, subjectIri, typeIri) {
    new RdfNode(subjectIri, store, DataFactory).addType(typeIri);
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
export function buildReport(reportBaseUrl, input) {
    const base = normalizeReportBase(reportBaseUrl);
    const store = new Store();
    const assertorIri = `${base}#assertor`;
    const software = new Software(assertorIri, store, DataFactory).mark();
    software.name = input.toolName || undefined;
    software.version = input.toolVersion || undefined;
    software.homepage = httpIriOrUndefined(input.toolHomepage);
    if (input.generatedAt)
        software.generatedAt = input.generatedAt;
    const automatedChecksIri = `${base}#automated-checks`;
    let counter = 0;
    const nextAssertion = () => `${base}#assertion-${counter++}`;
    const buildFailAssertion = (subjectIri, target, helpUrlIri, info, selector) => {
        const assertionIri = nextAssertion();
        const assertion = new Assertion(assertionIri, store, DataFactory).mark();
        assertion.assertedBy = assertorIri;
        assertion.testSubject = subjectIri;
        assertion.test = target.iri;
        assertion.mode = EARL_AUTOMATIC;
        markType(store, target.iri, target.kind === "requirement" ? EARL_TEST_REQUIREMENT : EARL_TEST_CASE);
        if (helpUrlIri) {
            assertion.testCase = helpUrlIri;
            markType(store, helpUrlIri, EARL_TEST_CASE);
        }
        const resultIri = `${assertionIri}-result`;
        assertion.setResult(resultIri);
        const result = new TestResult(resultIri, store, DataFactory).mark();
        result.outcome = EARL_FAILED;
        result.info = info || undefined;
        if (selector && selector.trim().length > 0)
            result.setPointer(selector);
    };
    const emitRollup = (subjectIri, outcome, count) => {
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
        if (!subjectIri)
            continue; // no valid TestSubject IRI → skip page
        markType(store, subjectIri, EARL_TEST_SUBJECT);
        for (const issue of page.issues ?? []) {
            const helpUrlIri = httpIriOrUndefined(issue.helpUrl);
            // The rule's TestCase node carries its description (idempotent per helpUrl).
            if (helpUrlIri && issue.description) {
                new TestCaseNode(helpUrlIri, store, DataFactory).mark().description = issue.description;
            }
            // Resolve the WCAG SC requirement IRIs (guarded: an unknown version is
            // dropped, not fatal). If none, fall back to the axe rule doc as the test.
            const requirementIris = [];
            for (const ref of issue.wcag ?? []) {
                const uri = tryRead(() => wcagCriterionUri(ref));
                if (uri)
                    requirementIris.push(uri);
            }
            let testTargets;
            if (requirementIris.length > 0) {
                testTargets = requirementIris.map((iri) => ({ iri, kind: "requirement" }));
            }
            else if (helpUrlIri) {
                testTargets = [{ iri: helpUrlIri, kind: "testcase" }];
            }
            else {
                continue; // no valid earl:test possible → skip the issue
            }
            const nodeList = issue.nodes && issue.nodes.length > 0 ? issue.nodes : [undefined];
            for (const node of nodeList) {
                const info = node ? node.failureSummary : issue.description;
                const selector = node?.selector;
                for (const target of testTargets) {
                    buildFailAssertion(subjectIri, target, helpUrlIri, info, selector);
                }
            }
        }
        if (typeof page.passes === "number")
            emitRollup(subjectIri, EARL_PASSED, page.passes);
        if (typeof page.inapplicable === "number") {
            emitRollup(subjectIri, EARL_INAPPLICABLE, page.inapplicable);
        }
    }
    return store;
}
// --- Serialise ----------------------------------------------------------------
/** Serialise any n3 `Store` to Turtle with the model's prefixes. */
export function storeToTurtle(store) {
    const writer = new Writer({ prefixes: { ...PREFIXES } });
    writer.addQuads([...store]);
    return new Promise((resolve, reject) => {
        writer.end((error, result) => (error ? reject(error) : resolve(result)));
    });
}
/**
 * Serialise the EARL report for `input` to Turtle (via {@link buildReport} +
 * `n3.Writer`). Never hand-concatenates RDF.
 */
export async function serializeReport(reportBaseUrl, input) {
    return storeToTurtle(buildReport(reportBaseUrl, input));
}
// --- Parse --------------------------------------------------------------------
/** Stable ordering for parsed assertions (deterministic regardless of quad order). */
function compareAssertions(a, b) {
    return (a.subject.localeCompare(b.subject) ||
        a.test.localeCompare(b.test) ||
        (a.selector ?? "").localeCompare(b.selector ?? "") ||
        a.outcome.localeCompare(b.outcome) ||
        (a.info ?? "").localeCompare(b.info ?? ""));
}
/** Parse a single `earl:Assertion` subject; `undefined` if it is not well-formed. */
function parseAssertion(subject, dataset) {
    const assertion = new Assertion(subject, dataset, DataFactory);
    const subjectIri = tryRead(() => assertion.testSubject);
    const testIri = tryRead(() => assertion.test);
    if (!subjectIri || !testIri)
        return undefined;
    const resultNode = tryRead(() => assertion.resultNode);
    let outcome;
    let info;
    let selector;
    let value;
    if (resultNode) {
        const result = new TestResult(resultNode, dataset, DataFactory);
        const readOutcome = tryRead(() => result.outcome);
        outcome = readOutcome ? IRI_TO_OUTCOME[readOutcome] : undefined;
        info = tryRead(() => result.info);
        selector = tryRead(() => result.pointerSelector);
        value = tryRead(() => result.count);
    }
    if (!outcome)
        return undefined; // a well-formed assertion carries a determinable outcome
    const data = { subject: subjectIri, test: testIri, outcome };
    setIfDefined(data, "assertedBy", tryRead(() => assertion.assertedBy));
    const readMode = tryRead(() => assertion.mode);
    setIfDefined(data, "mode", readMode ? IRI_TO_MODE[readMode] : undefined);
    setIfDefined(data, "testCase", tryRead(() => assertion.testCase));
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
export function parseReport(dataset) {
    const assertions = [];
    const seen = new Set();
    for (const quad of dataset.match(null, namedNode(RDF_TYPE), namedNode(EARL_ASSERTION))) {
        const key = quad.subject.value;
        if (seen.has(key))
            continue;
        seen.add(key);
        const data = tryRead(() => parseAssertion(quad.subject, dataset));
        if (data)
            assertions.push(data);
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
export async function parseReportTtl(url, body, contentType = "text/turtle") {
    const resolvedContentType = contentType ?? "text/turtle";
    const { parseRdf } = await import("@jeswr/fetch-rdf");
    const dataset = await parseRdf(body, resolvedContentType, { baseIRI: url });
    return parseReport(dataset);
}
//# sourceMappingURL=earl.js.map