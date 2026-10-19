import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// UI contracts use synthetic responses on loopback only. They are not real Auth/SMTP acceptance.
const modulePath=process.env.AXIA_BROWSER_MODULE;
if(!modulePath) throw new Error("Set AXIA_BROWSER_MODULE to the isolated Playwright entry point.");
const base=process.env.AXIA_UI_BASE_URL ?? "http://127.0.0.1:3101";
assert.ok(["localhost","127.0.0.1"].includes(new URL(base).hostname),"UI fixtures must never target a live site");
const {chromium}=await import(pathToFileURL(modulePath).href);
const browser=await chromium.launch({headless:true});
const output=process.env.AXIA_UI_OUTPUT ?? "/tmp/axia-integration-ui";
await fs.mkdir(output,{recursive:true});
const owner="00000000-0000-4000-8000-000000000001";
const employee="00000000-0000-4000-8000-000000000002";
const taskId="00000000-0000-4000-8000-000000000101";
const inviteId="00000000-0000-4000-8000-000000000201";
const records=[];
async function fixtureContext(viewport,theme,{autoExport=false,registrationFlow=false,registrationEnabled=registrationFlow,platformMode=null,platformNoOffice=false}={}) {
  const context=await browser.newContext({viewport,colorScheme:theme,locale:"ar-EG",acceptDownloads:true});
  await context.addInitScript(({theme,autoExport})=>{
    localStorage.setItem("theme",theme);
    localStorage.setItem("axia_daily_snapshot_config",JSON.stringify({enabled:autoExport,autoDownloadOnAppOpen:autoExport,format:"json",destination:"download_folder"}));
  },{theme,autoExport});
  let invitations=[];
  let assignedTo=owner;
  const mutations=[];
  const registrationRequests=[];
  const events={accepted:0};
  let platformState=platformMode;
  const platformRequests=[];
  let staffConfirmed=!registrationFlow;
  await context.route("**/*",async route=>{
    const request=route.request(),url=new URL(request.url());
    if(!["127.0.0.1","localhost"].includes(url.hostname)) return route.abort();
    if(registrationFlow && url.pathname==="/auth/confirm") {
      staffConfirmed=true;
      return route.fulfill({status:303,headers:{location:"/invitations/accept?confirmation=success"},body:""});
    }
    if(!url.pathname.startsWith("/api/")) return route.continue();
    let data={},status=200;
    if(url.pathname==="/api/clients") data={clients:[]};
    if(url.pathname==="/api/matters") data={matters:[],clients:[]};
    if(url.pathname==="/api/hearings") data={hearings:[]};
    if(url.pathname==="/api/documents") data={documents:[]};
    if(url.pathname==="/api/team") data={members:[],capabilities:{inviteMember:false,changeRole:false,removeMember:false}};
    if(url.pathname==="/api/tasks") data={organizationId:"office-test",userId:owner,assigneeLabel:"مالك الاختبار",canReassign:true,
      matters:[],assignees:[{id:owner,name:"مالك الاختبار",matterIds:[]},{id:employee,name:"موظف الاختبار",matterIds:[]}],
      tasks:[{id:taskId,title:"مهمة اختبار",category:"قلم المحضرين",courtOrBailiffOffice:"مكتب اختبار",assignedToUserId:assignedTo,assignedTo:assignedTo===owner?"مالك الاختبار":"موظف الاختبار",deadline:"2030-10-20",priority:"عادية",status:"قيد التنفيذ"}]};
    if(url.pathname==="/api/tasks" && platformNoOffice) {status=409;data={code:"WORKSPACE_MISSING",error:"لا توجد مؤسسة مرتبطة بهذا الحساب."};}
    if(url.pathname==="/api/platform/context") {
      status=platformState==="forbidden"?403:platformState==="missing"?503:platformState?200:503;
      data=platformState==="ready"||platformState==="mfa_required"?{state:platformState}:{code:platformState==="forbidden"?"PLATFORM_FORBIDDEN":platformState==="missing"?"PLATFORM_UNAVAILABLE":"PLATFORM_DISABLED"};
    }
    if(url.pathname==="/api/platform/offices") data={items:[{id:owner,name:"مكتب تجربة وهمي",slug:"synthetic-office",createdAt:"2026-01-01"}],nextCursor:null};
    if(url.pathname==="/api/platform/audit") data={items:[{id:inviteId,actorId:null,actorType:"operator",subjectId:owner,action:"platform.owner.bootstrap",createdAt:"2026-01-01"}],nextCursor:null};
    if(url.pathname==="/api/platform/mfa") {
      if(request.method()==="GET") data={factors:[]};
      else {
        const body=request.postDataJSON();platformRequests.push(body);
        if(body.action==="enroll") data={factorId:inviteId,qrCode:"data:image/svg+xml;utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" fill="white"/></svg>')};
        else if(body.code==="123456") {platformState="ready";data={verified:true};}
        else {status=503;data={code:"MFA_UNAVAILABLE"};}
      }
    }
    if(url.pathname==="/api/library") data={documents:[{id:"reviewed-test",title:"مصدر اختبار مراجَع",version:"١",court:"محكمة الاختبار",legalArea:"مدني",sourceUrl:"https://example.invalid/legal",publicationDate:"2026-01-01",reviewedAt:"2026-10-15T10:00:00Z"}],truncated:false};
    if(url.pathname==="/api/staff-invitations") {
      if(request.method()==="POST") {
        const body=request.postDataJSON();mutations.push(body);
        if(body.action==="create") invitations=[{id:inviteId,email_normalized:body.email,role:body.role,status:"pending",expires_at:"2030-10-22T10:00:00Z",created_at:"2026-10-15T10:00:00Z"}];
        data={id:inviteId,invitationPath:"/invitations/accept#token="+"b".repeat(64),delivery:"not_sent"};
      } else data={enabled:true,canManage:true,canInviteAdmin:true,invitations};
    }
    if(url.pathname==="/api/tasks/assignment") {
      assignedTo=request.postDataJSON().assigneeId;
      data={taskId,assignedToUserId:assignedTo,assignedTo:"موظف الاختبار"};
    }
    if(url.pathname==="/api/staff-invitations/accept") {
      if(request.method()==="GET") {
        status=staffConfirmed?200:401;
        data={authenticated:staffConfirmed,email:"employee@example.invalid",confirmed:staffConfirmed,registrationEnabled};
      } else {
        assert.ok(staffConfirmed,"acceptance requires confirmed identity");
        events.accepted++;
        data={accepted:true,organizationId:"office-test"};
      }
    }
    if(url.pathname==="/api/staff-registration") {
      assert.ok(registrationEnabled,"disabled registration must never be submitted");
      registrationRequests.push(request.postDataJSON());
      data={status:"check_email"};status=202;
    }
    await route.fulfill({status,contentType:"application/json",body:JSON.stringify(data)});
  });
  return {context,mutations,registrationRequests,events,platformRequests};
}
async function fits(page,label) {
  const metrics=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
  assert.ok(metrics.document<=metrics.viewport+1,`${label}: horizontal overflow ${JSON.stringify(metrics)}`);
  for(const button of await page.locator("header button").all()) {
    if(!await button.isVisible()) continue;
    const box=await button.boundingBox();
    assert.ok(box && box.x>=-1 && box.x+box.width<=metrics.viewport+1,`${label}: clipped header control`);
  }
  records.push({label,...metrics});
}
async function nav(page,name) {
  const mobile=page.getByRole("button",{name:"فتح قائمة التنقل",exact:true});
  if(await mobile.isVisible()) await mobile.click();
  await page.getByRole("button",{name:new RegExp(name)}).click();
}
try {
  // Real compiled HTTP handlers, no response fixtures: activation is forced off by the runner.
  const disabledRegistration=await fetch(base+"/api/staff-registration",{method:"POST",headers:{Origin:base,"Content-Type":"application/json"},body:JSON.stringify({email:"fixture@example.invalid",password:"Fixture-password-2026",passwordConfirmation:"Fixture-password-2026"})});
  assert.equal(disabledRegistration.status,503,await disabledRegistration.text());
  const disabledConfirmation=await fetch(base+"/auth/confirm?code=fixture-only",{redirect:"manual"});
  assert.equal(disabledConfirmation.status,303);
  assert.match(disabledConfirmation.headers.get("location"),/\/invitations\/accept\?confirmation=unavailable$/);
  for(const endpoint of ["context","offices","audit","mfa"]) {
    const response=await fetch(base+"/api/platform/"+endpoint);
    assert.equal(response.status,503);assert.equal((await response.json()).code,"PLATFORM_DISABLED");
    assert.match(response.headers.get("cache-control"),/no-store/);assert.equal(response.headers.get("x-frame-options"),"DENY");
  }
  const disabledMfa=await fetch(base+"/api/platform/mfa",{method:"POST",headers:{Origin:base,"Content-Type":"application/json"},body:JSON.stringify({action:"enroll"})});
  assert.equal(disabledMfa.status,503);assert.equal((await disabledMfa.json()).code,"PLATFORM_DISABLED");
  for(const width of [1440,390,320]) for(const theme of ["light","dark"]) {
    console.log(`UI login ${width}px ${theme}`);
    const {context}=await fixtureContext({width,height:900},theme);
    const page=await context.newPage();
    page.setDefaultNavigationTimeout(90000);
    await page.goto(base+"/login");
    await page.getByRole("button",{name:/دخول|الدخول/}).first().waitFor();
    await fits(page,`login-${width}-${theme}`);
    await page.screenshot({path:path.join(output,`login-${width}-${theme}.png`),fullPage:true});
    await context.close();
  }
  for(const width of [1440,390,320]) for(const theme of ["light","dark"]) {
    console.log(`UI staff/task/acceptance ${width}px ${theme}`);
    const {context,mutations}=await fixtureContext({width,height:900},theme);
    const page=await context.newPage();const errors=[];
    page.setDefaultNavigationTimeout(90000);
    page.on("pageerror",error=>errors.push(error.message));
    page.on("console",message=>{
      if(message.type()==="error" && /hydrat/i.test(message.text())) errors.push(message.text());
    });
    await page.goto(base+"/");
    await nav(page,"فريق العمل والمتدربون");
    await page.getByRole("heading",{name:"دعوات الموظفين بالبريد",exact:true}).waitFor();
    await page.getByLabel("بريد الموظف",{exact:true}).fill("employee@example.invalid");
    await page.getByRole("button",{name:"إنشاء رابط دعوة",exact:true}).click();
    await page.getByText("تم إنشاء الرابط. لم يُرسل بريد إلكتروني.",{exact:true}).waitFor();
    assert.equal(mutations[0].email,"employee@example.invalid");
    await fits(page,`team-${width}-${theme}`);
    await page.screenshot({path:path.join(output,`team-${width}-${theme}.png`),fullPage:true});
    await nav(page,"المكتبة وأحكام النقض");
    await page.getByRole("heading",{name:"مصدر اختبار مراجَع",exact:true}).waitFor();
    await fits(page,`library-${width}-${theme}`);
    await nav(page,"قلم المحضرين والمهام");
    const assignee=page.getByRole("combobox",{name:"المسؤول عن مهمة مهمة اختبار",exact:true});
    await assignee.selectOption(employee);
    await page.getByRole("status").filter({hasText:"جارٍ الحفظ"}).waitFor({state:"hidden"});
    assert.equal(await assignee.inputValue(),employee);
    await fits(page,`tasks-${width}-${theme}`);
    await page.screenshot({path:path.join(output,`tasks-${width}-${theme}.png`),fullPage:true});
    assert.deepEqual(errors,[]);
    await page.goto(base+"/invitations/accept#token="+"a".repeat(64));
    await page.getByRole("button",{name:"قبول الدعوة",exact:true}).click();
    await page.getByText("تم قبول الدعوة. صلاحياتك مرتبطة بمكتبك والدور المحدد لك.",{exact:true}).waitFor();
    assert.equal(new URL(page.url()).hash,"");
    await fits(page,`accept-${width}-${theme}`);
    await context.close();
  }
  for(const width of [1440,390,320]) for(const theme of ["light","dark"]) {
    console.log(`UI employee registration ${width}px ${theme}`);
    const {context,registrationRequests,events}=await fixtureContext({width,height:900},theme,{registrationFlow:true});
    const page=await context.newPage();
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto(base+"/invitations/accept#token="+"a".repeat(64));
    await page.getByRole("button",{name:"ليس لدي حساب — إنشاء حساب",exact:true}).click();
    await page.getByLabel("البريد الإلكتروني",{exact:true}).fill("employee@example.invalid");
    await page.getByLabel("كلمة المرور",{exact:true}).fill("Test-fixture-only-2026");
    await page.getByLabel("تأكيد كلمة المرور",{exact:true}).fill("Test-fixture-only-2026");
    await fits(page,`signup-${width}-${theme}`);
    await page.screenshot({path:path.join(output,`signup-${width}-${theme}.png`),fullPage:true});
    await page.getByRole("button",{name:"إنشاء الحساب ومتابعة التأكيد",exact:true}).click();
    await page.getByRole("status").filter({hasText:"إذا كان التسجيل متاحًا"}).waitFor();
    assert.equal(registrationRequests.length,1);
    assert.deepEqual(Object.keys(registrationRequests[0]).sort(),["email","password","passwordConfirmation"]);
    assert.equal(events.accepted,0);
    assert.equal(new URL(page.url()).hash,"");
    const stored=await page.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]));
    assert.ok(!stored.includes("a".repeat(64)),"staff token must not persist in browser storage");
    await fits(page,`signup-pending-${width}-${theme}`);
    await page.goto(base+"/auth/confirm?code=fixture-only");
    await page.getByRole("status").filter({hasText:"تم تأكيد بريدك"}).waitFor();
    assert.equal(await page.getByRole("button",{name:"قبول الدعوة",exact:true}).count(),0);
    assert.equal(events.accepted,0,"confirmation alone cannot create membership");
    assert.equal(new URL(page.url()).search,"");
    await fits(page,`confirmation-${width}-${theme}`);
    await page.goto(base+"/invitations/accept#token="+"a".repeat(64));
    await page.getByRole("button",{name:"قبول الدعوة",exact:true}).click();
    await page.getByText("تم قبول الدعوة. صلاحياتك مرتبطة بمكتبك والدور المحدد لك.",{exact:true}).waitFor();
    assert.equal(events.accepted,1);
    await fits(page,`new-employee-accepted-${width}-${theme}`);
    assert.deepEqual(errors,[]);
    await context.close();
  }
  {
    const {context,registrationRequests}=await fixtureContext({width:390,height:900},"light",{registrationFlow:true,registrationEnabled:false});
    const page=await context.newPage();await page.goto(base+"/invitations/accept#token="+"a".repeat(64));
    await page.getByRole("button",{name:"تسجيل الدخول للمتابعة",exact:true}).waitFor();
    assert.equal(await page.getByRole("button",{name:"ليس لدي حساب — إنشاء حساب",exact:true}).count(),0);
    assert.equal(registrationRequests.length,0);
    await fits(page,"registration-disabled-390-light");await context.close();
  }
  for(const width of [1440,390,320]) for(const theme of ["light","dark"]) {
    console.log(`UI platform ${width}px ${theme}`);
    const {context}=await fixtureContext({width,height:900},theme,{platformMode:"ready",platformNoOffice:true});
    const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto(base+"/");
    await page.getByRole("button",{name:"قائمة الحساب والمكتب",exact:true}).click();
    await page.getByRole("link",{name:"إدارة المنصة",exact:true}).click();
    await page.waitForURL(base+"/platform");
    assert.equal(new URL(page.url()).pathname,"/platform");
    await page.getByRole("heading",{name:"مكتب تجربة وهمي",exact:true}).waitFor();
    await fits(page,`platform-offices-${width}-${theme}`);
    await page.screenshot({path:path.join(output,`platform-offices-${width}-${theme}.png`),fullPage:true});
    await page.getByRole("button",{name:"سجل إدارة المنصة",exact:true}).click();
    await page.getByRole("heading",{name:"platform.owner.bootstrap",exact:true}).waitFor();
    await fits(page,`platform-audit-${width}-${theme}`);assert.deepEqual(errors,[]);await context.close();

    const mfa=await fixtureContext({width,height:900},theme,{platformMode:"mfa_required"});
    const mfaPage=await mfa.context.newPage();await mfaPage.goto(base+"/platform");
    await mfaPage.getByRole("button",{name:"ربط تطبيق المصادقة",exact:true}).waitFor();
    await fits(mfaPage,`platform-mfa-${width}-${theme}`);
    // Capture only the initial state. Never capture/log an enrollment QR or seed.
    await mfaPage.screenshot({path:path.join(output,`platform-mfa-${width}-${theme}.png`),fullPage:true});
    await mfaPage.getByRole("button",{name:"ربط تطبيق المصادقة",exact:true}).click();
    await mfaPage.getByLabel("رمز تطبيق المصادقة",{exact:true}).fill("000000");
    await mfaPage.getByRole("button",{name:"تأكيد الرمز",exact:true}).click();
    await mfaPage.getByRole("alert").waitFor();
    await mfaPage.getByLabel("رمز تطبيق المصادقة",{exact:true}).fill("123456");
    await mfaPage.getByRole("button",{name:"تأكيد الرمز",exact:true}).click();
    await mfaPage.getByRole("heading",{name:"مكتب تجربة وهمي",exact:true}).waitFor();
    assert.deepEqual(mfa.platformRequests.map(x=>x.action),["enroll","verify","verify"]);
    const stored=await mfaPage.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]));
    assert.ok(!stored.includes("data:image")&&!stored.includes(inviteId),"MFA seed/factor data must not persist");
    await fits(mfaPage,`platform-verified-${width}-${theme}`);await mfa.context.close();
  }
  for(const platformMode of [null,"forbidden","missing"]) {
    const {context}=await fixtureContext({width:320,height:900},"light",{platformMode});
    const page=await context.newPage();await page.goto(base+"/platform");
    await page.getByRole("heading",{name:platformMode?"الوصول إلى إدارة المنصة غير متاح":"إدارة المنصة غير مفعلة",exact:true}).waitFor();
    assert.equal(await page.getByRole("button",{name:"ربط تطبيق المصادقة",exact:true}).count(),0);
    await fits(page,`platform-unavailable-${platformMode??"disabled"}`);await context.close();
  }
  await fs.writeFile(path.join(output,"report.json"),JSON.stringify({mode:"loopback UI contracts with synthetic API responses; not real Auth, MFA or email",compiledHttpSafetyChecks:7,checks:records},null,2));
  console.log(JSON.stringify({checks:records.length,output,records}));
} finally {await browser.close();}
