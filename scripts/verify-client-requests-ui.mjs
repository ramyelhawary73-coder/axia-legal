import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const modulePath = process.env.AXIA_BROWSER_MODULE;
if (!modulePath) throw new Error("Set AXIA_BROWSER_MODULE to the isolated Playwright entry point");
const { chromium } = await import(pathToFileURL(modulePath).href);
const base = "http://127.0.0.1:3187", api = "/api/client-requests";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3187", "-H", "127.0.0.1"], {
  stdio: "ignore",
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    AXIA_CLIENT_REQUESTS_ENABLED: "0", AXIA_PLATFORM_CONTROL_ENABLED: "0", AXIA_CONTROL_CENTER_ENABLED: "0" },
});
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const office = id(301), client = id(401), matter = id(501), member = id(1), requestId = id(701);
const title = "طلب مراجعة عقد — مثال تجريبي";
const stamp = "2026-11-07T17:00:00.000Z";
const synthetic = { id: requestId, title, summary: "مراجعة البنود قبل موعد المتابعة.", client_id: client, matter_id: matter, assigned_to: member,
  follow_up_on: "2026-11-12", status: "new", revision: 1, archived: false, created_at: stamp, updated_at: stamp };
let browser;
try {
  let ready = false;
  for (let i = 0; i < 40 && server.exitCode === null; i++) {
    try { ready = (await fetch(base)).ok; } catch {}
    if (ready) break;
    await delay(300);
  }
  assert.ok(ready, "Compiled loopback app did not start");
  for (const method of ["GET", "POST"]) {
    const response = await fetch(base + api, { method });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "CLIENT_REQUESTS_DISABLED");
  }
  console.log("PASS compiled GET and POST are disabled before database access");

  browser = await chromium.launch({ headless: true });
  for (const [width, height, theme] of [[1440, 900, "dark"], [320, 640, "light"]]) {
    const mobile = width < 1024, context = await browser.newContext({ viewport: { width, height }, colorScheme: theme, locale: "ar-EG" });
    await context.addInitScript(t => localStorage.setItem("theme", t), theme);
    let row = mobile ? { ...synthetic } : null;
    const changes = [];
    let simulateConflict = false;
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) return route.abort();
      if (!url.pathname.startsWith("/api/")) return route.continue();
      let data = {}, status = 200;
      if (url.pathname === api) {
        if (route.request().method() === "POST") {
          const body = route.request().postDataJSON();
          assert.equal(body.officeId, office);
          if (simulateConflict) { simulateConflict = false; status = 409; data = { error: "الطلب اتغيّر. راجع النسخة الحالية." }; }
          else {
            changes.push(body.action);
            if (body.action === "create") {
              assert.equal(body.input.client_id, client);
              assert.equal(body.input.matter_id, matter);
              row = { ...synthetic, ...body.input };
              status = 201;
            } else {
              assert.equal(body.id, row.id); assert.equal(body.revision, row.revision);
              row = { ...row, ...body.input, revision: row.revision + 1,
                archived: body.action === "archive" ? true : body.action === "restore" ? false : row.archived };
            }
            data = { row };
          }
        } else if (url.searchParams.has("history")) {
          assert.equal(url.searchParams.get("history"), requestId);
          data = { events: [{ id: id(801), action: "client_request.restored", actor: "محامي الاختبار", created_at: stamp, metadata: { revision: row.revision, changed_fields: ["archived"] } }], hasMore: false };
        } else {
          data = { enabled: true, canWrite: !mobile, officeId: office, assignees: mobile ? [] : [{ id: member, name: "محامي الاختبار" }],
            rows: row && row.archived === (url.searchParams.get("archived") === "1") ? [row] : [], hasMore: false };
        }
      }
      if (url.pathname === "/api/clients") data = { clients: [{ id: client, name: "موكل تجريبي", type: "individual" }] };
      if (url.pathname === "/api/matters") data = { matters: [{ id: matter, clientId: client, title: "قضية تجريبية", caseNumber: "DEMO-01", status: "مفتوحة" }], clients: [] };
      if (url.pathname === "/api/hearings") data = { hearings: [] };
      if (url.pathname === "/api/documents") data = { documents: [] };
      if (url.pathname === "/api/tasks") data = { organizationId: office, userId: member, assigneeLabel: "محامي الاختبار", canReassign: false, matters: [], assignees: [], tasks: [] };
      if (url.pathname === "/api/platform/context") { status = 503; data = { code: "PLATFORM_DISABLED" }; }
      return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    });
    const page = await context.newPage(), errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    const button = name => page.getByRole("button", { name, exact: true });
    if (mobile) await button("فتح قائمة التنقل").click();
    await button("طلبات الموكلين").click();
    await page.getByRole("heading", { name: "طلبات الموكلين والمتابعات" }).waitFor();
    if (!mobile) {
      await button("طلب جديد").click();
      await page.getByLabel("عنوان الطلب", { exact: true }).fill(title);
      await page.getByLabel("الموكل", { exact: true }).selectOption(client);
      await page.getByLabel("القضية المرتبطة", { exact: true }).selectOption(matter);
      await page.getByLabel("المسؤول عن المتابعة", { exact: true }).selectOption(member);
      await page.getByLabel("موعد المتابعة", { exact: true }).fill("2026-11-12");
      await page.getByLabel("تفاصيل المتابعة", { exact: true }).fill(synthetic.summary);
      await button("حفظ الطلب").click();
      await page.getByRole("heading", { name: title, exact: true }).waitFor();
      await button("تعديل").click();
      const notes = page.getByLabel("تفاصيل المتابعة", { exact: true });
      await notes.fill("تحديث تجريبي محفوظ في النموذج");
      simulateConflict = true;
      await button("حفظ الطلب").click();
      await page.getByRole("alert").filter({ hasText: "الطلب اتغيّر" }).waitFor();
      assert.equal(await notes.inputValue(), "تحديث تجريبي محفوظ في النموذج");
      await button("إلغاء").click();
      await button("أرشفة").click();
      await page.getByText("تمت الأرشفة. الطلب متاح في الأرشيف.", { exact: true }).waitFor();
      await button("الأرشيف").click();
      await button("استرجاع").click();
      await page.getByText("تم استرجاع الطلب إلى القائمة الحالية.", { exact: true }).waitFor();
      await button("الطلبات الحالية").click();
      await button("السجل").click();
      await page.getByText("استرجاع الطلب", { exact: true }).waitFor();
      assert.deepEqual(changes, ["create", "archive", "restore"]);
    } else {
      await page.getByRole("heading", { name: title, exact: true }).waitFor();
      for (const name of ["طلب جديد", "تعديل", "أرشفة", "استرجاع"]) assert.equal(await button(name).count(), 0);
      assert.deepEqual(changes, []);
    }
    const metrics = await page.locator("main").evaluate(element => ({ scroll: element.scrollWidth, width: element.clientWidth }));
    assert.ok(metrics.scroll <= metrics.width + 1, JSON.stringify(metrics));
    assert.deepEqual(errors, []);
    if (process.env.AXIA_REQUESTS_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.AXIA_REQUESTS_SCREENSHOT_DIR}/client-requests-${width}-${theme}.png` });
    console.log(`PASS ${width}px ${theme}: ${mobile ? "assigned read-only layout" : "create, conflict input preserved, archive, restore and history"}`);
    await context.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
