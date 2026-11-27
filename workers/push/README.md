# AXIA Android background Push proof

Disabled by default. Source work for PR #58, based on main 2703b0c. This is the generic delayed-test path, not the legal-reminder scheduler or Production enablement.

- Run root app normally. Push APIs return disabled unless the exact Preview branch, scope, Origin, public Supabase project reference and reviewed key settings all match.
- User-facing routes use ordinary SSR/publishable Supabase access, fresh getUser/getClaims, current session/office checks, same-Origin + Fetch Metadata + custom header + short signed CSRF token. No Service Role or privileged DB connection in Next.js.
- Only an explicit user click asks OS permission or subscribes. Preview enrollment lasts at most 15 minutes/current JWT expiry; it never changes Auth session lengths. One delayed generic own-device test is scheduled at server time +90 seconds, expires five minutes later, and is limited to three per ten minutes.
- Four new private tables and narrow functions live in supabase/review/, outside automatic migrations. Their application, configuration, function owner, database login and grants require separate approval.
- Dispatcher is a separate Node 22 process, not a browser timer or an exposed cron URL. After approved provisioning: npm ci --prefix workers/push --ignore-scripts, then npm start --prefix workers/push -- --watch. Without AXIA_PUSH_ENABLED=1 it exits before any DB/provider connection.
- Worker DB login must be the separately approved axia_push_preview_worker with only axia_push_dispatcher membership, no superuser/DDL/RLS bypass. TLS certificate verification and explicit host/database checks are mandatory.
- Initial transport allows only the reviewed Android Chrome FCM endpoint path. DNS resolves public IPv4 once and pins the socket; there is no proxy, redirect following or IPv6/private-address fallback.
- VAPID signing uses web-push 3.6.7; subscription storage uses AES-256-GCM, identity AAD and keyed endpoint fingerprint. Real VAPID/encryption/DB credentials must never enter Git, CI, chat, URLs or logs.
- Every send re-authorizes after DNS and immediately before network I/O. Lease/nonce checks, rate limits, expiry and bounded retries are enforced. 404/410 removes ciphertext and revokes work; 401/403 disables the SQL sending gate.
- Submitted means accepted by the provider, never proof of OS display. Unknown network results may be duplicated on bounded retry; fixed generic notification tag/topic reduces repetition but does not promise exactly-once delivery.
- Logout/session removal, revoked MFA/office membership/office status and expired policy or consent prevent sending. Auth-policy attestation is required and must be refreshed/disabled before any provider-policy change. The source does not continuously read management settings.
- No legal data/payload is sent, no legal events are generated, and no task dates are inferred or edited. The existing worker shows its fixed generic text and safe same-Origin destination.
- Keep this first proof on a disposable isolated project with synthetic accounts, preserve Vercel protection, and dispose of its Push-only records after the supervised test. Long-term retention/purge, persistent consent renewal, iOS/Firefox/Windows provider support and legal-event mapping require later reviewed phases.

See docs/AXIA_WEB_PUSH_IMPLEMENTATION_REVIEW_2026-11-27.md for the exact approval manifest and phone steps. No phone-delivery PASS is claimed by unit, SQL or responsive browser tests.
