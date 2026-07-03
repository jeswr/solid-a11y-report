// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
/**
 * Access to the canonical SHACL shape (`shapes/a11y-report.ttl`).
 *
 * The shape lives in a single `.ttl` file at the package root (the human- and
 * tool-readable artifact `rdf-validate-shacl` consumes directly). This module
 * reads it as a string so consumers can feed it into whatever SHACL engine they
 * already depend on. Reading the file rather than embedding a copy means the
 * string can never drift from the canonical `.ttl`.
 *
 * The relative path `../shapes/a11y-report.ttl` resolves identically from the
 * source tree (`src/shape.ts` → `shapes/a11y-report.ttl`) and the built output
 * (`dist/shape.js` → `shapes/a11y-report.ttl`), because both `src/` and `dist/`
 * sit one level below the package root next to `shapes/`. The `shapes/` directory
 * is shipped in the package `files` allow-list, so it is present after install.
 *
 * **Node-only — the `./shape` subpath is the SOLE home for this module.** It
 * imports `node:fs`/`node:url`, so nothing here is re-exported from the root
 * (`.`) entry — a browser bundler cannot resolve those specifiers. Import
 * `a11yReportShapeTtl` / `A11Y_REPORT_SHAPE_PATH` from
 * `@jeswr/solid-a11y-report/shape` in server-only or test code; a browser/client
 * component wants the root `.` or `./earl` / `./wcag` entries instead.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Filesystem path to the canonical SHACL shape file. */
export const A11Y_REPORT_SHAPE_PATH: string = fileURLToPath(
  new URL("../shapes/a11y-report.ttl", import.meta.url),
);

let cached: string | undefined;

/**
 * The canonical EARL a11y-report SHACL shape, as a Turtle string. Cached after
 * the first read. Pass it (with the data graph) to a SHACL validator — see
 * `src/shape.test.ts` for the `rdf-validate-shacl` pattern.
 */
export function a11yReportShapeTtl(): string {
  if (cached === undefined) cached = readFileSync(A11Y_REPORT_SHAPE_PATH, "utf8");
  return cached;
}
