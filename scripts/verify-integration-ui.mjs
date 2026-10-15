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
async function fixtureContext(viewport,theme,{autoExport=false}={}) {
  const context=await browser.newContext({viewport,colorScheme:theme,locale:"ar-EG",acceptDownloads:true});
  await context.addInitScript(({theme,autoExport})=>{
    localStorage.setItem("theme",theme);
    localStorage.setItem("axia_daily_snapshot_config",JSON.stringify({enabled:autoExport,autoDownloadOnAppOpen:autoExport,format:"json",destination:"download_folder"}));
  },{theme,autoExport});
  let invitations=[];
  let assignedTo=owner;
  const mutations=[];
  await context.route("**/*",async route=>{
    const request=route.request(),url=new URL(request.url());
    if(!["127.0.0.1","localhost"].includes(url.hostname)) return route.abort();
    if(!url.pathname.startsWith("/api/")) return route.continue();
    let data={};
    if(url.pathname==="/api/clients") data={clients:[]};
    if(url.pathname==="/api/matters") data={matters:[],clients:[]};
    if(url.pathname==="/api/hearings") data={hearings:[]};
    if(url.pathname==="/api/documents") data={documents:[]};
    if(url.pathname==="/api/team") data={members:[],capabilities:{inviteMember:false,changeRole:false,removeMember:false}};
    if(url.pathname==="/api/tasks") data={organizationId:"office-test",userId:owner,assigneeLabel:"مالك الاختبار",canReassign:true,
      matters:[],assignees:[{id:owner,name:"مالك الاختبار",matterIds:[]},{id:employee,name:"موظف الاختبار",matterIds:[]}],
      tasks:[{id:taskId,title:"مهمة اختبار",category:"قلم المحضرين",courtOrBailiffOffice:"مكتب اختبار",assignedToUserId:assignedTo,assignedTo:assignedTo===owner?"مالك الاختبار":"موظف الاختبار",deadline:"2030-10-20",priority:"عادية",status:"قيد التنفيذ"}]};
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
    if(url.pathname==="/api/staff-invitations/accept") data=request.method()==="GET"?
      {authenticated:true,email:"employee@example.invalid",confirmed:true}:{accepted:true,organizationId:"office-test"};
    await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(data)});
  });
  return {context,mutations};
}
async function fits(page,label) {
  const metrics=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
  assert.ok(metrics.document<=metrics.viewport+1,`${label}: horizontal overflow ${JSON.stringify(metrics)}`);
  records.push({label,...metrics});
}
async function nav(page,name) {
  const mobile=page.getByRole("button",{name:"فتح قائمة التنقل",exact:true});
  if(await mobile.isVisible()) await mobile.click();
  await page.getByRole("button",{name:new RegExp(name)}).click();
}
try {
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
  for(const width of [1440,390]) for(const theme of ["light","dark"]) {
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
  await fs.writeFile(path.join(output,"report.json"),JSON.stringify({mode:"loopback UI contracts with synthetic API responses; not real Auth or email",checks:records},null,2));
  console.log(JSON.stringify({checks:records.length,output,records}));
} finally {await browser.close();}
