# AXIA Legal — Egyptian Legal Practice & Intelligence OS (Android)

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
