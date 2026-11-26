# تفعيل Push على Preview — تفاصيل للمراجعة فقط

**الحالة: REVIEW ONLY — لم يُطبّق أي جزء.**

مرجع التشغيل الذي نختبره: PR #55، المصدر `ffb644d65774182e31f1e8db5a2bbaaecb7bb40c`، Preview `dpl_FXVfjshYs6iTE78TyiNANt2WkhYP`. تأكدنا مجددًا في 26 نوفمبر 2026 من READY وفحص GitHub الناجح `45860932720`. يبقى هذا المصدر ثابتًا أثناء قبول الأجهزة. هذا المستند في فرع توثيق منفصل ولا يحدّث فرع PR #55.

## ما الذي سيعمل وما الذي لم يعمل بعد؟

PR #55 يعرض تذكيرات المكتب ويطلب إذن إشعارات الجهاز عند ضغط المستخدم. يستطيع طلب إشعار عام أثناء فتح التطبيق على متصفح يدعم ذلك. لا توجد خدمة لإرسال الإشعارات بعد الإغلاق، ولا اشتراك Push محفوظ أو مفاتيح VAPID أو جدول إرسال. وجود مستقبل `push` في service worker وحده لا يفعّل الخدمة.

الخطة المقترحة: المستخدم يختار الاشتراك لكل جهاز، والخادم يرسل رسالة عامة فقط إذا ظل الحساب والجلسة والمكتب والوصول للقضية صالحين. لا أسماء موكلين أو أرقام قضايا أو محتوى قانوني على شاشة القفل. عند الضغط يفتح التطبيق مع التحقق المعتاد من الدخول؛ لا انتقال إلى رابط يرسله العميل.

**المطلوب الآن مراجعة هذه المواصفات، وليس الموافقة الضمنية على تنفيذها.** التغييرات التالية ليست موجودة في قاعدة البيانات ولم تُنشأ مفاتيحها أو أدوارها أو خدماتها.

## 1. حدود بيئة الاختبار

- أصل التطبيق المقيد: `https://axia-legal-git-feat-axia-9a6f14-ramyelhawary73-coders-projects.vercel.app`؛ تُرفض Origins الأخرى، ومنها Production وروابط deployments المتغيرة. لاحقًا يحتاج فرع تنفيذ Push أصل Preview مستقلًا ومعتمدًا قبل أي اشتراك؛ لا يُغيّر أصل قبول PR #55 تلقائيًا.
- `deployment_scope = 'axia-push-preview-v1'` ثابت في الخادم والقاعدة والجدولة. لا يأتي من العميل. هوية/مفاتيح VAPID وسجلات الجهاز منفصلة عن Production.
- الاستضافة Preview لا تعني قاعدة بيانات معزولة. لم نفحص قيم Secrets، ولم نؤكد أن Preview الحالي يستخدم Supabase مستقلًا. **لا تُطبّق DDL على مشروع قائم اعتمادًا على تسمية Preview فقط.**
- المقترح المفضل: مشروع Supabase تجريبي مستقل أو قاعدة disposable للتنفيذ الأول، ببيانات وحسابات اختبار خيالية معتمدة؛ لا نسخ بيانات المكاتب أو Auth من المشروع الحالي. إنشاء المشروع والحسابات يتطلب قرارًا منفصلًا، ولم يحدث.
- إذا اختيرت قاعدة مشتركة لاحقًا، يصبح ذلك تغييرًا في قاعدة حية يحتاج manifest وترحيل وACL ونسخ احتياطي وموافقة صريحة؛ Origin/flags وحدهما لا يعزلان قاعدة مشتركة. لا يُعتبر هذا الخيار معتمدًا هنا.
- لا تفعيل لمركز التحكم أو إدارة المنصة، ولا تغيير مدتَي الجلسة/JWT أو إعداد MFA أو RLS الحالية أو memberships.

## 2. قواعد الاستحقاق والإرسال

