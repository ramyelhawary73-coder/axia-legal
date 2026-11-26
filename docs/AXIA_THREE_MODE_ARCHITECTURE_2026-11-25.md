# AXIA three-mode architecture

Date: 2026-11-25. Owner approved the three product modes, updating the roadmap, designing their boundaries, and implementing the PWA foundation on a new branch based on PR #53. This is design authorization for local/offline operation, not approval to migrate hosted records, change Auth, or enable an offline write path.

## One product, one authority per office

| Mode | Canonical data and authentication | Client behavior | Current delivery |
| --- | --- | --- | --- |
| Cloud | Existing hosted office database/Storage and Supabase Auth; tenant and matter ACL remain authoritative | Browser or installed PWA; network required for business reads/writes | Existing web candidate; PWA foundation added here |
| Office server | An independently deployed local backend, database, Storage and Auth realm, reachable over reviewed HTTPS on the office network | Same PWA UI against the selected installation; office LAN can work without external internet | Architecture only; no local server package or migrated data |
| Device offline with sync | A bounded encrypted device vault and pending-operation journal; the chosen cloud/local office server remains canonical | Only explicitly permitted datasets/actions can be staged offline; reconnect revalidates identity/ACL before accepting operations | Architecture only; no legal-data vault, device enrollment or sync implemented |

Cloud and office-server deployments are alternative authorities for an office, not two independent writable masters for the same records. Devices may work offline against either authority after separate enrollment. An optional cloud copy of a local server is a backup/replica with a defined role, not an implicit second master. Authority transfer requires an approved export/cutover/restore manifest, a read-only cutover window, verified hashes and a reviewed identity mapping. No transfer is performed in this package.

Every future device/cache/operation is bound to installation + office + user + enrolled device. IDs must not collide across restored or transferred installations. Credentials are never carried to an arbitrary user-entered endpoint. Installation selection needs an approved HTTPS endpoint and explicit user sign-in; changing authority must not reuse another origin's session or silently copy local records. Browser storage is origin-specific; localhost, a LAN HTTPS hostname and cloud origin are distinct.

## Permissions and identity

- Online access retains server identity, office membership, case ACL and financial restrictions. Installing a PWA grants no role. Office Owner is not Platform Owner. Existing platform MFA stays online and server-verified.
- Local servers need separate administrator bootstrap, origin/redirect configuration, private TLS/hostname review, key custody, updates and recovery procedures. Do not clone hosted passwords, MFA seeds, sessions or Service Role credentials into clients. Local deployment credentials stay server-side and are separately provisioned.
- Future offline enrollment is explicit while online, after current identity/role checks and office/device approval. A bounded signed offline grant would name device/user/office/installation, permitted datasets/actions and an expiry. Its format, signing/key rotation and recovery require a separate Auth review before implementation.
- Offline authorization cannot know about a new remote revocation immediately. Limit grant lifetime and data scope, lock the vault when the grant expires, and require fresh online authorization to submit pending work. Never represent offline checks as fresh server MFA. A rejected/revoked grant retains recoverable encrypted drafts according to an approved retention/recovery policy; it must not silently upload under a different account.
- Proposed first offline writable scope is notes/draft revisions, not money, permissions, invitations, subscriptions, immutable audit or final legal-deadline actions. The owner must approve the exact dataset/field/action list. Email, MFA, exports and external AI calls are never replayed from a generic offline queue. RAJIH's hosted providers/external services are not promised offline.

## Conflict and synchronization contract (future)

1. Each pending operation carries a stable random operation ID, device/installation/office scope, target ID, expected server revision, bounded action payload and attachment hashes. Client timestamps are information, never authority or permission.
2. On reconnect, obtain a fresh ordinary session; the server rechecks membership, office status, case/field/action rights, grant/device validity and payload bounds inside each operation's transaction.
3. An office/device/operation uniqueness key makes retries idempotent. Commit the accepted mutation, its server revision, receipt and real-actor audit atomically. A lost response can be retried without duplicate cases, tasks, money or files. A bounded backoff follows the returned receipt/conflict rather than endlessly replaying.
4. Use compare-and-set revisions, not last-write-wins. A stale edit returns a conflict with an authorized projection of the server revision. The UI keeps both the encrypted pending edit and the server version, explains the conflict, and requires explicit review/reapply. No automatic overwriting of legal/financial facts.
5. Pull changes through a tenant/case-scoped server cursor. Tombstones and access-loss handling prevent resurrection of archived/deleted material. Immutable audit is never edited or deleted by sync. A revoked data scope is locked/purged only under an approved retention policy; backups must respect the same scope.
6. Files use office/case-bound upload sessions, content hashes, bounded sizes and explicit completion receipts. Legal records link only to verified authorized bytes. Restore/retry retains operation IDs and reconciles receipts before resubmitting; re-enrollment never invents a new actor or turns queued work into a duplicate.

