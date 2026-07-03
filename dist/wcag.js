// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
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
/** The TR URL path segment for each WCAG version (2.0 → `WCAG20`, etc.). */
const VERSION_SEGMENT = {
    "2.0": "20",
    "2.1": "21",
    "2.2": "22",
};
/**
 * Kebab-case slug for a WCAG SC name — lowercase, every run of non-`[a-z0-9]`
 * collapsed to a single `-`, leading/trailing `-` trimmed. E.g. "Info and
 * Relationships" → `info-and-relationships`; "Non-text Content" →
 * `non-text-content`. Pure and total (empty/punctuation-only input → `""`).
 */
export function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
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
export function wcagCriterionUri(ref) {
    const segment = VERSION_SEGMENT[ref.version];
    if (!segment) {
        throw new Error(`wcagCriterionUri: unsupported WCAG version ${JSON.stringify(ref.version)} ` +
            "(expected one of 2.0, 2.1, 2.2).");
    }
    const explicit = ref.anchor?.trim();
    const anchor = explicit && explicit.length > 0 ? explicit : slugify(ref.name);
    if (!anchor) {
        throw new Error(`wcagCriterionUri: empty anchor — neither an explicit anchor nor slugify(name=${JSON.stringify(ref.name)}) produced a fragment.`);
    }
    return `https://www.w3.org/TR/WCAG${segment}/#${anchor}`;
}
/**
 * The WCAG version implied by an axe rule tag: `wcag2a`/`wcag2aa`/`wcag2aaa` →
 * `"2.0"`, `wcag21*` → `"2.1"`, `wcag22*` → `"2.2"`. Returns `undefined` for a
 * non-version tag (e.g. `cat.forms`, `best-practice`, `section508`), so a caller
 * can skip it. The comparison is case-insensitive.
 */
export function wcagVersionFromAxeTag(tag) {
    switch (tag.trim().toLowerCase()) {
        case "wcag2a":
        case "wcag2aa":
        case "wcag2aaa":
            return "2.0";
        case "wcag21a":
        case "wcag21aa":
        case "wcag21aaa":
            return "2.1";
        case "wcag22a":
        case "wcag22aa":
        case "wcag22aaa":
            return "2.2";
        default:
            return undefined;
    }
}
//# sourceMappingURL=wcag.js.map