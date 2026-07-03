/**
 * WCAG success-criterion IRIs — the pure, dependency-free mapping from a WCAG
 * success criterion (version + name/anchor) to its canonical W3C TR anchor URI.
 *
 * A WCAG SC is referenced in an EARL report as an `earl:TestRequirement` whose
 * IRI is the version-specific TR anchor, e.g. "Non-text Content" (WCAG 2.2) →
 * `https://www.w3.org/TR/WCAG22/#non-text-content`. The version is a PARAMETER,
 * never hard-coded — a WCAG 2.0 rule and a WCAG 2.2 rule for the "same" SC name
 * resolve to DIFFERENT documents, and a future WCAG version is a data change
 * (pass the new version's `anchor` explicitly).
 *
 * **Pure core, no platform.** Depends on nothing (no RDF, no `node:*`, no DOM),
 * so it is client-safe and reads as a small spec.
 */
/** A supported WCAG version. */
export type WcagVersion = "2.0" | "2.1" | "2.2";
/** Fields common to every WCAG success-criterion reference. */
interface WcagRefFields {
    /** Human-readable SC name, e.g. "Non-text Content" (used to derive the anchor). */
    name: string;
    /** Dotted SC number, e.g. "1.1.1" (informational; not used to build the IRI). */
    id?: string;
    /** Conformance level, e.g. "A" / "AA" / "AAA" (informational). */
    level?: "A" | "AA" | "AAA";
}
/**
 * A reference to a WCAG success criterion, as carried on an axe rule.
 *
 * A **discriminated union on `version`**, so the 2.0-anchor contract is enforced
 * at COMPILE time as well as at runtime: for **2.1/2.2** the `anchor` is optional
 * (it defaults to {@link slugify}`(name)`, which those RECs use); for **2.0** the
 * `anchor` is REQUIRED — its TR anchors are legacy mnemonics not derivable from
 * the SC name (e.g. "Non-text Content" is `text-equiv-all`; see
 * {@link wcagCriterionUri}). An explicit `anchor` also future-proofs a later
 * WCAG version whose anchoring differs.
 */
export type WcagRef = (WcagRefFields & {
    version: "2.1" | "2.2";
    /** Explicit TR anchor (fragment without the leading `#`); defaults to `slugify(name)`. */
    anchor?: string;
}) | (WcagRefFields & {
    version: "2.0";
    /** Explicit legacy TR anchor (fragment without the leading `#`) — REQUIRED for 2.0. */
    anchor: string;
});
/**
 * Kebab-case slug for a WCAG SC name — lowercase, every run of non-`[a-z0-9]`
 * collapsed to a single `-`, leading/trailing `-` trimmed. E.g. "Info and
 * Relationships" → `info-and-relationships`; "Non-text Content" →
 * `non-text-content`. Pure and total (empty/punctuation-only input → `""`).
 */
export declare function slugify(name: string): string;
/**
 * The canonical W3C TR anchor IRI for a WCAG success criterion:
 * `https://www.w3.org/TR/WCAG{20|21|22}/#{anchor}`.
 *
 * For **WCAG 2.1 and 2.2** the anchor defaults to {@link slugify}`(name)` —
 * those RECs anchor each success criterion at the kebab-cased SC name (e.g.
 * "Non-text Content" → `#non-text-content`, "Contrast (Minimum)" →
 * `#contrast-minimum`), which slugify reproduces exactly.
 *
 * For **WCAG 2.0** an explicit `anchor` is REQUIRED (fail-closed): the WCAG 2.0
 * REC anchors criteria at LEGACY mnemonic ids (e.g. "Non-text Content" is
 * `#text-equiv-all`, NOT `#non-text-content`) that cannot be derived from the SC
 * name, so slugifying it would emit a broken IRI. Pass the legacy `anchor`, or —
 * preferably — reference the criterion under WCAG 2.1/2.2 (a superset), whose
 * anchors ARE derivable. Passing an explicit `anchor` also future-proofs a later
 * WCAG version whose anchoring differs.
 *
 * @throws if `version` is not a supported WCAG version; if `version` is "2.0" and
 *   no explicit `anchor` is given; or if neither an explicit `anchor` nor a
 *   `slugify(name)` yields a non-empty fragment (fail-closed — a criterion IRI
 *   with an empty fragment is meaningless and would collide across criteria).
 */
export declare function wcagCriterionUri(ref: WcagRef): string;
/**
 * The WCAG version implied by an axe rule tag: `wcag2a`/`wcag2aa`/`wcag2aaa` →
 * `"2.0"`, `wcag21*` → `"2.1"`, `wcag22*` → `"2.2"`. Returns `undefined` for a
 * non-version tag (e.g. `cat.forms`, `best-practice`, `section508`), so a caller
 * can skip it. The comparison is case-insensitive.
 */
export declare function wcagVersionFromAxeTag(tag: string): WcagVersion | undefined;
export {};
//# sourceMappingURL=wcag.d.ts.map