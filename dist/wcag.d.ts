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
/** A reference to a WCAG success criterion, as carried on an axe rule. */
export interface WcagRef {
    /** The WCAG version this reference is against — determines the TR document. */
    version: WcagVersion;
    /** Human-readable SC name, e.g. "Non-text Content" (used to derive the anchor). */
    name: string;
    /** Dotted SC number, e.g. "1.1.1" (informational; not used to build the IRI). */
    id?: string;
    /** Conformance level, e.g. "A" / "AA" / "AAA" (informational). */
    level?: "A" | "AA" | "AAA";
    /**
     * Explicit TR anchor override (kebab-case fragment WITHOUT the leading `#`),
     * e.g. `"non-text-content"`. When absent, the anchor is {@link slugify}`(name)`.
     * Overriding lets a future WCAG version (or a renamed anchor) be a data change.
     */
    anchor?: string;
}
/**
 * Kebab-case slug for a WCAG SC name — lowercase, every run of non-`[a-z0-9]`
 * collapsed to a single `-`, leading/trailing `-` trimmed. E.g. "Info and
 * Relationships" → `info-and-relationships`; "Non-text Content" →
 * `non-text-content`. Pure and total (empty/punctuation-only input → `""`).
 */
export declare function slugify(name: string): string;
/**
 * The canonical W3C TR anchor IRI for a WCAG success criterion:
 * `https://www.w3.org/TR/WCAG{20|21|22}/#{anchor}`. The `anchor` defaults to
 * {@link slugify}`(name)`; pass an explicit `anchor` to override it (so a
 * renamed/future anchor is a data change, not a code change).
 *
 * @throws if `version` is not a supported WCAG version, or if neither an
 *   explicit `anchor` nor a `slugify(name)` yields a non-empty fragment
 *   (fail-closed — a criterion IRI with an empty fragment is meaningless and
 *   would collide across criteria).
 */
export declare function wcagCriterionUri(ref: WcagRef): string;
/**
 * The WCAG version implied by an axe rule tag: `wcag2a`/`wcag2aa`/`wcag2aaa` →
 * `"2.0"`, `wcag21*` → `"2.1"`, `wcag22*` → `"2.2"`. Returns `undefined` for a
 * non-version tag (e.g. `cat.forms`, `best-practice`, `section508`), so a caller
 * can skip it. The comparison is case-insensitive.
 */
export declare function wcagVersionFromAxeTag(tag: string): WcagVersion | undefined;
//# sourceMappingURL=wcag.d.ts.map