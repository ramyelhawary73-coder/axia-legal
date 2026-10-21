# AXIA Legal — Egyptian Legal Practice & Intelligence OS

This repository contains the Next.js web application in `src/` and a native Android foundation in `android/app/`. The web application is the current first-client delivery target. The canonical project state and next action are maintained in [`docs/AXIA_MASTER_ROADMAP.md`](docs/AXIA_MASTER_ROADMAP.md); integration verification and its limits are recorded in the [staff activation report](docs/AXIA_STAFF_ACTIVATION_ACCEPTANCE_2026-10-15.md).

## Native Android foundation

The Android screens below currently use `MockLegalDataSource` and in-memory ViewModel state. They do not establish live Supabase integration, persistent Android data or a verified Android release. The native module remains `:app`, mapped by `settings.gradle.kts` to `android/app/`; its source and assets are preserved. Keeping it outside root `app/` prevents Next.js from ignoring the web routes in `src/app/`.

Native Android implementation of **AXIA Legal**, the premier Egyptian Legal Practice & Intelligence OS, engineered with **Kotlin** and **Jetpack Compose (Material 3)**.

## Core Features & Capabilities

- **Executive Overview & Cockpit (نظرة عامة وغرفة القيادة):** Real-time key metrics, urgent court hearings roll, active litigation dossiers, and procedural deadline counters.
- **Matters & Dossiers (سجل القضايا والملفات القضائية):** Full lifecycle litigation management spanning Egyptian Court of Cassation (محكمة النقض), High Courts of Appeal (استئناف عالي), Cairo Economic Court (المحكمة الاقتصادية), State Council (مجلس الدولة), and First Instance Courts.
- **Court Rolls & Calendar (رول الجلسات والتقويم القضائي):** Daily tracking of court halls, roll numbers, scheduled decisions, and attending attorneys.
- **Clients & POA Registry (الموكلون وسجل التوكيلات):** Corporate and individual client records linked with official Powers of Attorney (توكيلات رسمية عامة وخاصة), notary offices, and fee balances.
- **Bailiff & Deadlines (قلم المحضرين ومواعيد السقوط):** Strict protection against procedural statute of limitations drops (إيداع مذكرات، طعون الاستئناف والنقض، وسداد الرسوم).
- **Encrypted Document Vault (خزينة المستندات):** Structured document categorization (صحف دعاوى، مذكرات دفاع، أحكام تمهيدية وقطعية، وعقود).
- **Legal Finance & Retainers (المالية والأتعاب والدمغات):** Retainers, expert deposits (أمانات الخبراء), court fees, and success fees.
- **RAJIH AI Copilot (محرك الذكاء القضائي «راجح»):** Sovereign Egyptian legal assistant anchored to Egyptian codes, Court of Cassation precedents, and structured defense strategies.
- **Legal Document Templates Library (مكتبة الصيغ والنماذج):** Official Egyptian legal drafting templates (إنذارات على يد محضر بتكليف بالوفاء، عقود إيجار تجارية بالقانون 4 لسنة 1996، وصحف دعاوى صحة ونفاذ).
- **Firm Defense Team (فريق العمل وهيئة الدفاع):** Managing partners and practice chairs.

## Architecture & Technology Stack

- **Platform:** Android (Min SDK 26, Target SDK 36, Compile SDK 36)
- **Language:** Kotlin 2.1.0 (JVM 21)
- **UI Framework:** Jetpack Compose with Material Design 3 (M3)
- **Architecture:** MVVM with Kotlin Coroutines & StateFlow
- **Layout:** Adaptive edge-to-edge layout (`WindowInsets.safeDrawing`, `WindowInsets.navigationBars`) with adaptive NavigationRail on expanded screens and NavigationBar on compact handhelds
- **Theme:** High-contrast luxury Egyptian legal dark theme with Axia Gold (`#C59B27`) and Deep Navy (`#0E131F`)
- **Iconography:** Custom adaptive launcher icon with Egyptian Scales of Justice emblem across all density buckets (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)


## Web application

- Next.js, React and TypeScript; Arabic-first RTL interface.
- Supabase Auth, PostgreSQL/RLS and Storage; Vercel hosting.
- Existing login and invitation acceptance behavior are unchanged by the Android path correction.

Use Node.js 22 as in CI, then install with `npm ci` and run `npm run dev`. Configure local public environment values privately using `.env.example`; never commit credentials or use Service Role for application flows.

Run `npm run check` for Typecheck, Lint, application tests and the production build. The build also checks fifteen required compiled web routes, so an empty `/404`-only build cannot be reported as a valid release. CI adds isolated SQL/concurrency and browser checks. These do not establish a real employee Auth/MFA session or successful email delivery.

### Developer Control D1 — isolated foundation

`/platform` prepares a separate Platform Owner identity, app MFA, a bounded office registry and immutable platform audit. Existing office membership/case permissions remain authoritative for legal records. The additive migration source seeds no real account or role and must not be applied to hosted Supabase without separate approval.

`AXIA_PLATFORM_CONTROL_ENABLED` defaults to `0`/absent; `AXIA_PLATFORM_CONTROL_ORIGIN` must be the exact reviewed HTTPS origin before MFA POST requests are possible. No hosted flag was changed. Preview therefore shows the disabled state until approved activation. MFA uses the existing SSR cookie client through authenticated API handlers, not the legacy browser client's separate localStorage session. No automatic enrollment or factor deletion is implemented.

See [D1 acceptance and activation limits](docs/AXIA_DEVELOPER_CONTROL_D1_ACCEPTANCE_2026-10-18.md) and the [permission contract](docs/AXIA_DEVELOPER_CONTROL_REVIEW_2026-10-18.md). Native SQL tests create/drop only their own named database inside an explicitly disposable loopback PostgreSQL service; they never accept a hosted database URL. Keep the current developer office membership until a verified ownership handoff is implemented and approved.

Work on a dedicated branch, verify CI and Preview, and obtain owner approval before merge or Production deployment. Native Android packaging/integration is separate follow-up scope and must not delay the first web-client delivery.
