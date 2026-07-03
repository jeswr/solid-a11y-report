/**
 * Vocabulary IRIs for the EARL accessibility-report model.
 *
 * **Reused, dereferenceable, standard terms only — this package MINTS NOTHING.**
 * Every IRI below comes from an existing W3C (or Dublin Core / schema.org)
 * vocabulary, so an EARL report this package writes is readable by any EARL/ACT
 * consumer, and a report written by another tool is readable here.
 *
 * - **`earl:` — W3C Evaluation And Report Language 1.0**
 *   (`http://www.w3.org/ns/earl#`). The report model: an `earl:Assertion` links
 *   an `earl:Assertor` (here an `earl:Software` tool), an `earl:TestSubject`
 *   (the page), an `earl:TestCriterion` (a WCAG success criterion, modelled as an
 *   `earl:TestRequirement`, or the axe rule doc as an `earl:TestCase`), an
 *   `earl:TestResult` (with an `earl:OutcomeValue`), and an `earl:TestMode`.
 *   Verified against the EARL 1.0 Schema (https://www.w3.org/TR/EARL10-Schema/).
 * - **`ptr:` — W3C Pointers ontology** (`http://www.w3.org/2009/pointers#`). A
 *   `ptr:CSSSelectorPointer` locates the failing element by CSS selector — the
 *   pointer type the ACT Rules Format JSON-LD/EARL appendix uses
 *   (https://www.w3.org/TR/act-rules-format/).
 * - **`dcterms:` — Dublin Core Terms** (`http://purl.org/dc/terms/`) for the
 *   assertor's `dcterms:title` (tool name) + `dcterms:hasVersion` (tool version),
 *   and `dcterms:references` linking an assertion to the axe rule documentation.
 * - **`schema:` — schema.org** (`http://schema.org/`) for `schema:url` (the tool
 *   homepage) and `schema:value` (a roll-up passed/inapplicable count).
 * - **`prov:` — W3C PROV-O** (`http://www.w3.org/ns/prov#`) for an optional
 *   `prov:generatedAtTime` provenance stamp.
 * - **`rdf:` / `rdfs:` / `xsd:`** for `rdf:type`, `rdf:value` (the pointer's CSS
 *   selector string) and the datatypes referenced by the wrapper value mappers.
 */
