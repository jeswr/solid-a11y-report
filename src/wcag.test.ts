// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
import { describe, expect, it } from "vitest";
import { slugify, type WcagVersion, wcagCriterionUri, wcagVersionFromAxeTag } from "./wcag.js";

describe("slugify", () => {
  it("lowercases and kebab-cases an SC name", () => {
    expect(slugify("Non-text Content")).toBe("non-text-content");
    expect(slugify("Info and Relationships")).toBe("info-and-relationships");
    expect(slugify("Contrast (Minimum)")).toBe("contrast-minimum");
    expect(slugify("Name, Role, Value")).toBe("name-role-value");
  });

  it("collapses runs of punctuation/space to a single dash and trims", () => {
    expect(slugify("  Focus   Order  ")).toBe("focus-order");
    expect(slugify("A/B — C")).toBe("a-b-c");
  });

  it("is total on empty / punctuation-only input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
    expect(slugify("!!!")).toBe("");
  });
});

describe("wcagCriterionUri", () => {
  it("builds the version-specific TR anchor URI from the name", () => {
    expect(wcagCriterionUri({ version: "2.2", name: "Non-text Content" })).toBe(
      "https://www.w3.org/TR/WCAG22/#non-text-content",
    );
    expect(wcagCriterionUri({ version: "2.1", name: "Contrast (Minimum)" })).toBe(
      "https://www.w3.org/TR/WCAG21/#contrast-minimum",
    );
    // WCAG 2.0 requires the legacy anchor (see the 2.0-specific test below).
    expect(
      wcagCriterionUri({ version: "2.0", name: "Non-text Content", anchor: "text-equiv-all" }),
    ).toBe("https://www.w3.org/TR/WCAG20/#text-equiv-all");
  });

  it("the version drives the document — same name, different version, different URI", () => {
    const name = "Non-text Content";
    expect(wcagCriterionUri({ version: "2.1", name })).toBe(
      "https://www.w3.org/TR/WCAG21/#non-text-content",
    );
    expect(wcagCriterionUri({ version: "2.2", name })).toBe(
      "https://www.w3.org/TR/WCAG22/#non-text-content",
    );
  });

  it("WCAG 2.0 requires an explicit anchor (legacy mnemonics are not slug-derivable)", () => {
    // A name-only 2.0 ref is fail-closed (slugify would emit a broken IRI).
    expect(() => wcagCriterionUri({ version: "2.0", name: "Non-text Content" })).toThrow(
      /WCAG 2\.0 uses legacy TR anchors/,
    );
    // With the legacy anchor it builds the correct 2.0 IRI.
    expect(
      wcagCriterionUri({ version: "2.0", name: "Non-text Content", anchor: "text-equiv-all" }),
    ).toBe("https://www.w3.org/TR/WCAG20/#text-equiv-all");
  });

  it("an explicit anchor overrides slugify(name) (future-anchor as a data change)", () => {
    expect(
      wcagCriterionUri({
        version: "2.2",
        name: "Whatever the tool called it",
        anchor: "target-size-minimum",
      }),
    ).toBe("https://www.w3.org/TR/WCAG22/#target-size-minimum");
    // A blank/whitespace anchor falls back to slugify(name).
    expect(wcagCriterionUri({ version: "2.2", name: "Focus Order", anchor: "   " })).toBe(
      "https://www.w3.org/TR/WCAG22/#focus-order",
    );
  });

  it("throws on an unsupported version", () => {
    expect(() => wcagCriterionUri({ version: "9.9" as unknown as WcagVersion, name: "X" })).toThrow(
      /unsupported WCAG version/,
    );
  });

  it("throws (fail-closed) when neither anchor nor slugify(name) yields a fragment", () => {
    expect(() => wcagCriterionUri({ version: "2.2", name: "!!!" })).toThrow(/empty anchor/);
  });
});

describe("wcagVersionFromAxeTag", () => {
  it("maps axe wcag tags to a version", () => {
    expect(wcagVersionFromAxeTag("wcag2a")).toBe("2.0");
    expect(wcagVersionFromAxeTag("wcag2aa")).toBe("2.0");
    expect(wcagVersionFromAxeTag("wcag21a")).toBe("2.1");
    expect(wcagVersionFromAxeTag("wcag21aa")).toBe("2.1");
    expect(wcagVersionFromAxeTag("wcag22aa")).toBe("2.2");
    expect(wcagVersionFromAxeTag("WCAG22AA")).toBe("2.2"); // case-insensitive
  });

  it("returns undefined for a non-version tag", () => {
    expect(wcagVersionFromAxeTag("cat.forms")).toBeUndefined();
    expect(wcagVersionFromAxeTag("best-practice")).toBeUndefined();
    expect(wcagVersionFromAxeTag("section508")).toBeUndefined();
    expect(wcagVersionFromAxeTag("")).toBeUndefined();
  });
});
