import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const uid="00000000-0000-4000-8000-000000000001",fid="00000000-0000-4000-8000-000000000201";
const origin="https://axia.example";
const env={AXIA_PLATFORM_CONTROL_ENABLED:"1",AXIA_PLATFORM_CONTROL_ORIGIN:origin};
function load(path,modules={},vars={},warnings=[]) {
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
    exports,URL,Response,TextDecoder,process:{env:vars},console:{warn:(...a)=>warnings.push(a)},require(name){if(name in modules)return modules[name];if(name==="next/server") return {NextResponse:{json:(body,init)=>Response.json(body,init)}};throw new Error(`Unexpected module ${name}`);},
  });
  return exports;
}
const domain=vars=>load("src/lib/platform-control.ts",{},vars);
function harness(options={}) {
  const calls=[],warnings=[]; let state=options.state??"ready";let userCalls=0;
  const user={id:uid,email_confirmed_at:"2026-01-01",is_anonymous:false,...options.user};
  const client={auth:{
    updateUser:async args=>{calls.push(["updateUser",args]);if(options.passwordThrow)throw new Error("private-provider-detail");return {data:{user:{id:options.passwordUser??uid,private:"private-provider-detail"}},error:options.passwordError??null};},
    reauthenticate:async()=>{calls.push(["reauthenticate"]);return {error:options.passwordError??null};},
    getUser:async()=>{calls.push("getUser");userCalls++;return {data:{user:options.noUser?null:options.switchUser&&userCalls>1?{...user,id:fid}:user},error:options.userError??null};},mfa:{
    listFactors:async()=>{calls.push("listFactors");return {data:{all:options.factors??[]},error:options.factorError??null};},
    enroll:async args=>{calls.push(["enroll",args]);return {data:{id:fid,type:"totp",totp:{qr_code:"data:image/svg+xml;utf-8,<svg/>",secret:"synthetic-private-seed"}},error:options.enrollError??null};},
    challengeAndVerify:async args=>{calls.push(["verify",args]);state=options.afterVerify??"ready";return {data:{access_token:"synthetic-private-token"},error:options.verifyError??null};},
  }},rpc:async(name,args)=>{
    calls.push([name,args]);
    if(name==="axia_platform_context") return {data:{version:options.version??1,state,userId:options.rpcUser??uid},error:options.rpcError??null};
    return {data:options.readData??{items:[],nextCursor:null},error:options.readError??null};
  }};
  const helpers=domain(options.enabled===false?{}:env);
  const api=load("src/lib/api/platform.ts",{
    "@/lib/supabase/server":{createClient:async()=>{calls.push("createClient");return client;}},
    "@/lib/supabase/config":{getSupabasePublicConfig:()=>options.configured===false?null:{}},
    "@/lib/platform-control":helpers,
  },env,warnings);
  const modules={"@/lib/api/platform":api,"@/lib/platform-control":helpers};
  const mfa=load("src/app/api/platform/mfa/route.ts",modules,env,warnings);
  const context=load("src/app/api/platform/context/route.ts",modules,env,warnings);
  const password=load("src/app/api/platform/password/route.ts",modules,env,warnings);
  return {api,mfa,context,password,calls,warnings};
}
const req=(body={action:"verify",factorId:fid,code:"123456"},options={})=>new Request(origin+"/api/platform/mfa",{method:"POST",headers:{Origin:options.origin??origin,"Content-Type":"application/json",...options.headers},body:options.raw??JSON.stringify(body)});
const factors=[{id:fid,status:"verified",factor_type:"totp",phone:"must-not-return"}];

