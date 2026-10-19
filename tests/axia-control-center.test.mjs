import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { OFFICE_TABLES, completeOfficeSnapshot, encryptOfficeSnapshot, decryptOfficeSnapshot, verifyOfficeSnapshot, validateOfficeSnapshot, sha256 } from '../src/lib/office-backup.ts';

const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const office=id(301),origin='https://axia.example',uid=id(1);
function load(path,modules={},env={}) {
  const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,Response,Request,Blob,Headers,TextDecoder,Uint8Array,process:{env},console,require(name){if(name in modules)return modules[name];throw new Error(`Unexpected module ${name}`);}});return exports;
}
const domain=load('src/lib/control-center.ts',{'@/lib/platform-control':{PLATFORM_UUID:/^[0-9a-f-]{36}$/i}});
const request=(body,headers={})=>new Request(origin+'/api/platform/control',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
function harness(options={}) {
  const calls=[];
  const context={ok:true,userId:uid,state:'ready',supabase:{rpc:async(name,args)=>{calls.push({name,args});return {data:options.data??{version:1},error:options.error??null};},storage:{from:()=>({createSignedUrl:async(path,ttl)=>{calls.push({path,ttl});return {data:{signedUrl:options.signedUrl??'https://db.example/storage/v1/object/sign/legal-documents/x?token=synthetic'},error:null};}})}}};
  const api=load('src/app/api/platform/control/route.ts',{
    '@/lib/platform-control':{getPlatformControlConfig:()=>({origin}),readPlatformBody:async req=>{if((await req.clone().text()).length>4096)return null;return req.json();}},
    '@/lib/control-center':domain,'@/lib/supabase/config':{getSupabasePublicConfig:()=>({url:'https://db.example'})},
    '@/lib/api/platform':{platformJson:(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}}),platformError:code=>Response.json({code},{status:403}),resolvePlatformContext:async()=>{calls.push('context');return options.denied?{ok:false,code:'PLATFORM_MFA_REQUIRED'}:context;}},
  },{AXIA_CONTROL_CENTER_ENABLED:options.disabled?'0':'1'});
  return {api,calls};
}
test('control parser rejects inherited actions, role escalation, foreign paths and unknown selectors',()=>{
  for(const value of [{action:'constructor'},{action:'__proto__'},{action:'list',input:{table:'auth.users'}},{action:'records',officeId:office,input:{dataset:'auth.users'}},{action:'member',officeId:office,input:{reason:'valid reason text',userId:uid,role:'platform_owner',blocked:false}},{action:'file',officeId:office,input:{path:id(302)+'/general/a'}},{action:'list',input:{limit:51}},{action:'export',officeId:office,input:{reason:'short'}}])assert.equal(domain.parseControlRequest(value),null);
});
test('control endpoint stays disabled before any identity, RPC or Storage call',async()=>{
  const h=harness({disabled:true});assert.equal((await h.api.POST(request({action:'list'}))).status,503);assert.equal(h.calls.length,0);
});
test('control mutations require exact Origin and reject invalid data before authentication',async()=>{
  for(const req of [request({action:'list'},{Origin:'https://attacker.example'}),request({action:'list',input:{limit:999}}),request({action:'configure',officeId:office,input:{reason:'x'.repeat(5000)}})]){const h=harness();assert.ok((await h.api.POST(req)).status>=400);assert.equal(h.calls.length,0);}
});
test('MFA denial prevents every control RPC and file ticket',async()=>{
  const h=harness({denied:true});const r=await h.api.POST(request({action:'export',officeId:office,input:{reason:'support acceptance'}}));assert.equal(r.status,403);assert.deepEqual(h.calls,['context']);
});
test('administrative RPC parameters bind action, office, reason and no client actor',async()=>{
  const h=harness();const r=await h.api.POST(request({action:'support',officeId:office,input:{reason:'support acceptance'}}));assert.equal(r.status,200);assert.deepEqual(JSON.parse(JSON.stringify(h.calls[1])),{name:'axia_control',args:{p_action:'support',p_office:office,p_input:{reason:'support acceptance'}}});assert.match(r.headers.get('cache-control'),/no-store/);
});
test('SQL conflicts and missing migrations are sanitized and never reported as success',async()=>{
  for(const [error,status]of [[{code:'40001',message:'secret-private-catalog'},409],[{code:'PGRST202',message:'secret-private-catalog'},503],[{code:'42501',message:'secret-private-catalog'},403]]){const h=harness({error});const r=await h.api.POST(request({action:'overview',officeId:office}));assert.equal(r.status,status);assert.doesNotMatch(await r.text(),/secret-private-catalog/);}
});
test('file links require exact leased path and use a 30-second expiry on the configured Storage origin',async()=>{
  const path=office+'/general/synthetic.pdf';const h=harness({data:{path}});const r=await h.api.POST(request({action:'file',officeId:office,input:{path}}));assert.equal(r.status,200);assert.deepEqual(h.calls[2],{path,ttl:30});
  const bad=harness({data:{path},signedUrl:'https://attacker.example/object'});assert.equal((await bad.api.POST(request({action:'file',officeId:office,input:{path}}))).status,403);
});
function fixture() {
  return {format:'axia-office-snapshot',version:1,organizationId:office,capturedAt:'2026-10-19T14:00:00Z',tables:{...Object.fromEntries(OFFICE_TABLES.map(t=>[t,[]])),organizations:[{id:office,name:'Synthetic office'}],organization_members:[{organization_id:office,user_id:uid,role:'owner'}],profiles:[{id:uid,full_name:'Synthetic user'}],clients:[{id:id(401),organization_id:office}],matters:[{id:id(501),organization_id:office,client_id:id(401)}]},storage:[]};
}
test('backup rejects cross-office data, extra global/Auth tables and broken relations',()=>{
  const bad=[];let s=fixture();s.tables.clients[0].organization_id=id(302);bad.push(s);s=fixture();s.tables.users=[];bad.push(s);s=fixture();s.tables.matters[0].client_id=id(999);bad.push(s);s=fixture();s.tables.profiles.push({id:id(999)});bad.push(s);s=fixture();s.tables.staff_invitations.push({id:id(700),organization_id:office,token_hash:'secret'});bad.push(s);
  for(const snapshot of bad)assert.throws(()=>validateOfficeSnapshot(snapshot));
});
test('backup file verification rejects missing bytes, incorrect hashes, foreign paths and silent omission',async()=>{
  const s=fixture(),bytes=new TextEncoder().encode('synthetic');const path=office+'/general/file.txt';s.storage=[{path,size:String(bytes.length),expectedHash:await sha256(bytes)}];
  await assert.rejects(()=>completeOfficeSnapshot(s,async()=>new TextEncoder().encode('different')));
  await assert.rejects(()=>verifyOfficeSnapshot({...s,files:[]}));
  await assert.rejects(()=>completeOfficeSnapshot({...s,storage:[{...s.storage[0],path:id(302)+'/general/file.txt'}]},async()=>bytes));
});
test('AES-GCM backup round-trip validates every file and rejects wrong passwords and tampering',async()=>{
  const s=fixture(),path=office+'/general/file.txt';s.storage=[{path,size:'9',expectedHash:await sha256(new TextEncoder().encode('synthetic'))}];
  const completed=await completeOfficeSnapshot(s,async()=>new TextEncoder().encode('synthetic'));
  const encrypted=await encryptOfficeSnapshot(completed,'Synthetic password for tests only');assert.doesNotMatch(encrypted,/Synthetic office|Synthetic user|client_id|file.txt/);
  const restored=await decryptOfficeSnapshot(encrypted,'Synthetic password for tests only');assert.deepEqual(restored,completed);assert.equal((await verifyOfficeSnapshot(restored)).files,1);
  await assert.rejects(()=>decryptOfficeSnapshot(encrypted,'Another synthetic wrong password'));
  const changed=JSON.parse(encrypted);changed.ciphertext=(changed.ciphertext[0]==='A'?'B':'A')+changed.ciphertext.slice(1);
  await assert.rejects(()=>decryptOfficeSnapshot(JSON.stringify(changed),'Synthetic password for tests only'));
  changed.kdf='PBKDF2-SHA256-1';await assert.rejects(()=>decryptOfficeSnapshot(JSON.stringify(changed),'Synthetic password for tests only'));
});
test('new runtime has no Service Role, Auth administration or production restore endpoint',()=>{
  for(const file of ['src/app/api/platform/control/route.ts','src/app/api/drafts/route.ts','src/lib/office-backup.ts'])assert.doesNotMatch(fs.readFileSync(file,'utf8'),/service_role|SUPABASE_SERVICE|auth\.admin|resetPasswordForEmail|inviteUserByEmail/);
  assert.equal(fs.existsSync('src/app/api/platform/restore/route.ts'),false);
});