1. البداية باشتراك صريح من جهاز مسجّل الدخول، بعد اكتشاف دعم APIs. iPhone/iPad: تطبيق Home Screen على نظام يدعم Web Push، وطلب الإذن بضغطة المستخدم. لا نافذة إذن عند فتح الصفحة تلقائيًا.
2. تحقق SSR جديد من المستخدم المؤكد وغير المحظور ومن عضوية المكتب المختارة؛ لا fallback تجريبي عند غياب إعداد Supabase. الأعلام والمشروع والهوية غير المطابقة تؤدي إلى رفض آمن.
3. استخرج `session_id` من JWT موثّق خادميًا؛ لا تقبل user_id أو session_id أو organization_id أو AAL من جسم الطلب كهوية موثوقة. تحقق من الجلسة في قاعدة Auth ووقت انتهائها والسياسة الفعلية للمدة والخمول. وجود صف session وحده لا يثبت صلاحيتها.
4. لا يُحفظ access token أو refresh token أو MFA code. تجديد access token لنفس الجلسة لا ينشئ جهازًا جديدًا؛ تبديل الجلسة أو المكتب يحتاج إعادة ربط/موافقة صريحة.
5. تُعاد مراجعة الاستحقاق مباشرة قبل كل إرسال: الجهاز موافق، نفس session والمستخدم والمكتب، لا حظر/تعليق/انتهاء مكتب، والحدث ما زال صالحًا مع ACL القضية الحالي. تعذر التحقق يمنع الإرسال؛ لا استخدام لاستحقاق قديم.
6. مهام المرحلة الأولى: مهام عاجلة/حرجة مسندة للمستخدم نفسه، غير مكتملة أو مؤرشفة. **المصدر الحالي يعرّف tasks.deadline كـ date، وليس timestamp؛ لا يوجد موعد دقيق تلقائي لمهام المكتب الحالية.** المقترح وقت تذكير شخصي صريح في جدول Push مستقل يختاره المستخدم، مع إظهار أنه تذكير وليس ساعة انتهاء قانونية، دون تعديل tasks.deadline. إذا لم يُعتمد/يُحدد هذا الوقت تبقى المهام في مركز التذكيرات فقط دون Push تلقائي. الجلسات: للمحامي الحاضر المحدد بنفسه فقط، scheduled/postponed وغير مؤرشفة، ووصوله للقضية ما زال قائمًا. لا جمهور تلقائي لجميع أعضاء المكتب.
7. المصدر الحالي يسمح بقراءة tasks على مستوى عضوية المكتب مع ربط matter داخل المكتب؛ وقراءة hearings تعتمد على `private.can_access_matter`. نضيف شرط وصول للقضية في الإرسال بشكل أضيق، **ولا نعدّل سياسة القراءة الحالية**. لو توسّع نطاق المستقبلين يلزم قرار منفصل.
8. قبل الإرسال تُفحص النسخة الحالية من موعد الحدث؛ إكمال/إلغاء/إعادة إسناد/تغيير الموعد يلغي job القديم. لا كتابة إلى السجلات القانونية لإنشاء تجربة. لا تُخترع ساعة لمهمة بتاريخ فقط، ولا يُحوّل وقت القاهرة غير الموجود/الملتبس عند DST إلى ساعة تخمينية.
9. المقترح الأول للجلسات: تذكير واحد قبل 30 دقيقة من الوقت الصريح، ولا catch-up بعد الجلسة. للمهام ذات التاريخ فقط: إرسال عند notify_at الذي اختاره المستخدم، وصلاحية تقنية للتذكير 5 دقائق بعده؛ هذه ليست ساعة انتهاء الميعاد القانوني. أي تغيير في تاريخ المهمة يُبطل reminder الشخصي القديم ويحتاج اختيارًا صريحًا جديدًا. وقت تشغيل scheduler كل دقيقة هدف تشغيلي وليس ضمان وصول؛ مهلة الشبكة/OS/Focus والإذن قد تمنع العرض.

## 3. مخطط البيانات المقترح

جميع الجداول الجديدة في schema `private`، مع ENABLE/FORCE RLS، ومنع كل وصول مباشر لـ PUBLIC/anon/authenticated. أسماء/حقول هذه الجداول هي عقد المراجعة، وليست ملف SQL جاهزًا للتطبيق. أسماء القيود وFK والفهارس النهائية يجب أن تظهر في الترحيل اللاحق قبل اعتماده.

