// AUTHORED-BY Claude Opus 4.8 (Fable unavailable) — re-review/upgrade candidate.
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
import { DataFactory, Store, Writer } from "n3";
import { httpIriOrUndefined } from "./iri.js";
import { ACL, acl, RDF_TYPE } from "./vocab.js";
const { namedNode } = DataFactory;
/**
 * Canonicalise + validate a resource/container URL an ACL will be written for.
 * **Fail-closed:** rejects anything not an absolute http(s) URL, and rejects a
 * URL carrying a FRAGMENT or QUERY. A fragment is the dangerous case — appending
 * `.acl` to a subject IRI like `…/report.ttl#it` yields `…/report.ttl#it.acl`,
 * whose fragment `fetch` STRIPS, so the ACL body would be PUT to the DATA
 * resource itself, overwriting it. Returns the canonical fragment-free URL.
 */
function assertAclableResource(resourceUrl) {
    let u;
    try {
        u = new URL(resourceUrl);
    }
    catch {
        throw new Error(`aclUrlFor: resourceUrl must be an absolute http(s) URL (got ${JSON.stringify(resourceUrl)}).`);
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
        throw new Error(`aclUrlFor: resourceUrl must be http(s) (got ${u.protocol}) — refusing to write an ACL for a non-http resource.`);
    }
    if (u.hash !== "") {
        throw new Error(`aclUrlFor: resourceUrl must have NO fragment (got ${JSON.stringify(resourceUrl)}) — a fragment would make the ACL body target the data resource itself.`);
    }
    if (u.search !== "") {
        throw new Error(`aclUrlFor: resourceUrl must have NO query string (got ${JSON.stringify(resourceUrl)}) — a query would make the ACL body target a different resource.`);
    }
    return u.href;
}
/**
 * The ACL resource URL for a Solid resource/container — `${resourceUrl}.acl`
 * (the WAC convention).
 *
 * @throws (fail-closed) if `resourceUrl` is not an absolute http(s) URL, or if
 *   it carries a fragment or query (see {@link assertAclableResource}).
 */
export function aclUrlFor(resourceUrl) {
    return `${assertAclableResource(resourceUrl)}.acl`;
}
/**
 * Build an **owner-only, fail-closed** WAC ACL Turtle document for `resourceUrl`
 * (typically the report resource/container), granting ONLY `ownerWebId`
 * `acl:Read`/`Write`/`Control` over the resource (`acl:accessTo`) and its
 * descendants (`acl:default`). No public / `acl:agentClass` grant is emitted.
 *
 * @throws if `ownerWebId` is not an absolute http(s) IRI (fail-closed — never
 *   write an ACL whose only authorization names an empty/malformed agent).
 */
export async function buildOwnerAcl(resourceUrl, ownerWebId) {
    const owner = httpIriOrUndefined(ownerWebId);
    if (!owner) {
        throw new Error("buildOwnerAcl: ownerWebId must be an absolute http(s) WebID IRI " +
            "(fail-closed — refusing to write an ACL with no valid owner).");
    }
    const aclUrl = aclUrlFor(resourceUrl);
    const resource = aclUrl.slice(0, -".acl".length);
    const auth = namedNode(`${aclUrl}#owner`);
    const store = new Store();
    store.addQuad(auth, namedNode(RDF_TYPE), namedNode(acl("Authorization")));
    store.addQuad(auth, namedNode(acl("agent")), namedNode(owner));
    store.addQuad(auth, namedNode(acl("accessTo")), namedNode(resource));
    store.addQuad(auth, namedNode(acl("default")), namedNode(resource));
    store.addQuad(auth, namedNode(acl("mode")), namedNode(acl("Read")));
    store.addQuad(auth, namedNode(acl("mode")), namedNode(acl("Write")));
    store.addQuad(auth, namedNode(acl("mode")), namedNode(acl("Control")));
    const writer = new Writer({ format: "text/turtle", prefixes: { acl: ACL } });
    writer.addQuads([...store]);
    return new Promise((resolve, reject) => {
        writer.end((error, result) => (error ? reject(error) : resolve(result)));
    });
}
/**
 * Write an owner-only ACL for `resourceUrl` via an injectable authed `fetch`
 * (PUT `${resourceUrl}.acl`). The fetch seam keeps this unit-testable with a
 * stubbed fetch and no server. Throws on a non-2xx response (fail-closed — a
 * resource whose ACL write failed must not be treated as protected).
 */
export async function writeOwnerAcl(resourceUrl, ownerWebId, authedFetch) {
    const aclUrl = aclUrlFor(resourceUrl);
    const body = await buildOwnerAcl(resourceUrl, ownerWebId);
    const res = await authedFetch(aclUrl, {
        method: "PUT",
        headers: { "content-type": "text/turtle" },
        body,
    });
    if (!res.ok) {
        throw new Error(`owner-only ACL write failed: PUT ${aclUrl} -> ${res.status} ${res.statusText}`);
    }
}
//# sourceMappingURL=acl.js.map