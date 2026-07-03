// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
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
export const EARL = "http://www.w3.org/ns/earl#";
/** W3C Pointers ontology — `ptr:CSSSelectorPointer`. */
export const PTR = "http://www.w3.org/2009/pointers#";
/** Dublin Core Terms — `dcterms:title` / `hasVersion` / `references`. */
export const DCT = "http://purl.org/dc/terms/";
/** Schema.org (canonical http scheme) — `schema:url` / `schema:value`. */
export const SCHEMA = "http://schema.org/";
/** W3C PROV-O — `prov:generatedAtTime`. */
export const PROV = "http://www.w3.org/ns/prov#";
/** W3C ACL ontology — `http://www.w3.org/ns/auth/acl#` (the owner-private ACL helper). */
export const ACL = "http://www.w3.org/ns/auth/acl#";
/** RDF — `rdf:type`, `rdf:value`. */
export const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
/** RDF Schema — `rdfs:label` (reserved for extension). */
export const RDFS = "http://www.w3.org/2000/01/rdf-schema#";
/** XSD datatypes (referenced via the wrapper value mappers). */
export const XSD = "http://www.w3.org/2001/XMLSchema#";
/** Build an `earl:` term IRI. */
export const earl = (local) => `${EARL}${local}`;
/** Build a `ptr:` term IRI. */
export const ptr = (local) => `${PTR}${local}`;
/** Build a `dcterms:` term IRI. */
export const dct = (local) => `${DCT}${local}`;
/** Build a `schema:` term IRI. */
export const schema = (local) => `${SCHEMA}${local}`;
/** Build a `prov:` term IRI. */
export const prov = (local) => `${PROV}${local}`;
/** Build an `acl:` term IRI. */
export const acl = (local) => `${ACL}${local}`;
/** Build an `rdf:` term IRI. */
export const rdf = (local) => `${RDF}${local}`;
/** Build an `rdfs:` term IRI. */
export const rdfs = (local) => `${RDFS}${local}`;
/** Build an `xsd:` term IRI. */
export const xsd = (local) => `${XSD}${local}`;
// --- EARL classes (VERIFIED against the EARL 1.0 Schema) ---------------------
/** `rdf:type earl:Assertion` — a statement that a subject was tested against a criterion. */
export const EARL_ASSERTION = earl("Assertion");
/** `earl:Assertor` — an entity that asserts a result (a person, tool, or organisation). */
export const EARL_ASSERTOR = earl("Assertor");
/** `earl:TestSubject` — the entity under test (here, a web page). */
export const EARL_TEST_SUBJECT = earl("TestSubject");
/** `earl:TestCriterion` — the superclass of a requirement / case a subject is tested against. */
export const EARL_TEST_CRITERION = earl("TestCriterion");
/** `earl:TestRequirement` — a normative requirement (here, a WCAG success criterion). */
export const EARL_TEST_REQUIREMENT = earl("TestRequirement");
/** `earl:TestCase` — an atomic test (here, the axe rule documentation). */
export const EARL_TEST_CASE = earl("TestCase");
/** `earl:TestResult` — the outcome of applying a criterion to a subject. */
export const EARL_TEST_RESULT = earl("TestResult");
/** `earl:TestMode` — the mode in which a test was performed (automatic/manual/…). */
export const EARL_TEST_MODE = earl("TestMode");
/** `earl:OutcomeValue` — the class of a result's outcome (passed/failed/…). */
export const EARL_OUTCOME_VALUE = earl("OutcomeValue");
/** `earl:Software` — an `earl:Assertor` that is a software tool (the scanner). */
export const EARL_SOFTWARE = earl("Software");
/** `earl:Pass` — the class of a positive outcome. */
export const EARL_PASS = earl("Pass");
/** `earl:Fail` — the class of a negative outcome. */
export const EARL_FAIL = earl("Fail");
/** `earl:CannotTell` — the class of an undetermined outcome. */
export const EARL_CANNOT_TELL = earl("CannotTell");
/** `earl:NotApplicable` — the class of an inapplicable outcome. */
export const EARL_NOT_APPLICABLE = earl("NotApplicable");
/** `earl:NotTested` — the class of an untested outcome. */
export const EARL_NOT_TESTED = earl("NotTested");
// --- EARL properties ---------------------------------------------------------
/** `earl:assertedBy` — the assertor that made the assertion. */
export const EARL_ASSERTED_BY = earl("assertedBy");
/** `earl:subject` — the test subject the assertion is about. */
export const EARL_SUBJECT = earl("subject");
/** `earl:test` — the criterion (requirement / case) the subject was tested against. */
export const EARL_TEST = earl("test");
/** `earl:result` — the result of the assertion. */
export const EARL_RESULT = earl("result");
/** `earl:mode` — the mode in which the test was performed. */
export const EARL_MODE = earl("mode");
/** `earl:outcome` — the outcome individual on a result (`earl:passed`/`failed`/…). */
export const EARL_OUTCOME = earl("outcome");
/** `earl:info` — free-text info about a result (here, axe's failure summary). */
export const EARL_INFO = earl("info");
/** `earl:pointer` — a pointer into the subject locating the result (a `ptr:CSSSelectorPointer`). */
export const EARL_POINTER = earl("pointer");
/** `earl:mainAssertor` — on a compound assertor, its principal assertor (exported for completeness). */
export const EARL_MAIN_ASSERTOR = earl("mainAssertor");
// --- EARL outcome individuals (the `earl:outcome` object) --------------------
/** `earl:passed` — the subject passed the test. */
export const EARL_PASSED = earl("passed");
/** `earl:failed` — the subject failed the test. */
export const EARL_FAILED = earl("failed");
/** `earl:cantTell` — the outcome could not be determined. */
export const EARL_CANT_TELL = earl("cantTell");
/** `earl:inapplicable` — the test does not apply to the subject. */
export const EARL_INAPPLICABLE = earl("inapplicable");
/** `earl:untested` — the test was not run. */
export const EARL_UNTESTED = earl("untested");
// --- EARL mode individuals (the `earl:mode` object) --------------------------
/** `earl:automatic` — the test was performed automatically by a tool. */
export const EARL_AUTOMATIC = earl("automatic");
/** `earl:manual` — the test was performed manually by a human. */
export const EARL_MANUAL = earl("manual");
/** `earl:semiAuto` — the test was performed semi-automatically. */
export const EARL_SEMI_AUTO = earl("semiAuto");
/** `earl:undisclosed` — the mode was not disclosed. */
export const EARL_UNDISCLOSED = earl("undisclosed");
/** `earl:unknownMode` — the mode is unknown. */
export const EARL_UNKNOWN_MODE = earl("unknownMode");
// --- Pointers ----------------------------------------------------------------
/** `rdf:type ptr:CSSSelectorPointer` — the CSS-selector pointer type (ACT Rules Format). */
export const PTR_CSS_SELECTOR_POINTER = ptr("CSSSelectorPointer");
// --- Convenience predicate IRIs ----------------------------------------------
/** The `rdf:type` predicate IRI. */
export const RDF_TYPE = rdf("type");
/** The `rdf:value` predicate IRI (carries the pointer's CSS-selector string). */
export const RDF_VALUE = rdf("value");
/** `dcterms:title` — the assertor tool name. */
export const DCT_TITLE = dct("title");
/** `dcterms:hasVersion` — the assertor tool version (a string literal). */
export const DCT_HAS_VERSION = dct("hasVersion");
/** `dcterms:references` — links an assertion to the axe rule documentation (an `earl:TestCase`). */
export const DCT_REFERENCES = dct("references");
/** `dcterms:description` — the rule description on a test-case node. */
export const DCT_DESCRIPTION = dct("description");
/** `schema:url` — the assertor tool homepage. */
export const SCHEMA_URL = schema("url");
/** `schema:value` — a roll-up passed/inapplicable count on a result. */
export const SCHEMA_VALUE = schema("value");
/** `prov:generatedAtTime` — an optional provenance stamp on the assertor. */
export const PROV_GENERATED_AT_TIME = prov("generatedAtTime");
/** Prefix map for an n3 Writer that serialises this model (pretty Turtle output). */
export const PREFIXES = {
    earl: EARL,
    ptr: PTR,
    dcterms: DCT,
    schema: SCHEMA,
    prov: PROV,
    rdf: RDF,
    rdfs: RDFS,
    xsd: XSD,
};
//# sourceMappingURL=vocab.js.map