| الجدول | الحقول والقيود المقترحة | الفهارس/الاحتفاظ |
| --- | --- | --- |
| `private.push_devices` | `id uuid PK`; `scope text`; `organization_id uuid`; `user_id uuid`; `session_id uuid`; `installation_id uuid` عشوائي داخل الجهاز؛ `origin text`; `endpoint_hash bytea`; `subscription_ciphertext bytea`; `crypto_key_version smallint`; `consented_at timestamptz`; `expires_at timestamptz`; `revoked_at timestamptz null`; `revision bigint`; `created_at`, `updated_at`. FK للمستخدم/المكتب حسب مخطط متحقق منه؛ FK للجلسة ON DELETE SET NULL مع session_id nullable عند الإبطال فقط، وإبطال binding/jobs عند إزالة الربط. يجب إثبات أن ذلك لا يمنع logout أو حذف الجلسة ولا يحتاج trigger جديدًا على Auth. حذف جلسة لا يُحذف سجلًا قانونيًا. لا تحديث لهوية الجهاز أو origin في مكانها؛ تبديلها يلغي الربط السابق. UNIQUE(scope,endpoint_hash) يمنع وصول جهاز واحد لحسابين داخل البيئة. | فهرس own-device(scope,user_id,organization_id,revoked_at)، وexpiry. سقف مقترح 5 أجهزة نشطة لكل مستخدم/مكتب. lease لا يتجاوز 30 يومًا أو نهاية session الفعلية أيهما أقرب. حذف ciphertext خلال 24 ساعة من الإبطال مع إبقاء audit عام محدود. |
| `private.push_preferences` | PK(scope,organization_id,user_id,category). category في task/hearing فقط؛ enabled=false افتراضيًا؛ lead_minutes=30 للمرحلة الأولى؛ timezone='Africa/Cairo'; quiet_enabled=false افتراضيًا. تفعيل ساعات هدوء يؤجل داخل نافذة صلاحية الحدث فقط وإلا يُسقط التذكير، دون توسيع الصلاحيات. | لا تفعيل بالنيابة عن مستخدم آخر. لا تحويل صامت لتفضيلات الجلسة الحالية إلى موافقة دائمة. |
| `private.push_task_reminders` | `id uuid PK`; `scope`; `organization_id`; `user_id`; `task_id`; `task_revision_hash`; `notify_at timestamptz` صريح؛ `revision`; `enabled=false` افتراضيًا؛ created/updated. الوقت اختيار شخصي لا يُكتب إلى task.deadline ولا يُعرض كميعاد قانوني. مشتق الربط والمكتب من المهمة المسموح بها، لا من العميل. | UNIQUE(scope,user_id,task_id). إبطال عند اكتمال/إعادة إسناد/تغيير تاريخ المهمة أو فقد ACL. لا تذكير بعد يوم المهمة بتقويم القاهرة، لا وقت غامض؛ إذا لم يوجد وقت معتمد لا enqueue. نافذة الإرسال الشخصية تنتهي بعد notify_at+5min لمنع catch-up متأخر. |
| `private.push_outbox` | `id uuid PK`; `scope`; `device_id`; `organization_id`; `recipient_id`; واحد فقط من `task_id`/`hearing_id`؛ FK حقيقي للمصدر؛ `source_kind` و`source_id` مشتقان من هذين العمودين لا يقبلان قيمة مستقلة؛ `source_revision_hash bytea` داخلي؛ `lead_minutes smallint` (30 للجلسة و0 لوقت المهمة الشخصي)، و`personal_reminder_id uuid null` مرتبط بجدول التذكير الشخصي؛ `scheduled_at`, `expires_at`; `state` pending/claimed/submitted/retry/suppressed/expired/failed؛ `attempt_count`; `next_attempt_at`; `lease_until`; `claim_nonce_hash`; `submitted_at null`; `reason_code`; `created_at`, `updated_at`. ممنوع تخزين عنوان/نص قانوني أو endpoint/token. | UNIQUE(scope,device_id,source_kind,source_id,source_revision_hash,lead_minutes). فهرس جزئي(scope,next_attempt_at,id) للـ pending/retry، وفهرس lease للـ claimed. سقف batch=50 وlease=60s. مسح terminal rows بعد 30 يومًا. |
| `private.push_delivery_audit` | `id`, `scope`, `outbox_id` opaque، `actor_type='push_worker'` أو user عند تغيير موافقته، `actor_id` فقط عند فعل المستخدم، `action`, `reason_code`, `attempt`, `created_at`. لا endpoint أو IP/UA أو headers أو مفاتيح/نص قانوني. | index(scope,created_at,id)، append-only للعميل والعامل؛ purge محدود بهوية صيانة مستقلة بعد 30 يومًا. لا تغيير إلى audit القانوني الحالي. |