test("platform defaults disabled and requires an exact reviewed HTTPS origin",()=>{
  assert.equal(domain({}).getPlatformControlConfig(),null);
  for(const value of ["http://axia.example","https://u:p@axia.example","https://axia.example/path","https://axia.example?x=1","https://axia.example#x",""])
    assert.equal(domain({...env,AXIA_PLATFORM_CONTROL_ORIGIN:value}).getPlatformControlConfig(),null);
  assert.equal(domain(env).getPlatformControlConfig().origin,origin);
});
test("disabled/unconfigured platform never instantiates real or mock Auth clients",async()=>{
  for(const options of [{enabled:false},{configured:false}]) {const h=harness(options);assert.equal((await h.context.GET()).status,503);assert.equal(h.calls.length,0);}
});
test("fresh identity errors, absent and unconfirmed/anonymous users fail closed",async()=>{
  for(const [options,status] of [[{noUser:true},401],[{userError:{name:"AuthSessionMissingError"},noUser:true},401],[{userError:{name:"ProviderPrivateError"}},503],[{user:{email_confirmed_at:null}},403],[{user:{is_anonymous:true}},403]]) {
    const h=harness(options),r=await h.context.GET();assert.equal(r.status,status);assert.equal(h.calls.some(c=>Array.isArray(c)),false);
  }
});
test("missing migration, foreign RPC identity and unknown context cannot grant root",async()=>{
  for(const [options,status] of [[{rpcError:{code:"PGRST202",message:"private SQL provider details"}},503],[{version:0},503],[{rpcUser:fid},403],[{state:"forbidden"},403],[{state:"arbitrary-role"},403]]) {
    const h=harness(options),r=await h.context.GET();assert.equal(r.status,status);assert.doesNotMatch(await r.text(),/private SQL|provider details/);
  }
});
test("known root can see MFA entry but cannot read offices before AAL2",async()=>{
  const h=harness({state:"mfa_required"});assert.deepEqual(await(await h.context.GET()).json(),{state:"mfa_required"});
  assert.equal((await h.api.platformRead(new Request(origin+"/api/platform/offices"),"offices")).status,403);
  assert.equal(h.calls.some(c=>Array.isArray(c)&&c[0]==="axia_platform_offices"),false);
});
test("platform pagination rejects duplicates, invalid bounds and client-controlled selectors",async()=>{
  for(const query of ["?limit=0","?limit=51","?limit=1&limit=2","?after=bad","?after=","?role=platform_owner","?organizationId=other","?limit=20.0"]){const h=harness();assert.equal((await h.api.platformRead(new Request(origin+"/api/platform/offices"+query),"offices")).status,400);assert.equal(h.calls.some(c=>Array.isArray(c)&&c[0]==="axia_platform_offices"),false);}
});
test("offices response is projected to non-legal allowlisted fields",async()=>{
  const item={id:fid,name:"مكتب اختبار",slug:"fixture",createdAt:"2026-01-01",privateLegalContent:"must-not-return",email:"must-not-return"};
  const h=harness({readData:{items:[item],nextCursor:null}});const r=await h.api.platformRead(new Request(origin+"/api/platform/offices?limit=2"),"offices");
  assert.equal(r.status,200);const data=await r.json();assert.deepEqual(Object.keys(data.items[0]).sort(),["createdAt","id","name","slug"]);assert.doesNotMatch(JSON.stringify(data),/must-not-return/);
  const call=h.calls.find(c=>Array.isArray(c)&&c[0]==="axia_platform_offices");assert.deepEqual(JSON.parse(JSON.stringify(call[1])),{p_limit:2,p_after_id:null});
});
test("malformed read data and SQL errors are sanitized without stale authorization",async()=>{
  for(const [options,status] of [[{readData:{items:[{}],nextCursor:null}},503],[{readData:{items:[],nextCursor:"bad"}},503],[{readError:{code:"42501",message:"private"}},403],[{readError:{code:"22023"}},400],[{readError:{message:"PLATFORM_RATE_LIMIT"}},429],[{readError:{message:"private SQL table"}},503]]) {
    const h=harness(options),r=await h.api.platformRead(new Request(origin+"/api/platform/audit"),"audit");assert.equal(r.status,status);assert.doesNotMatch(await r.text(),/SQL table/);
  }
});
test("MFA mutations reject cross-origin requests before identity/provider calls",async()=>{
  for(const origin of ["https://attacker.example","null",""]){const h=harness();assert.equal((await h.mfa.POST(req(undefined,{origin}))).status,403);assert.equal(h.calls.length,0);}
});
test("bounded MFA JSON refuses oversized streams, invalid actions and credential shapes",async()=>{
  for(const request of [req(undefined,{raw:" ".repeat(4097)}),req(undefined,{raw:"{}",headers:{"Content-Length":"9999"}}),req(undefined,{raw:"{"}),req(undefined,{headers:{"Content-Type":"text/plain"}}),req({action:"delete"}),req({action:"verify",factorId:fid,code:"12345"}),req({action:"verify",factorId:"bad",code:"123456"}),req({action:"enroll",role:"platform_owner"})]){
    const h=harness();assert.equal((await h.mfa.POST(request)).status,400);assert.equal(h.calls.length,0);
  }
});
test("MFA factor list returns only own TOTP ID/status and never secrets or phone data",async()=>{
  const h=harness({state:"mfa_required",factors:[...factors,{id:uid,status:"verified",factor_type:"phone",phone:"private-phone"}]});const r=await h.mfa.GET();
  assert.deepEqual(await r.json(),{factors:[{id:fid,status:"verified"}]});assert.equal(h.calls.some(c=>Array.isArray(c)&&["enroll","verify"].includes(c[0])),false);
});
test("MFA enrollment is explicit and uses the ordinary same-session SSR client only",async()=>{
  const h=harness({state:"mfa_required"});const r=await h.mfa.POST(req({action:"enroll"}));assert.equal(r.status,200);
  const body=await r.json();assert.deepEqual(Object.keys(body).sort(),["factorId","qrCode"]);assert.equal(body.factorId,fid);assert.equal(JSON.stringify(h.warnings).includes("synthetic-private-seed"),false);
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls.find(c=>Array.isArray(c)&&c[0]==="enroll")[1])),{factorType:"totp",friendlyName:"AXIA Platform"});
});
test("existing verified or pending factors are not silently replaced or deleted",async()=>{
  for(const status of ["verified","unverified"]){const h=harness({factors:[{...factors[0],status}]});assert.equal((await h.mfa.POST(req({action:"enroll"}))).status,409);assert.equal(h.calls.some(c=>Array.isArray(c)&&c[0]==="enroll"),false);}
});
test("MFA verification cannot target another factor or grant authority from the response",async()=>{
  const other=harness({factors:[]});assert.equal((await other.mfa.POST(req())).status,403);assert.equal(other.calls.some(c=>Array.isArray(c)&&c[0]==="verify"),false);
  const h=harness({state:"mfa_required",factors});const r=await h.mfa.POST(req());assert.equal(r.status,200);assert.deepEqual(await r.json(),{verified:true});
  assert.equal(h.calls.filter(c=>c==="getUser").length,2);assert.equal(h.calls.filter(c=>Array.isArray(c)&&c[0]==="axia_platform_context").length,2);
});
test("post-MFA revocation or account switching is denied; provider details are private",async()=>{
  for(const options of [{afterVerify:"forbidden"},{switchUser:true},{verifyError:{message:"private-provider",status:400}}]){const h=harness({state:"mfa_required",factors,...options});const r=await h.mfa.POST(req());assert.ok([403,503].includes(r.status));assert.doesNotMatch(await r.text(),/private-provider|synthetic-private-token/);}
});
test("MFA and authorization responses cannot be cached or embedded",async()=>{
  for(const r of [await harness().context.GET(),await harness({factors}).mfa.GET(),await harness({enabled:false}).context.GET()]) {
    assert.equal(r.headers.get("cache-control"),"private, no-store");assert.equal(r.headers.get("referrer-policy"),"no-referrer");assert.equal(r.headers.get("x-frame-options"),"DENY");assert.equal(r.headers.get("vary"),"Cookie");
  }
});
test("proxy preserves JSON platform API handling without opening the platform page or neighboring routes",async()=>{
  const response=(status=200,location)=>{const r=new Response(null,{status,headers:location?{Location:String(location)}:{}});r.cookies={set(){},getAll:()=>[]};return r;};
  const proxy=load("src/lib/supabase/proxy.ts",{
    "next/server":{NextResponse:{next:()=>response(),redirect:url=>response(303,url)}},
    "@supabase/ssr":{createServerClient:()=>({auth:{getClaims:async()=>({data:{claims:null},error:null})}})},
    "@/lib/supabase/config":{getSupabasePublicConfig:()=>({url:origin,publishableKey:"fixture"})},
  });
  const request=path=>({nextUrl:{pathname:path,clone:()=>new URL(origin+path)},cookies:{getAll:()=>[],set(){}}});
  assert.equal((await proxy.updateSession(request("/api/platform/context"))).status,200);
  for(const path of ["/platform","/platform/extra","/api/platform-lookalike"])
    assert.equal(new URL((await proxy.updateSession(request(path))).headers.get("Location")).pathname,"/login");
});

