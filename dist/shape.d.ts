/** Filesystem path to the canonical SHACL shape file. */
export declare const A11Y_REPORT_SHAPE_PATH: string;
/**
 * The canonical EARL a11y-report SHACL shape, as a Turtle string. Cached after
 * the first read. Pass it (with the data graph) to a SHACL validator — see
 * `src/shape.test.ts` for the `rdf-validate-shacl` pattern.
 */
export declare function a11yReportShapeTtl(): string;
//# sourceMappingURL=shape.d.ts.map