تُشفّر subscription endpoint وp256dh/auth باستخدام AEAD في الخادم، nonce عشوائي، وربط scope/device/user/org/origin كـ AAD. لا reuse للـnonce. endpoint_hash يُستخدم للفهرسة فقط. تدوير مفتاح التشفير versioned مع فترة فك القديم، ولا يغيّر سر VAPID القائم صامتًا؛ فقدان مفاتيح VAPID يتطلب إعادة اشتراك بإذن المستخدم.

## 4. جدول الصلاحيات المقترح

| الهوية | ما يُسمح به | ما يُمنع |
| --- | --- | --- |
| anon | قراءة معلومة الدعم العامة فقط إذا endpoint مفعّل ومطابق للـOrigin | الاشتراك/الأجهزة/التفضيلات/queue/audit وكل SQL الخاص |
| authenticated user عبر SSR | RPC محدودة لعرض ملخص أجهزته، تسجيل جهازه الحالي/إبطاله وتفضيلاته هو فقط، بعد session وmembership وفحوص Origin/CSRF | تغيير هوية جهاز؛ ربط حساب آخر؛ قراءة endpoint/ciphertext عبر الاستجابة؛ إنشاء events أو تحديد مستقبلين؛ وصول مباشر للجداول |
| owner/admin داخل مكتب | أجهزة/تفضيلات نفسه مثل أي مستخدم | تفعيل إذن جهاز موظف أو قراءة اشتراكه أو تجاوز ACL؛ لا سلطة Push جديدة لمجرد منصبه |
| `axia_push_dispatcher` جديد (مقترح) | CONNECT إلى قاعدة الاختبار وEXECUTE على وظائف claim/authorize/result محددة فقط ضمن scope ثابت؛ تنفيذ مستقل خارج runtime العادي | SELECT عام أو BYPASSRLS أو عضوية أدوار موجودة أو DDL أو قراءة Auth tokens أو UPDATE لأي بيانات مكتب؛ لا استدعاء وظائف مركز التحكم |
| مالك وظائف Push NOLOGIN | منح لازمة فقط لتنفيذ الوظائف المراجعة؛ search_path فارغ وأسماء مؤهلة بالكامل؛ ACL ومصدر الوظائف مثبتان بفحوص ما قبل التشغيل | لا تسجيل دخول أو إدارة موارد أخرى. لا تعديل أي helper RLS حالي ليدعم الانتحال |
| مشغّل الترحيل/الصيانة | الترحيل المعتمد أو purge محدود منفصل بعد manifest | لا seed لسلطة مستخدم؛ لا انتحال auth.uid أو set_config JWT؛ لا تفويض جديد في مركز التحكم |

العامل لا يُمرر user_id مصطنعًا إلى helper قائم على auth.uid. وظيفة الاستحقاق الجديدة تأخذ job opaque، تستخرج الربط من الجداول المقيدة، وتطبّق predicate مكافئًا/أضيق لعضوية المكتب وACL وتوقف المكتب/العضو وفق البنية الفعلية. يجب إثبات التكافؤ باختبارات جميع الأدوار قبل الموافقة على SQL. لا يُمنح العامل قراءة مفتوحة للجداول القانونية أو `auth.sessions`. وظائف ضيقة تقرأ أعمدة التحقق الضرورية فقط ولا تُرجع تفاصيلها للعامل.