## Encryption, storage and browser limits

Future legal-data storage needs an encrypted IndexedDB vault with authenticated encryption, encrypted attachments/journal, explicit unlock, office/account separation, quotas and interrupted-write tests. Keys must not be stored beside ciphertext in plaintext localStorage or logs. A passphrase/recovery/rotation design must be approved and tested; encryption cannot remove XSS or unlocked-device risks. Treat browser storage eviction and uninstall as possible data loss; show pending/acknowledged states and provide an approved encrypted recovery route. Never promise that iOS/Android runs background sync indefinitely: foreground/open-app sync is the baseline, with optional browser capabilities as enhancements.

## Backup and restore by mode

| Mode | Required backup contract | Required proof |
| --- | --- | --- |
| Cloud | Consistent canonical office snapshot plus every authorized Storage object's bytes, hashes, schema/version and encrypted manifest; immutable audit retained | Restore into an isolated empty target, verify rows, relations, bytes/hashes and scope; H2 remains open |
| Office server | Consistent database + Storage capture on a reviewed schedule, encrypted at rest, with an independent retained copy and operator-owned keys | Recover on a different isolated machine; test full/delta retention, interrupted jobs and documented recovery; copying a database alone is insufficient |
| Offline device | Encrypted pending journal/drafts/attachments plus acknowledged server checkpoint; excludes Auth secrets | Unlock on a reviewed recovery device, reconcile server receipts and idempotency IDs, preserve unresolved conflicts; cached shell or partial JSON snapshot is not a backup |

Backup destinations, retention, encryption/key recovery and data-residency choices need a concrete owner-approved manifest. No live export, new schedule, Storage upload, backup location or hosted restore is authorized by this design. Existing partial unencrypted daily snapshots remain explicitly separate from full backup/recovery.

## Staged delivery and approval points

- **P1 — this branch:** install manifest, existing-brand normal/maskable/Apple icons, public install guidance/native prompt on user action, standalone signal, user-chosen update reload, versioned public-only service worker and generic offline screen. No offline business data or mutation queue.
- **P2 — local-server package:** reviewed HTTPS/domain/hardware and independently provisioned backend/DB/Storage/Auth; validate in an isolated fictional office. Show infrastructure/cost and any Auth changes before applying them. Existing hosted records stay in place.
- **P3 — offline prototype:** synthetic isolated device vault and draft queue, encryption/unlock/recovery, eviction/error cases and UI review. Show the exact permitted dataset/action list before connecting hosted data.
- **P4 — approved sync service:** separately review proposed device grants/enrollment, operation receipts, revisions/change cursor/tombstones, tenant/case RLS, RPC/transaction/index changes and authority-transfer protocol. Only then generate/review a migration and apply the exact approved change. No blanket migration replay.
- **P5 — acceptance:** desktop/laptop/Android/iOS real installation, update with unsaved edits, offline privacy, long-disconnect conflict/revocation, duplicate retries, isolated restore and a complete sold workflow before release.

## Database/Auth impact presented before application

**P1 requires no schema migration, Auth-provider/TTL/redirect/Secret/role change or feature activation.** Only exact public installation/help asset URLs bypass the web Proxy, with regression checks that neighboring work/API/Auth routes remain matched and backend guards unchanged. This is a source-only static-asset exception, not an anonymous business-data API.

Future P2/P4 may require independently provisioned local Auth, device enrollment/grants, operation-receipt uniqueness, per-record revision/change tracking and scoped sync RPCs/policies. Existing durable-draft revisions should be reused where suitable. Table/RPC names, SQL, expiry, keys and hardware are not decided or applied by this document. Present their exact design and migrations to the owner before hosted database/Auth application. PWA installation alone does not authorize any of them.

No main merge or Production release. PR #53 and its enabled platform origin remain on their own branch; no flags/Secrets are copied to this PWA branch. Advanced control center remains disabled here.

References checked: installed Next.js 16.3.3 PWA/manifest/metadata documentation, https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable , https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation , https://supabase.com/docs/guides/self-hosting .