const jsxRuntime={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
function homeEntry(h) {
  return load("src/app/page.tsx",{
    "react/jsx-runtime":jsxRuntime,
    "next/navigation":{redirect:path=>{throw new Error(`REDIRECT:${path}`);}},
    "@/components/office-workspace":{default:"OwnOfficeWorkspace"},
    "@/lib/api/platform":h.api,
  }).default;
}
test("home sends a verified Platform Owner directly to platform before loading any office",async()=>{
  for(const state of ["ready","mfa_required"]){
    const h=harness({state});
    await assert.rejects(homeEntry(h)({searchParams:Promise.resolve({})}),/REDIRECT:\/platform/);
    assert.equal(h.calls.filter(c=>c==="getUser").length,1);
    assert.equal(h.calls.filter(c=>Array.isArray(c)&&c[0]==="axia_platform_context").length,1);
  }
});
test("home never derives platform navigation from email, claims, disabled config or provider failure",async()=>{
  for(const options of [{state:"forbidden",user:{email:"developer@example.invalid"}},{enabled:false},{noUser:true},{rpcError:{message:"provider-private"}},{rpcUser:fid},{user:{email_confirmed_at:null}}]){
    const h=harness(options),result=await homeEntry(h)({searchParams:Promise.resolve({})});
    assert.equal(result.type,"OwnOfficeWorkspace");
  }
});
test("explicit office navigation is a local display choice without office IDs or a role grant",async()=>{
  const h=harness();
  const result=await homeEntry(h)({searchParams:Promise.resolve({workspace:"1",organizationId:fid,next:"https://attacker.example"})});
  assert.equal(result.type,"OwnOfficeWorkspace");assert.equal(h.calls.length,0);
  assert.deepEqual(Object.keys(result.props),[]);
  for(const workspace of ["0","true",["1","1"]]){
    await assert.rejects(homeEntry(h)({searchParams:Promise.resolve({workspace})}),/REDIRECT:\/platform/);
  }
});
function elementList(node) {
  if(!node||typeof node!=="object") return [];
  if(Array.isArray(node)) return node.flatMap(elementList);
  return [node,...elementList(node.props?.children)];
}
test("platform header exposes only a valid own-office link and explicit existing logout action",async()=>{
  for(const access of [{ok:true},{ok:false,code:"WORKSPACE_MISSING"},{ok:false,code:"WORKSPACE_SUSPENDED"},"unavailable"]){
    const h=harness();let workspaceCalls=0;const logout=()=>{throw new Error("logout must not run during render");};
    const page=load("src/app/platform/page.tsx",{
      "react/jsx-runtime":jsxRuntime,"next/link":{default:"Link"},
      "lucide-react":{ShieldCheck:"Shield",ArrowUpRight:"Arrow",LogOut:"LogoutIcon"},
      "@/components/platform-theme-toggle":{PlatformThemeToggle:"Theme"},
      "@/components/platform-workspace.module.css":{default:{}},
      "@/lib/api/platform":h.api,"@/components/platform-entry":{PlatformEntry:"PlatformEntry"},
      "@/lib/api/workspace":{resolveWorkspace:async()=>{workspaceCalls++;if(access==="unavailable")throw new Error("private provider error");return access;}},
      "@/app/login/actions":{logout},
    }).default;
    const nodes=elementList(await page());const links=nodes.filter(n=>n.type==="Link");
    assert.equal(workspaceCalls,1);assert.equal(links.length,access.ok?1:0);
    if(access.ok)assert.equal(links[0].props.href,"/?workspace=1");
    assert.equal(nodes.find(n=>n.type==="form").props.action,logout);
    assert.equal(nodes.find(n=>n.type==="PlatformEntry").props.initialState,"ready");
  }
});

const passwordBody={action:"update",password:"Synthetic-private-new-2026!",passwordConfirmation:"Synthetic-private-new-2026!"};
const passwordCalls=h=>h.calls.filter(c=>Array.isArray(c)&&["updateUser","reauthenticate"].includes(c[0]));
test("password mutation requires fresh same-identity root and AAL2",async()=>{
  for(const [options,status] of [[{enabled:false},503],[{configured:false},503],[{noUser:true},401],[{user:{email_confirmed_at:null}},403],[{rpcUser:fid},403],[{state:"forbidden"},403],[{state:"mfa_required"},403],[{rpcError:{message:"private-provider-detail"}},503]]){
    const h=harness(options),r=await h.password.POST(req(passwordBody));assert.equal(r.status,status);assert.deepEqual(passwordCalls(h),[]);assert.doesNotMatch(await r.text(),/private-provider-detail/);
  }
});
test("password rejects cross-origin, malformed, oversized and target/role injection before Auth",async()=>{
  const requests=[req(passwordBody,{origin:"https://foreign.example"}),req(passwordBody,{origin:""}),req(passwordBody,{raw:"{"}),req(passwordBody,{raw:" ".repeat(4097)}),req(passwordBody,{headers:{"Content-Type":"text/plain"}}),req({action:"reauthenticate",email:"other@example.invalid"}),req({...passwordBody,action:["update"]}),req({...passwordBody,email:"other@example.invalid"}),req({...passwordBody,userId:fid}),req({...passwordBody,role:"platform_owner"}),req({...passwordBody,passwordConfirmation:"different"}),req({...passwordBody,password:"short",passwordConfirmation:"short"}),req({...passwordBody,password:" ".repeat(12),passwordConfirmation:" ".repeat(12)}),req({...passwordBody,password:"a".repeat(129),passwordConfirmation:"a".repeat(129)}),req({...passwordBody,currentPassword:""}),req({...passwordBody,nonce:"bad code"})];
  for(const request of requests){const h=harness();assert.ok([400,403].includes((await h.password.POST(request)).status));assert.equal(h.calls.length,0);}
});
test("password updates only the current ordinary session with an allowlisted payload",async()=>{
  const h=harness(),r=await h.password.POST(req({...passwordBody,currentPassword:"Synthetic-old-2026!",nonce:"123456"}));assert.equal(r.status,200);assert.deepEqual(await r.json(),{status:"password_updated"});
  assert.deepEqual(JSON.parse(JSON.stringify(passwordCalls(h))),[["updateUser",{password:passwordBody.password,current_password:"Synthetic-old-2026!",nonce:"123456"}]]);
  assert.doesNotMatch(JSON.stringify(h.warnings),/Synthetic|123456|private-provider-detail/);
});
test("reauthentication sends a code only on an explicit own-session request",async()=>{
  const h=harness({passwordError:{code:"reauthentication_needed",message:"private-provider-detail"}});const r=await h.password.POST(req(passwordBody));assert.equal(r.status,409);assert.equal((await r.json()).code,"PASSWORD_REAUTH_REQUIRED");assert.deepEqual(passwordCalls(h).map(x=>x[0]),["updateUser"]);
  const explicit=harness(),response=await explicit.password.POST(req({action:"reauthenticate"}));assert.deepEqual(await response.json(),{status:"code_requested"});assert.deepEqual(JSON.parse(JSON.stringify(passwordCalls(explicit))),[["reauthenticate"]]);
});
test("password provider refusals are sanitized and never retried or bypassed",async()=>{
  for(const [error,status,code] of [[{code:"reauth_nonce_missing"},409,"PASSWORD_REAUTH_REQUIRED"],[{code:"reauthentication_not_valid"},409,"PASSWORD_REAUTH_REQUIRED"],[{code:"current_password_required"},409,"PASSWORD_CURRENT_REQUIRED"],[{code:"current_password_invalid"},409,"PASSWORD_CURRENT_REQUIRED"],[{code:"same_password"},400,"PASSWORD_UNCHANGED"],[{code:"weak_password"},400,"PASSWORD_WEAK"],[{status:429},429,"RATE_LIMIT"],[{message:"private-provider-detail"},503,"PASSWORD_UNAVAILABLE"]]){
    const h=harness({passwordError:error}),r=await h.password.POST(req(passwordBody));assert.equal(r.status,status);assert.equal((await r.json()).code,code);assert.equal(passwordCalls(h).length,1);assert.doesNotMatch(JSON.stringify(h.warnings),/Synthetic|private-provider-detail/);
  }
  for(const options of [{passwordThrow:true},{passwordUser:fid}]){const h=harness(options),r=await h.password.POST(req(passwordBody));assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/Synthetic|private-provider-detail/);assert.equal(passwordCalls(h).length,1);}
});
test("password responses are private and cannot be indexed or embedded",async()=>{
  for(const options of [{},{enabled:false},{state:"mfa_required"}]){const r=await harness(options).password.POST(req(passwordBody));assert.equal(r.headers.get("cache-control"),"private, no-store");assert.equal(r.headers.get("referrer-policy"),"no-referrer");assert.equal(r.headers.get("x-robots-tag"),"noindex, nofollow");assert.equal(r.headers.get("x-frame-options"),"DENY");assert.equal(r.headers.get("vary"),"Cookie");}
});