## 5. عقود API المقترحة — ليست endpoints منفذة

كل استجابة `Cache-Control: private, no-store`؛ لا cache في service worker. تفعيل ثابت server-only، Origin HTTPS مطابق، CSRF token، حجم جسم أقصى 8KiB، والتحقق من نوع كل حقل ورفض الإضافات. لا JWT/رمز MFA في body أو log.

| المسار | الطلب/الاستجابة المقترحة | فحوص/قيود |
| --- | --- | --- |
| GET `/api/push/config` | enabled/support/public VAPID key فقط؛ disabled response عند الإيقاف | لا قيمة private key، ولا fallback إلى وضع mock، ولا احتياج إذن OS للقراءة |
| GET `/api/push/devices` | أجهزة المستخدم بوسم اختياري محدود وتاريخ الموافقة والحالة؛ دون endpoint أو user-agent/session id | getUser + current live session + membership + exact origin؛ pagination ≤20 |
| POST `/api/push/devices` | installationId + subscription القياسي فقط؛ id/revision للربط الجديد | الإذن من المستخدم؛ derive identity/scope/origin server-side؛ 10 محاولات/10min لكل مستخدم/مكتب، سقف 5 أجهزة؛ منع إعادة ربط endpoint بحساب آخر دون إبطال الربط القديم والموافقة |
| DELETE `/api/push/devices/{id}` | إبطال جهاز يملكه المستخدم + إلغاء jobs؛ 204 عند الإعادة | CSRF + owner binding؛ إبطال idempotent؛ browser unsubscribe اختياري لاحقًا دون ادعاء إبطال محلي أنه وصل للخادم |
| PUT `/api/push/preferences` | category/enabled وrevision؛ 409 عند stale revision | own scope فقط، لا جمهور أو أرقام مستخدمين؛ لا تعميم هدوء/توقيت غير معتمد |
| PUT `/api/push/task-reminders/{taskId}` | notifyAt بمعيار RFC3339 مع timezone وrevision؛ عرض واضح «موعد تذكير شخصي» | عضوية/ACL/إسناد صالح وown user، رفض وقت غامض/سابق أو بعد يوم المهمة، لا تعديل tasks.deadline؛ إن لم يُعتمد هذا المسار تُستبعد مهام date-only من Push |
| POST `/api/push/test` | اختبار عام للجهاز الحالي فقط؛ 202 يعني قبول طلب الاختبار | اشتراك مستخدم حالي صالح؛ 3 طلبات/10min/device؛ لا title/body/url من العميل؛ ليس إثبات مشاهدة OS |

لا endpoint عام لسحب queue ولا لتشغيل scheduler بمفتاح query string. العامل المقترح عملية مستقلة بحساب قاعدة ضيق؛ إذا استبدل بـVercel Cron/Edge Function لاحقًا، تُراجع الخدمة وسر المصادقة والتفويض قبل الاختيار. لا استعمال Service Role داخل Next SSR أو المتصفح أو لحل نقص ACL.

## 6. SSRF والموثوقية والإلغاء

