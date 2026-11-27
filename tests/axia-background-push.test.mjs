import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as crypto from "node:crypto";
import * as delivery from "../workers/push/delivery.mjs";
const uuid=n=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const origin="https://fixture-git-push-preview.vercel.app", ref="a".repeat(20);
const ecdh=crypto.createECDH("prime256v1"); const publicKey=ecdh.generateKeys().toString("base64url");
const key=crypto.randomBytes(32).toString("base64url");
const env={AXIA_PUSH_ENABLED:"1",AXIA_PUSH_SCOPE:"axia-push-preview-v1",VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"feat/axia-web-push-20261127",
 AXIA_PUSH_ORIGIN:origin,AXIA_PUSH_SUBSCRIPTION_KEY_V1:key,AXIA_PUSH_VAPID_PUBLIC_KEY:publicKey,AXIA_PUSH_EXPECTED_SUPABASE_REF:ref};
function harness(overrides={}) {
 let calls=0, current=Date.now(), liveSession=uuid(3); const mutations=[];
 const supabase={auth:{
  getUser:async()=>({data:{user:{id:overrides.freshUser??uuid(1),email_confirmed_at:"2026-01-01",is_anonymous:false}},error:null}),
  getClaims:async()=>({data:{claims:{sub:uuid(1),session_id:liveSession,exp:Math.floor(current/1000)+3600}},error:null}),
 },rpc:async(name,args)=>{
   if(name==="axia_push_status")return {data:{ready:!overrides.notProvisioned,origin,leaseUntil:new Date(current+900000).toISOString()},error:null};
   mutations.push({name,args});
   return {data:name==="axia_push_enroll"?{id:args.p_device,expiresAt:new Date(current+900000).toISOString()}:
    name==="axia_push_revoke"?{revoked:true}:{accepted:true,id:uuid(4),scheduledAt:new Date(current+90000).toISOString()},error:null};
 }};
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/push-server.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
  exports,Buffer,URL,Response,TextDecoder,Date:class extends Date {static now(){return current;}},setTimeout,clearTimeout,
  process:{env:{...env,...overrides.env}},require(name){
   if(name==="node:crypto")return crypto;
   if(name==="../../workers/push/delivery.mjs")return delivery;
   if(name==="@/lib/supabase/config")return {getSupabasePublicConfig:()=>overrides.missingSupabase?null:{url:"https://"+ref+".supabase.co",publishableKey:"fixture-public"}};
   if(name==="@/lib/api/workspace")return {resolveWorkspace:async()=>{calls++;return {ok:true,supabase,userId:uuid(1),organizationId:uuid(2)};}};
   throw new Error("Unexpected dependency "+name);
  },
 });
 function request(action="config",method="GET",body,csrf,headers={}) {
  return exports.handlePush(new Request(origin+"/api/push/"+action,{method,
    headers:{"x-axia-push-client":"1","sec-fetch-site":"same-origin","x-axia-organization-id":uuid(2),
      ...(method!=="GET"?{"origin":origin,"content-type":"application/json","x-axia-push-csrf":csrf??""}:{}),...headers},
    ...(body!==undefined?{body:typeof body==="string"?body:JSON.stringify(body)}:{})}),action);
 }
 return {request,mutations,calls:()=>calls,setNow:value=>{current=value;},session:value=>{liveSession=value;}};
}
test("background Push is off by default; no fallback/hosted call in disabled, main, or missing-config modes",async()=>{
 for(const options of [{env:{AXIA_PUSH_ENABLED:undefined}},{env:{VERCEL_ENV:"production"}},{env:{VERCEL_GIT_COMMIT_REF:"main"}},{missingSupabase:true},{env:{AXIA_PUSH_EXPECTED_SUPABASE_REF:"b".repeat(20)}}]) {
  const h=harness(options),r=await h.request();assert.equal((await r.json()).enabled,false);assert.equal(h.calls(),0);
  assert.equal((await h.request("test","POST",{})).status,503);assert.equal(h.mutations.length,0);
 }
});
test("same-origin custom request and authenticated fresh user are required",async()=>{
 for(const headers of [{"sec-fetch-site":"cross-site"},{"x-axia-push-client":""}]) {
  const h=harness();assert.equal((await h.request("config","GET",undefined,undefined,headers)).status,403);assert.equal(h.calls(),0);
 }
 const foreign=harness({freshUser:uuid(9)});assert.equal((await foreign.request()).status,401);
 const unready=harness({notProvisioned:true});assert.equal((await (await unready.request()).json()).enabled,false);
});
test("config exposes only own scope/public key, CSRF and readiness; all responses are no-store",async()=>{
 const h=harness(),response=await h.request(),body=await response.json();
 assert.equal(response.headers.get("cache-control"),"private, no-store");assert.equal(body.workspace,uuid(2)+":"+uuid(1));
 assert.equal(body.publicKey,publicKey);assert.equal(body.testOnly,true);assert.ok(body.csrf);assert.ok(!JSON.stringify(body).includes(key));
 assert.ok(!JSON.stringify(body).includes(uuid(3)));
});
test("a forged/missing CSRF or another session never enqueues; a valid request is accepted without claiming delivery",async()=>{
 const h=harness(),config=await (await h.request()).json(),body={deviceId:uuid(5),requestId:uuid(6)};
 for(const token of [undefined,"forged",config.csrf.slice(0,-1)+"!"]) assert.equal((await h.request("test","POST",body,token)).status,403);
 assert.equal((await h.request("test","POST",body,config.csrf,{"origin":"https://foreign.example"})).status,403);
 assert.equal(h.mutations.length,0);
 const accepted=await h.request("test","POST",body,config.csrf);assert.equal(accepted.status,202);assert.equal((await accepted.json()).accepted,true);
 assert.equal(h.mutations[0].name,"axia_push_test");assert.equal(h.mutations[0].args.p_org,uuid(2));
 h.session(uuid(8));assert.equal((await h.request("test","POST",body,config.csrf)).status,403);
});
test("CSRF expiry is enforced independently of current session",async()=>{
 const h=harness(),config=await (await h.request()).json();h.setNow(Date.now()+11*60000);
 assert.equal((await h.request("test","POST",{deviceId:uuid(5),requestId:uuid(6)},config.csrf)).status,403);assert.equal(h.mutations.length,0);
});
test("unknown fields, custom recipients/payloads, arrays and oversized JSON are rejected",async()=>{
 const h=harness(),config=await (await h.request()).json();
 for(const value of [null,[],{deviceId:uuid(5),requestId:uuid(6),userId:uuid(9)},{deviceId:uuid(5),requestId:uuid(6),title:"SECRET"}])
  assert.equal((await h.request("test","POST",value,config.csrf)).status,400);
 assert.equal((await h.request("test","POST","A".repeat(8193),config.csrf)).status,413);assert.equal(h.mutations.length,0);
});
test("device subscription is encrypted with identity binding and endpoint HMAC before RPC; plaintext never returned",async()=>{
 const h=harness(),config=await (await h.request()).json(),installationId=crypto.randomUUID();
 const subscription={endpoint:"https://fcm.googleapis.com/fcm/send/abcdefghijklmnopqrstuvwxyz_123456789",keys:{p256dh:publicKey,auth:crypto.randomBytes(16).toString("base64url")}};
 const response=await h.request("device","POST",{installationId,subscription},config.csrf);
 assert.equal(response.status,201);const output=await response.json();assert.equal(output.id,installationId);
 const args=h.mutations[0].args;assert.equal(args.p_hash.length,64);assert.ok(!args.p_ciphertext.includes(subscription.endpoint));
 const restored=delivery.openSubscription(args.p_ciphertext,{scope:"axia-push-preview-v1",deviceId:installationId,userId:uuid(1),organizationId:uuid(2),sessionId:uuid(3),origin},key);
 assert.equal(restored.endpoint,subscription.endpoint);assert.ok(!JSON.stringify(output).includes("ciphertext"));
 assert.equal((await h.request("device","DELETE",{deviceId:installationId},config.csrf)).status,200);
});
test("receiver remains generic without requiring a page, cache access or a payload",async()=>{
 const handlers={},shown=[];const self={addEventListener:(name,fn)=>{handlers[name]=fn;},registration:{showNotification:async(...args)=>shown.push(args)}};
 vm.runInNewContext(fs.readFileSync("src/pwa/service-worker.js","utf8"),{self});
 let done;handlers.push({waitUntil:value=>{done=value;}});await done;assert.equal(shown.length,1);
 assert.equal(shown[0][1].badge,"/pwa/notification-badge-96.png");assert.equal(shown[0][1].data.path,"/?workspace=1");
});