const persistence=load('src/lib/legal-draft-persistence.ts');
const draftId=id(601);
const draft={id:draftId,title:'Synthetic draft',docType:'مذكرة دفاع',clientName:'Synthetic client',contentHtml:'<p>test</p>',versions:[],status:'مسودة قيد التحرير',createdAt:'2026-10-19T12:00:00Z',updatedAt:'2026-10-19T12:00:00Z',currentVersionNumber:'v1.0'};
function draftHarness(options={}) {
  const calls=[];
  const query={};for(const method of ['select','eq','order','limit','lt'])query[method]=(...args)=>{calls.push([method,...args]);return query;};
  query.then=(resolve,reject)=>Promise.resolve({data:options.rows??[],error:options.readError??null}).then(resolve,reject);
  const client={auth:{getUser:async()=>{calls.push('fresh');return {data:{user:{id:options.foreignUser?id(2):uid}},error:null};}},from:table=>{calls.push(['from',table]);return query;},rpc:async(name,args)=>{calls.push({name,args});return {data:{id:draftId,revision:2},error:options.error??null};}};
  const api=load('src/app/api/drafts/route.ts',{
    '@/lib/supabase/config':{getSupabasePublicConfig:()=>options.unconfigured?null:({url:'https://db.example'})},
    '@/lib/api/workspace':{resolveWorkspace:async()=>{calls.push('workspace');return options.workspaceError?{ok:false,code:options.workspaceError}:{ok:true,supabase:client,userId:uid,organizationId:office,role:options.role??'staff'};}},
    '@/lib/api/errors':{workspaceErrorResponse:code=>Response.json({code},{status:403})},
    '@/lib/api/platform':{platformJson:(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})},
    '@/lib/platform-control':{PLATFORM_UUID:/^[0-9a-f-]{36}$/i},'@/lib/legal-draft-persistence':persistence,
  },{AXIA_CONTROL_CENTER_ENABLED:options.disabled?'0':'1'});
  return {api,calls};
}
const draftRequest=(change={},headers={})=>new Request(origin+'/api/drafts',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify({officeId:office,id:draftId,revision:1,draft,...change})});
test('draft activation, Origin, streamed size and payload identity fail before workspace or RPC',async()=>{
  const off=draftHarness({disabled:true});assert.equal((await off.api.GET(new Request(origin+'/api/drafts'))).status,503);assert.equal(off.calls.length,0);
  const missing=draftHarness({unconfigured:true});const unavailable=await missing.api.GET(new Request(origin+'/api/drafts'));assert.equal(unavailable.status,503);assert.equal((await unavailable.json()).enabled,undefined);assert.equal(missing.calls.length,0);
  for(const req of [draftRequest({}, {Origin:'https://attacker.example'}),draftRequest({actorId:uid}),draftRequest({draft:{...draft,id:id(602)}}),draftRequest({draft:{...draft,contentHtml:'x'.repeat(1100001)}})]){
    const h=draftHarness();assert.ok((await h.api.POST(req)).status>=400);assert.equal(h.calls.length,0);
  }
});
test('draft save binds office and fresh identity and never accepts a changed workspace',async()=>{
  for(const [options,body,status]of [[{}, {officeId:id(302)},409],[{foreignUser:true},{},401],[{workspaceError:'MEMBER_SUSPENDED'},{},403]]){
    const h=draftHarness(options);assert.equal((await h.api.POST(draftRequest(body))).status,status);assert.equal(h.calls.filter(v=>v?.name).length,0);
  }
  const h=draftHarness();assert.equal((await h.api.POST(draftRequest())).status,200);
  const rpc=h.calls.find(v=>v?.name);assert.equal(rpc.name,'axia_draft_save');assert.equal(rpc.args.p_office,office);assert.equal(rpc.args.p_revision,1);assert.equal('actor' in rpc.args,false);
});
test('draft stale saves and provider errors never claim success or leak database details',async()=>{
  for(const [code,status]of [['40001',409],['23505',409],['42501',403]]){
    const h=draftHarness({error:{code,message:'private-database-detail'}}),r=await h.api.POST(draftRequest());assert.equal(r.status,status);assert.doesNotMatch(await r.text(),/private-database-detail/);
  }
});
test('draft reads and paginated immutable history always scope the verified office and reject duplicate cursors',async()=>{
  const h=draftHarness({rows:Array.from({length:51},(_,i)=>({revision:60-i}))});
  const r=await h.api.GET(new Request(origin+`/api/drafts?history=${draftId}&before=100`));assert.equal(r.status,200);const body=await r.json();assert.equal(body.versions.length,50);assert.equal(body.nextBefore,11);
  assert.ok(h.calls.some(v=>Array.isArray(v)&&v[0]==='eq'&&v[1]==='organization_id'&&v[2]===office));
  assert.ok(h.calls.some(v=>Array.isArray(v)&&v[0]==='lt'&&v[2]===100));assert.match(r.headers.get('cache-control'),/no-store/);
  for(const suffix of [`history=${draftId}&history=${draftId}`,`history=${draftId}&before=0`,'table=auth.users','before=1'])assert.equal((await draftHarness().api.GET(new Request(origin+'/api/drafts?'+suffix))).status,400);
  assert.equal((await draftHarness({rows:Array(101).fill({})}).api.GET(new Request(origin+'/api/drafts'))).status,413);
});
test('suspended, expired and blocked workspaces report their real status without reading legal records',async()=>{
  for(const access of ['WORKSPACE_SUSPENDED','WORKSPACE_EXPIRED','MEMBER_SUSPENDED']){
    let reads=0;const workspace=load('src/lib/api/workspace.ts',{'@/lib/supabase/server':{createClient:async()=>({auth:{getClaims:async()=>({data:{claims:{sub:uid}}}),getUser:async()=>({data:{user:{id:uid}}})},rpc:async()=>({data:[{organization_id:office,access}]}),from(){reads++;throw new Error('must not read legal rows');}})}},{AXIA_CONTROL_CENTER_ENABLED:'1'});
    const result=await workspace.resolveWorkspace(new Request(origin));assert.equal(result.ok,false);assert.equal(result.code,access);assert.equal(reads,0);
  }
});
test('RAJIH checks office entitlement before any provider call',async()=>{
  for(const entitlement of [{data:false,error:null},{data:null,error:{message:'private-detail'}}]){
    let providers=0;const api=load('src/app/api/rajih/route.ts',{
      'next/server':{NextResponse:{json:(body,options)=>Response.json(body,options)}},
      '@/lib/rajih/agent':{runRajihAgent:async()=>{providers++;throw new Error('unexpected provider');}},
      '@/lib/supabase/server':{createClient:async()=>({auth:{getClaims:async()=>({data:{claims:{sub:uid}}})},rpc:async()=>entitlement})},
      '@/lib/api/workspace':{resolveWorkspace:async()=>({ok:true,userId:uid,organizationId:office})},
      '@/lib/api/errors':{workspaceErrorResponse:()=>Response.json({}, {status:403})},
      '@/lib/platform-control':{PLATFORM_UUID:/^[0-9a-f-]{36}$/i},
    },{AXIA_CONTROL_CENTER_ENABLED:'1'});
    const r=await api.POST(new Request(origin+'/api/rajih',{method:'POST',body:JSON.stringify({prompt:'synthetic legal question',organizationId:office})}));
    assert.equal(r.status,entitlement.error?503:403);assert.equal(providers,0);assert.doesNotMatch(await r.text(),/private-detail/);
  }
});