- يقبل enrollment endpoint HTTPS فقط، دون username/password/fragment، والمنافذ المعتمدة فقط، ومن vendors محددين في manifest التنفيذ. WebKit يذكر نطاق `*.push.apple.com`؛ عناوين Chrome/Firefox الدقيقة تُتحقق رسميًا قبل allowlisting. لا wildcard عام أو اعتماد endpoint يقدمه العميل كدليل أمان.
- تحقق DNS وIPv4/IPv6 لكل اتصال مع رفض loopback/private/link-local/metadata؛ ثبّت عنوان الاتصال المتحقق منه، TLS SNI/hostname صحيح، لا redirects. امنع DNS rebinding بوسيلة egress gateway/dispatcher قادرة على pinning؛ إذا لم تسمح البيئة بذلك لا تُفعّل خدمة الإرسال. لا access tokens في headers إلى vendor.
- اسحب jobs بـ SKIP LOCKED/lease بدون حجز transaction خلال اتصال الشبكة. راجع eligibility مباشرة قبل send؛ إذا تغير الربط/الموعد بعد الفحص لا يمكن سحب رسالة قُدمت للـvendor، ولذلك payload عام وTTL قصير. بعد الإلغاء لا تُسحب أعمال جديدة. الفحص قبل الإرسال يقلص السباق ولا يعد بضمان سحب رسالة قائمة في شبكة vendor.
- TTL = min(300 ثانية، الباقي حتى expires_at)، وإسقاط إذا أصبح ≤0. expires_at يساوي وقت الجلسة للجلسات، أو notify_at+5min للتذكير الشخصي للمهمة؛ لا يُفسر الأخير كساعة سقوط قانونية. الحد المقترح 3 attempts إجمالًا؛ retry بعد 30s ثم 120s على 429/5xx/network فقط إن لم تنته النافذة، واحترام Retry-After. 404/410 يبطل الجهاز ويمنع بقية jobs؛ 400 خطأ دائم؛ 401/403 يوقف العامل للتحقيق ولا يكرر إرسالًا محمومًا.
- الاتصال المنقطع بعد submit قد يترك النتيجة مجهولة؛ لا ادعاء exactly-once. Unique job + tag عام ثابت يقللان التكرار، مع سياسة retry محدودة. حالات audit هي submitted/suppressed/failed، وليست delivered أو read دون دليل OS/مستخدم.
- logout يستدعي إبطال الربط عند الإمكان؛ فشل الشبكة لا يحوّل local logout إلى إبطال خادمي ناجح. العامل يعيد تحقق الجلسة الحية، ووجود session row وحده ليس كافيًا لحدود الخمول/المدة. سياسة Supabase الحالية تُقرأ دون تغيير قبل التنفيذ؛ إذا تعذر تقييمها نرفض الإرسال. انتهاء lease يمنع استمرار جهاز مهجور. لا إنشاء جلسة للمستخدم بواسطة العامل.

## 7. الإعدادات والأسرار المقترحة — أسماء فقط

| الاسم المقترح | التصنيف | القيمة/النطاق المقترح |
| --- | --- | --- |
| `AXIA_PUSH_ENABLED` | non-secret server flag | 0 افتراضيًا؛ 1 فقط بعد موافقة مستقلة واختبارات؛ لم يُنشأ أو يتغير الآن |
| `AXIA_PUSH_ORIGIN` | non-secret server | أصل Preview المعتمد لفرع التنفيذ فقط؛ رفض Production |
| `AXIA_PUSH_SCOPE` | non-secret server | axia-push-preview-v1، ثابت ومطابق للقاعدة والعامل |
| `AXIA_PUSH_VAPID_PUBLIC_KEY` | public identity | تُولّد لاحقًا في بيئة محكومة؛ endpoint config يعرضها فقط بعد التفعيل، لا قيمة في هذا المستند |
| `AXIA_PUSH_VAPID_PRIVATE_KEY` | Secret جديد | خادم dispatcher فقط، لا Next public env ولا logs/repo |
| `AXIA_PUSH_SUBSCRIPTION_KEY_V1` | Secret جديد | تشفير subscription؛ توفيره لخادم enrollment وdispatcher بحدود مستقلة |
| `AXIA_PUSH_DISPATCH_DATABASE_URL` | Secret جديد | حساب dispatcher المقيد إلى قاعدة Preview المعتمدة؛ لا حساب postgres/service_role أو قاعدة حية تلقائيًا |
| `AXIA_PUSH_VAPID_SUBJECT` | non-secret contact | رابط HTTPS أو بريد تشغيل يعتمد المالك عرضه لمزود Push؛ لم نختر بريدًا شخصيًا من الحسابات المتصلة |

المتغيرات غير موجودة في التنفيذ الحالي. لم نقرأ قيم Secrets أو نولّد زوج مفاتيح أو نعدّل إعدادًا. لا يُطلب إدخال Secret أو كلمة مرور في المحادثة. MFA الحالي لا يتغير؛ مالك الجهاز يدخل بياناته بنفسه عند أي تسجيل دخول مشروع.