/** W3C EARL 1.0 — the Evaluation And Report Language namespace. */
export declare const EARL = "http://www.w3.org/ns/earl#";
/** W3C Pointers ontology — `ptr:CSSSelectorPointer`. */
export declare const PTR = "http://www.w3.org/2009/pointers#";
/** Dublin Core Terms — `dcterms:title` / `hasVersion` / `references`. */
export declare const DCT = "http://purl.org/dc/terms/";
/** Schema.org (canonical http scheme) — `schema:url` / `schema:value`. */
export declare const SCHEMA = "http://schema.org/";
/** W3C PROV-O — `prov:generatedAtTime`. */
export declare const PROV = "http://www.w3.org/ns/prov#";
/** W3C ACL ontology — `http://www.w3.org/ns/auth/acl#` (the owner-private ACL helper). */
export declare const ACL = "http://www.w3.org/ns/auth/acl#";
/** RDF — `rdf:type`, `rdf:value`. */
export declare const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
/** RDF Schema — `rdfs:label` (reserved for extension). */
export declare const RDFS = "http://www.w3.org/2000/01/rdf-schema#";
/** XSD datatypes (referenced via the wrapper value mappers). */
export declare const XSD = "http://www.w3.org/2001/XMLSchema#";
/** Build an `earl:` term IRI. */
export declare const earl: (local: string) => string;
/** Build a `ptr:` term IRI. */
export declare const ptr: (local: string) => string;
/** Build a `dcterms:` term IRI. */
export declare const dct: (local: string) => string;
/** Build a `schema:` term IRI. */
export declare const schema: (local: string) => string;
/** Build a `prov:` term IRI. */
export declare const prov: (local: string) => string;
/** Build an `acl:` term IRI. */
export declare const acl: (local: string) => string;
/** Build an `rdf:` term IRI. */
export declare const rdf: (local: string) => string;
/** Build an `rdfs:` term IRI. */
export declare const rdfs: (local: string) => string;
/** Build an `xsd:` term IRI. */
export declare const xsd: (local: string) => string;
/** `rdf:type earl:Assertion` — a statement that a subject was tested against a criterion. */
export declare const EARL_ASSERTION: string;
/** `earl:Assertor` — an entity that asserts a result (a person, tool, or organisation). */
export declare const EARL_ASSERTOR: string;
/** `earl:TestSubject` — the entity under test (here, a web page). */
export declare const EARL_TEST_SUBJECT: string;
/** `earl:TestCriterion` — the superclass of a requirement / case a subject is tested against. */
export declare const EARL_TEST_CRITERION: string;
/** `earl:TestRequirement` — a normative requirement (here, a WCAG success criterion). */
export declare const EARL_TEST_REQUIREMENT: string;
/** `earl:TestCase` — an atomic test (here, the axe rule documentation). */
export declare const EARL_TEST_CASE: string;
/** `earl:TestResult` — the outcome of applying a criterion to a subject. */
export declare const EARL_TEST_RESULT: string;
/** `earl:TestMode` — the mode in which a test was performed (automatic/manual/…). */
export declare const EARL_TEST_MODE: string;
/** `earl:OutcomeValue` — the class of a result's outcome (passed/failed/…). */
export declare const EARL_OUTCOME_VALUE: string;
/** `earl:Software` — an `earl:Assertor` that is a software tool (the scanner). */
export declare const EARL_SOFTWARE: string;
/** `earl:Pass` — the class of a positive outcome. */
export declare const EARL_PASS: string;
/** `earl:Fail` — the class of a negative outcome. */
export declare const EARL_FAIL: string;
/** `earl:CannotTell` — the class of an undetermined outcome. */
export declare const EARL_CANNOT_TELL: string;
/** `earl:NotApplicable` — the class of an inapplicable outcome. */
export declare const EARL_NOT_APPLICABLE: string;
/** `earl:NotTested` — the class of an untested outcome. */
export declare const EARL_NOT_TESTED: string;
/** `earl:assertedBy` — the assertor that made the assertion. */
export declare const EARL_ASSERTED_BY: string;
/** `earl:subject` — the test subject the assertion is about. */
export declare const EARL_SUBJECT: string;
/** `earl:test` — the criterion (requirement / case) the subject was tested against. */
export declare const EARL_TEST: string;
/** `earl:result` — the result of the assertion. */
export declare const EARL_RESULT: string;
/** `earl:mode` — the mode in which the test was performed. */
export declare const EARL_MODE: string;
/** `earl:outcome` — the outcome individual on a result (`earl:passed`/`failed`/…). */
export declare const EARL_OUTCOME: string;
/** `earl:info` — free-text info about a result (here, axe's failure summary). */
export declare const EARL_INFO: string;
/** `earl:pointer` — a pointer into the subject locating the result (a `ptr:CSSSelectorPointer`). */
export declare const EARL_POINTER: string;
/** `earl:mainAssertor` — on a compound assertor, its principal assertor (exported for completeness). */
export declare const EARL_MAIN_ASSERTOR: string;
/** `earl:passed` — the subject passed the test. */
export declare const EARL_PASSED: string;
/** `earl:failed` — the subject failed the test. */
export declare const EARL_FAILED: string;
/** `earl:cantTell` — the outcome could not be determined. */
export declare const EARL_CANT_TELL: string;
/** `earl:inapplicable` — the test does not apply to the subject. */
export declare const EARL_INAPPLICABLE: string;
/** `earl:untested` — the test was not run. */
export declare const EARL_UNTESTED: string;
/** `earl:automatic` — the test was performed automatically by a tool. */
export declare const EARL_AUTOMATIC: string;
/** `earl:manual` — the test was performed manually by a human. */
export declare const EARL_MANUAL: string;
/** `earl:semiAuto` — the test was performed semi-automatically. */
export declare const EARL_SEMI_AUTO: string;
/** `earl:undisclosed` — the mode was not disclosed. */
export declare const EARL_UNDISCLOSED: string;
/** `earl:unknownMode` — the mode is unknown. */
export declare const EARL_UNKNOWN_MODE: string;
/** `rdf:type ptr:CSSSelectorPointer` — the CSS-selector pointer type (ACT Rules Format). */
export declare const PTR_CSS_SELECTOR_POINTER: string;
/** The `rdf:type` predicate IRI. */
export declare const RDF_TYPE: string;
/** The `rdf:value` predicate IRI (carries the pointer's CSS-selector string). */
export declare const RDF_VALUE: string;
/** `dcterms:title` — the assertor tool name. */
export declare const DCT_TITLE: string;
/** `dcterms:hasVersion` — the assertor tool version (a string literal). */
export declare const DCT_HAS_VERSION: string;
/** `dcterms:references` — links an assertion to the axe rule documentation (an `earl:TestCase`). */
export declare const DCT_REFERENCES: string;
/** `dcterms:description` — the rule description on a test-case node. */
export declare const DCT_DESCRIPTION: string;
/** `schema:url` — the assertor tool homepage. */
export declare const SCHEMA_URL: string;
/** `schema:value` — a roll-up passed/inapplicable count on a result. */
export declare const SCHEMA_VALUE: string;
/** `prov:generatedAtTime` — an optional provenance stamp on the assertor. */
export declare const PROV_GENERATED_AT_TIME: string;
/** Prefix map for an n3 Writer that serialises this model (pretty Turtle output). */
export declare const PREFIXES: {
    readonly earl: "http://www.w3.org/ns/earl#";
    readonly ptr: "http://www.w3.org/2009/pointers#";
    readonly dcterms: "http://purl.org/dc/terms/";
    readonly schema: "http://schema.org/";
    readonly prov: "http://www.w3.org/ns/prov#";
    readonly rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
    readonly rdfs: "http://www.w3.org/2000/01/rdf-schema#";
    readonly xsd: "http://www.w3.org/2001/XMLSchema#";
};
//# sourceMappingURL=vocab.d.ts.map