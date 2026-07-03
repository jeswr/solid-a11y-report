# @jeswr/solid-a11y-report

The typed **EARL** (Evaluation And Report Language) RDF data-model for
accessibility test results. Turn a framework-neutral, **axe-shaped** scan into
W3C [EARL 1.0](https://www.w3.org/TR/EARL10-Schema/) +
[ACT Rules Format 1.1](https://www.w3.org/TR/act-rules-format/) assertions,
serialise them to Turtle, and parse them back — all through typed RDF accessors,
never hand-built triples.

- **One `earl:Assertion` per (rule × page × failing node × WCAG success
  criterion).** No selector-level failure and no criterion is silently collapsed.
- **WCAG success criteria** are `earl:TestRequirement`s at their version-specific
  W3C TR anchor (e.g. `https://www.w3.org/TR/WCAG22/#non-text-content`); the axe
  rule documentation is an `earl:TestCase`.
- **CSS-selector pointers** as `ptr:CSSSelectorPointer` (the ACT-context shape).
- **Reuses standard vocabulary only** — `earl:`, `ptr:`, `dcterms:`, `schema:`,
  `prov:` — and **mints nothing**. Ships the SHACL shape that pins the contract
  and an owner-private WAC ACL helper.

Part of the `@jeswr` Solid app suite. Built on
[`@jeswr/fetch-rdf`](https://www.npmjs.com/package/@jeswr/fetch-rdf) (parse),
[`@rdfjs/wrapper`](https://www.npmjs.com/package/@rdfjs/wrapper) (typed
read/write) and [`n3`](https://www.npmjs.com/package/n3) (serialise).

## Install

GitHub-installable now — the built `dist/` is committed, so under
`ignore-scripts=true` no build step is needed:

```bash
npm install github:jeswr/solid-a11y-report#main
```

(An npm publish is a deferred migration.)

## Usage

### Build + serialise a report

```ts
import { serializeReport, type A11yScanInput } from "@jeswr/solid-a11y-report";

const scan: A11yScanInput = {
  toolName: "AccessRadar",
  toolVersion: "4.9.1",              // → earl:Software dcterms:hasVersion
  toolHomepage: "https://accessradar.example/",
  pages: [
    {
      url: "https://site.example/", // → earl:TestSubject
      passes: 42,                   // optional per-page earl:passed roll-up
      inapplicable: 3,
      issues: [
        {
          ruleId: "image-alt",
          description: "Images must have alternate text",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.9/image-alt",
          impact: "critical",
          // The rule maps to one (or more) WCAG success criteria:
          wcag: [{ version: "2.2", name: "Non-text Content", id: "1.1.1", level: "A" }],
          nodes: [
            { selector: "html > body > img:nth-child(1)", failureSummary: "no alt" },
            { selector: "main img", failureSummary: "empty alt" },
          ],
        },
      ],
    },
  ],
};

// Report IRIs are minted under the base: #assertor, #assertion-<n>, …
const turtle = await serializeReport("https://site.example/reports/scan-1.ttl", scan);
```

`buildReport(base, scan)` returns the assertion graph as an n3 `Store`;
`storeToTurtle(store)` serialises any store with the model's prefixes.

### Parse a report back

```ts
import { parseReportTtl } from "@jeswr/solid-a11y-report";

const { assertions } = await parseReportTtl(url, body, contentType);
// each: { subject, test, outcome, mode?, assertedBy?, selector?, info?, testCase?, value? }
```

`parseReport(dataset)` reads an already-parsed RDF/JS dataset. Every read is
fail-closed: a malformed foreign literal drops that field rather than aborting.

### WCAG success-criterion IRIs

```ts
import { wcagCriterionUri, wcagVersionFromAxeTag, slugify } from "@jeswr/solid-a11y-report";

wcagCriterionUri({ version: "2.2", name: "Non-text Content" });
// "https://www.w3.org/TR/WCAG22/#non-text-content"
wcagVersionFromAxeTag("wcag21aa"); // "2.1"
```

The WCAG version is always a parameter (2.0 → `WCAG20`, 2.1 → `WCAG21`,
2.2 → `WCAG22`); pass an explicit `anchor` to override the derived slug so a
future/renamed anchor is a data change.

### Owner-private ACL

An a11y report is scan output about a (possibly un-remediated) site, so the safe
default is pod-private:

```ts
import { writeOwnerAcl } from "@jeswr/solid-a11y-report";

await writeOwnerAcl(reportUrl, ownerWebId, authedFetch); // owner-only Read/Write/Control
```

`buildOwnerAcl` returns the Turtle; it is fail-closed (throws on a non-http(s)
owner WebID and never emits a public grant). A consumer may deliberately widen a
published report with its own ACL.

### SHACL shape (Node-only)

```ts
import { a11yReportShapeTtl } from "@jeswr/solid-a11y-report/shape";
```

The `./shape` subpath imports `node:fs`; the root entry is browser-safe. The
shape pins: every `earl:Assertion` has exactly one `earl:subject` / `earl:test`
/ `earl:result` / `earl:assertedBy` / `earl:mode` (from the five EARL modes), and
every `earl:TestResult` has exactly one `earl:outcome` (from the five EARL
outcome individuals).

## RDF discipline

Graphs are built with typed `@rdfjs/wrapper` accessors on an n3 `Store`,
serialised with `n3.Writer`, and parsed via `@jeswr/fetch-rdf`'s `parseRdf` —
never hand-concatenated, never a bespoke parser. Untrusted object-property IRIs
(page URL, tool homepage, axe `helpUrl`) pass through an http(s)-only filter; a
non-http(s) value is dropped rather than coerced into a malformed node.

## Development

```bash
npm run gate       # lint + typecheck + test + build + check:dist + check:lockfile-transport
npm run api:check  # verify the public API against etc/solid-a11y-report.api.md
```

`dist/` is committed and must match a fresh build (`check:dist` enforces this) —
rebuild + `git add dist/` alongside any `src/` change.

## License

MIT © Jesse Wright