## 8. ترتيب التنفيذ بعد موافقات لاحقة

A. استكمال قبول PR #55 على أندرويد وآيفون، مع بقاء الإشعارات بعد الإغلاق PENDING. إعداد branch تنفيذ منفصل من المصدر المقبول، واختيار قاعدة Preview المعزولة/fictional fixture manifest وOrigin واتصال المشغّل وcontact، واعتماد/تأجيل وقت التذكير الشخصي للمهام date-only.

B. تقديم SQL up/down النهائي وأسماء/تعريفات الوظائف/GRANTs والفهارس وprerequisite checks ونسخة التراجع، مع endpoint allowlist وطريقة egress، وبيان Secrets بالأسماء والنطاقات. هذا المستند لا يقوم مقام الموافقة على تطبيق SQL غير مكتوب بعد.

C. تنفيذ واختبار محلي على disposable PostgreSQL بنفس أدوار Auth/RLS الفعلية، دون اتصال بقاعدة حية أو اشتراك vendor حقيقي. التحقق من جلسة منتهية/محذوفة ومكتب/عضو معلّق وACL revoked وتنافس revoke/send وتغيير موعد، وCSRF/Origin/SSRF/حدود الإرسال وعدم كشف endpoint/قضايا. فشل prerequisite يمنع التشغيل.

D. عرض نتائج الكود/SQL/الرجوع، ثم طلب الإذن المحدد لإنشاء موارد Preview والأسرار والاشتراكات. بعد الموافقة فقط: provision معزول، ترحيل جديد دون replay تاريخي، توليد مفاتيح آمن، نشر فرع التنفيذ Preview والأعلام 0، ثم smoke tests. التفعيل 1 واشتراك الجهاز بإذن مالكه خطوة مستقلة لاحقة.

E. اختبار عام على Android ثم iPhone بتدخل المالك: إذن OS، واجهة أمامية، تطبيق مغلق، شاشة مقفولة، offline ثم اتصال مع انتهاء TTL، إبطال الجهاز/logout/scope switch، عدم استقبال حساب آخر. لا استخدام قضايا حقيقية لاختبار queue، ولا نسبة PASS لمجرد 202/201 من مزود Push.

## 9. خطة الرجوع المقترحة

أوقف dispatcher وأعلام Push أولًا وامنع claims الجديدة، وأبطل bindings/jobs الجديدة داخل بيئة الاختبار فقط. لا تغيير في بيانات الأعمال/عضويات/جلسات Auth القائمة؛ لا إبطال لجميع جلسات المستخدمين. اترك evidence audit المحدود ولا تحذف جداول قبل حصر الاشتراكات وإخطار المالك بنطاق أثر الإبطال. المفاتيح تبقى في مخزنها الآمن إلى انتهاء خطة الاحتفاظ/الإلغاء؛ لا تدّعِ أن تدويرها يسحب رسالة vendor قُدمت سابقًا. كل down SQL يُراجع قبل التنفيذ، مع نسخة مشفرة من جداول Push الجديدة فقط إن كان حفظها مطلوبًا. لا نسخ أسرارها إلى Git أو نسخ احتياطي قانوني عام.

## مصادر التحقق

- مصدر PR #55: `src/lib/api/workspace.ts`, `src/lib/api/platform.ts`, `src/lib/supabase/server.ts`, RLS للمهمة/الجلسة وprivate.can_access_matter في migrations الحالية. مخطط الاستحقاق أعلاه اقتراح جديد؛ لم يتغير أي helper قائم.
- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions): راجع في 26 نوفمبر 2026؛ JWT قصير العمر وsession_id لا يغنيان عن التحقق من صلاحية الجلسة الفعلية، ولا تكفي session row وحدها عند وجود حدود.
- [WebKit iOS Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/): راجع في 26 نوفمبر 2026؛ Home Screen وuser gesture للطلب، وإعدادات Focus قد تؤثر في العرض.
