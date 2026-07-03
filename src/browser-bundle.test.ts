// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
//
// BROWSER-BUNDLE SMOKE TEST — proves the root barrel (`.`) is browser-safe: no
// `node:fs` / `node:url` (or any other Node builtin) is reachable in its static
// import graph, so a browser bundler (Vite/Turbopack/webpack/esbuild itself) can
// bundle a client component that imports from `@jeswr/solid-a11y-report`.
//
// REGRESSION THIS GUARDS: re-exporting the `node:fs`/`node:url`-using shape
// helpers (`a11yReportShapeTtl`, from `./shape.ts`) from the root barrel would
// break EVERY consumer of the root entry in a browser build — because a bundler
// must resolve a module's ENTIRE static import graph, not just the symbols a
// consumer uses. The shape helpers therefore live ONLY behind `./shape`.
//
// MECHANISM: run esbuild with `platform: "browser"` (so a Node builtin is NOT
// auto-resolved) over `src/index.ts`, externalising only the legitimate npm
// runtime deps (so THEIR internals don't produce unrelated resolve failures). A
// clean build proves no `node:*` specifier is reachable; `metafile.inputs` is
// asserted empty of any `node:`-prefixed entry as a second, independent check.
// The negative control bundles `./shape.ts` the same way and MUST fail.

import { build } from "esbuild";
import { describe, expect, it } from "vitest";

/** Legitimate npm runtime deps — externalised so only OUR graph is checked. */
const EXTERNAL_RUNTIME_DEPS = ["n3", "@rdfjs/wrapper", "@jeswr/fetch-rdf"];

async function bundleForBrowser(entryPoint: string) {
  return build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: "browser",
    format: "esm",
    write: false,
    external: EXTERNAL_RUNTIME_DEPS,
    metafile: true,
    logLevel: "silent",
  });
}

describe("root barrel (`.`) is browser-safe (esbuild --platform=browser smoke test)", () => {
  it("bundles src/index.ts for a browser target with no resolve errors", async () => {
    const result = await bundleForBrowser("src/index.ts");
    expect(result.outputFiles).toHaveLength(1);
    const inputPaths = Object.keys(result.metafile.inputs);
    const nodeBuiltins = inputPaths.filter((p) => p.startsWith("node:"));
    const shapeModule = inputPaths.filter((p) => p.endsWith("shape.ts"));
    expect(nodeBuiltins).toEqual([]);
    expect(shapeModule).toEqual([]);
  });

  it("the bundled output contains no `node:` import specifier", async () => {
    const result = await bundleForBrowser("src/index.ts");
    const text = result.outputFiles[0]?.text ?? "";
    expect(text).not.toMatch(/\bnode:fs\b/);
    expect(text).not.toMatch(/\bnode:url\b/);
  });

  it("NEGATIVE CONTROL: bundling ./shape.ts the same way FAILS on node:fs/node:url (proves the mechanism detects the regression)", async () => {
    await expect(bundleForBrowser("src/shape.ts")).rejects.toThrow(/node:fs|node:url/);
  });
});
