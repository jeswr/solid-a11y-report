// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
import { Parser, Store } from "n3";
import { describe, expect, it, vi } from "vitest";
import { aclUrlFor, buildOwnerAcl, writeOwnerAcl } from "./acl.js";
import { ACL } from "./vocab.js";

const RESOURCE = "https://alice.example/a11y/report.ttl";
const OWNER = "https://alice.example/profile/card#me";

function parse(ttl: string): Store {
  return new Store(new Parser({ baseIRI: RESOURCE }).parse(ttl));
}

describe("aclUrlFor", () => {
  it("appends .acl to a clean resource URL", () => {
    expect(aclUrlFor(RESOURCE)).toBe(`${RESOURCE}.acl`);
  });
  it("rejects a fragment (would target the data resource itself)", () => {
    expect(() => aclUrlFor("https://alice.example/report.ttl#it")).toThrow(/fragment/);
  });
  it("rejects a query string", () => {
    expect(() => aclUrlFor("https://alice.example/report.ttl?v=1")).toThrow(/query/);
  });
  it("rejects a non-http(s) scheme", () => {
    expect(() => aclUrlFor("file:///etc/passwd")).toThrow(/http/);
  });
});

describe("buildOwnerAcl — owner-only, fail-closed", () => {
  it("grants ONLY the owner Read/Write/Control over the resource and its descendants", async () => {
    const ttl = await buildOwnerAcl(RESOURCE, OWNER);
    const store = parse(ttl);
    const aclUrl = `${RESOURCE}.acl`;
    const auth = `${aclUrl}#owner`;

    // The single authorization names the owner and no one else.
    const agents = [...store.match(null, null, null)]
      .filter((q) => q.predicate.value === `${ACL}agent`)
      .map((q) => q.object.value);
    expect(agents).toEqual([OWNER]);

    // accessTo AND default both point at the resource (descendants covered).
    expect(
      [...store.match(null, null, null)].some(
        (q) => q.predicate.value === `${ACL}accessTo` && q.object.value === RESOURCE,
      ),
    ).toBe(true);
    expect(
      [...store.match(null, null, null)].some(
        (q) => q.predicate.value === `${ACL}default` && q.object.value === RESOURCE,
      ),
    ).toBe(true);

    // All three modes present.
    const modes = [...store.match(null, null, null)]
      .filter((q) => q.predicate.value === `${ACL}mode`)
      .map((q) => q.object.value)
      .sort();
    expect(modes).toEqual([`${ACL}Control`, `${ACL}Read`, `${ACL}Write`]);

    // The subject is the #owner authorization node.
    expect([...store.match(null, null, null)].some((q) => q.subject.value === auth)).toBe(true);
  });

  it("emits NO public / agentClass grant", async () => {
    const ttl = await buildOwnerAcl(RESOURCE, OWNER);
    const store = parse(ttl);
    const hasPublic = [...store.match(null, null, null)].some(
      (q) => q.predicate.value === `${ACL}agentClass`,
    );
    expect(hasPublic).toBe(false);
    expect(ttl).not.toMatch(/foaf:Agent|agentClass|AuthenticatedAgent/);
  });

  it("throws (fail-closed) on a non-http(s) owner WebID", async () => {
    await expect(buildOwnerAcl(RESOURCE, "urn:agent:alice")).rejects.toThrow(/valid owner/);
    await expect(buildOwnerAcl(RESOURCE, "")).rejects.toThrow(/valid owner/);
  });
});

describe("writeOwnerAcl", () => {
  it("PUTs the ACL to the resource's .acl via the injected fetch", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    await writeOwnerAcl(RESOURCE, OWNER, fetchMock as unknown as typeof fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[0]).toBe(`${RESOURCE}.acl`);
    expect(call[1].method).toBe("PUT");
  });

  it("throws (fail-closed) on a non-2xx response", async () => {
    const fetchMock = vi.fn(
      async () => new Response(null, { status: 403, statusText: "Forbidden" }),
    );
    await expect(
      writeOwnerAcl(RESOURCE, OWNER, fetchMock as unknown as typeof fetch),
    ).rejects.toThrow(/ACL write failed/);
  });
});
