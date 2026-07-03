/**
 * Owner-only, fail-closed WAC ACL — the ONE reviewed home for the "an
 * accessibility report is pod-private by default" invariant.
 *
 * An EARL a11y report is scan output about a (possibly not-yet-remediated) site,
 * so the safe suite default is owner-private: EVERY report resource gets an
 * owner-only ACL granting ONLY the owner `acl:Read`/`Write`/`Control` over the
 * resource (`acl:accessTo`) AND its descendants (`acl:default`). A consumer such
 * as AccessRadar MAY deliberately widen a published report by writing its own
 * ACL; this helper never emits a public / `acl:agentClass` grant.
 *
 * **Fail-closed:** an invalid / non-http(s) owner WebID (or a fragment/query on
 * the resource URL) THROWS rather than producing a permissive or mis-targeted
 * ACL. Built with `n3.Writer` + typed quads — **never hand-concatenated triples**
 * (house rule). Browser-safe: only `n3` + the WHATWG `URL` global.
 */
/**
 * The ACL resource URL for a Solid resource/container — `${resourceUrl}.acl`
 * (the WAC convention).
 *
 * @throws (fail-closed) if `resourceUrl` is not an absolute http(s) URL, or if
 *   it carries a fragment or query (see {@link assertAclableResource}).
 */
export declare function aclUrlFor(resourceUrl: string): string;
/**
 * Build an **owner-only, fail-closed** WAC ACL Turtle document for `resourceUrl`
 * (typically the report resource/container), granting ONLY `ownerWebId`
 * `acl:Read`/`Write`/`Control` over the resource (`acl:accessTo`) and its
 * descendants (`acl:default`). No public / `acl:agentClass` grant is emitted.
 *
 * @throws if `ownerWebId` is not an absolute http(s) IRI (fail-closed — never
 *   write an ACL whose only authorization names an empty/malformed agent).
 */
export declare function buildOwnerAcl(resourceUrl: string, ownerWebId: string): Promise<string>;
/**
 * Write an owner-only ACL for `resourceUrl` via an injectable authed `fetch`
 * (PUT `${resourceUrl}.acl`). The fetch seam keeps this unit-testable with a
 * stubbed fetch and no server. Throws on a non-2xx response (fail-closed — a
 * resource whose ACL write failed must not be treated as protected).
 */
export declare function writeOwnerAcl(resourceUrl: string, ownerWebId: string, authedFetch: typeof globalThis.fetch): Promise<void>;
//# sourceMappingURL=acl.d.ts.map