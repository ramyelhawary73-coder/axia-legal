import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const origin='https://axia.example';
const template=fs.readFileSync('src/pwa/service-worker.js','utf8');
function worker({offline=false,badAsset=false,redirect=false}={}) {
  const listeners={},store=new Map(),requests=[];let skips=0,claims=0;
  const cache={put:async(key,response)=>store.set(String(key),response.clone()),match:async key=>store.get(String(key))?.clone()};
  const names=['axia-pwa-public-old','another-app-cache','axia-offline-records'];const deleted=[];
  const self={location:{origin},addEventListener:(name,handler)=>{listeners[name]=handler;},clients:{claim:async()=>{claims++;}},skipWaiting:async()=>{skips++;}};
  const fetch=async request=>{
    requests.push(request);
    if(offline) throw new TypeError('Network unavailable');
    const path=new URL(request.url).pathname;
    const response=new Response(path==='/offline.html'?'public offline screen':'public brand image',{headers:{'Content-Type':badAsset?'text/html':path.endsWith('.html')?'text/html; charset=utf-8':'image/png'}});
    if(redirect) Object.defineProperty(response,'redirected',{value:true});
    return response;
  };
  vm.runInNewContext(template.replace('__AXIA_RELEASE__','test-release'),{self,caches:{open:async()=>cache,keys:async()=>names,delete:async name=>{deleted.push(name);}},Request,Response,URL,fetch});
  async function lifecycle(name) {let work;listeners[name]({waitUntil:p=>{work=p;}});await work;}
  async function get(url,{method='GET',mode='navigate',network}={}) {
    const request={url:new URL(url,origin).href,method,mode};let response;
    // Replace only transport, keeping the actual worker's fetch policy under test.
    if(network) {
      const context={self,caches:{open:async()=>cache},Request,Response,URL,fetch:network};
      vm.runInNewContext(template.replace('__AXIA_RELEASE__','test-release'),context);
    }
    listeners.fetch({request,respondWith:p=>{response=p;}});return response;
  }
  return {listeners,store,requests,deleted,lifecycle,get,skips:()=>skips,claims:()=>claims};
}
test('PWA precaches only fixed same-origin public assets and waits for update consent',async()=>{
  const h=worker();await h.lifecycle('install');
  assert.deepEqual([...h.store.keys()].map(x=>new URL(x).pathname),['/offline.html','/pwa/icon-192.png','/pwa/icon-512.png','/pwa/maskable-512.png','/pwa/apple-touch-icon.png','/pwa/notification-badge-96.png']);
  assert.ok(h.requests.every(r=>new URL(r.url).origin===origin&&r.credentials==='same-origin'&&r.redirect==='error'));
  assert.equal(h.skips(),0);
});
test('PWA rejects redirects and HTML masquerading as an icon instead of caching login content',async()=>{
  for(const options of [{badAsset:true},{redirect:true}]) await assert.rejects(worker(options).lifecycle('install'),/Public shell unavailable/);
});
test('PWA private navigation stays on the network and is never persisted',async()=>{
  const h=worker();await h.lifecycle('install');const keys=[...h.store.keys()];
  const result=await h.get('/platform?office=private',{network:async()=>new Response('private HTML',{status:200})});
  assert.equal(await result.text(),'private HTML');assert.deepEqual([...h.store.keys()],keys);
});
test('PWA does not replace authorization denials or server errors with an offline success screen',async()=>{
  for(const status of [401,403,500,503]) {
    const h=worker();await h.lifecycle('install');
    const response=await h.get('/platform',{network:async()=>new Response('denied',{status})});
    assert.equal(response.status,status);assert.equal(await response.text(),'denied');
  }
});
test('PWA transport failure shows only the public shell and does not retain a requested URL',async()=>{
  const h=worker();await h.lifecycle('install');const keys=[...h.store.keys()];
  const response=await h.get('/?private-search=not-to-store',{network:async()=>{throw new TypeError('offline');}});
  assert.equal(await response.text(),'public offline screen');assert.deepEqual([...h.store.keys()],keys);
});
test('PWA never intercepts APIs, callbacks, framework requests, foreign hosts or writes',async()=>{
  for(const [url,options] of [['/api/matters',{}],['/api/platform/mfa',{}],['/auth/confirm?code=synthetic',{}],['/_next/static/test.js',{}],['https://another.example/',{}],['/',{method:'POST'}]]) {
    const h=worker();assert.equal(await h.get(url,options),undefined);assert.equal(h.requests.length,0);
  }
});
test('PWA activation only removes its own obsolete public caches',async()=>{
  const h=worker();await h.lifecycle('activate');assert.deepEqual(h.deleted,['axia-pwa-public-old']);assert.equal(h.claims(),1);
});
test('PWA update activation requires an explicit same-origin app message',()=>{
  const h=worker();
  for(const event of [{data:{type:'AXIA_ACTIVATE_UPDATE'}},{source:{url:'https://foreign.example/'},data:{type:'AXIA_ACTIVATE_UPDATE'}},{source:{url:origin},data:{type:'OTHER'}}]) h.listeners.message(event);
  assert.equal(h.skips(),0);h.listeners.message({source:{url:origin+'/install'},data:{type:'AXIA_ACTIVATE_UPDATE'}});assert.equal(h.skips(),1);
});
test('PWA exact public exceptions cannot open adjacent work or authentication routes',()=>{
  const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/proxy.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:()=>({})});
  const pattern=new RegExp('^'+exports.config.matcher[0]+'$');
  for(const path of ['/install','/install/','/manifest.webmanifest','/axia-sw.js','/offline.html']) assert.equal(pattern.test(path),false,path);
  for(const path of ['/','/platform','/api/platform/mfa','/api/matters','/auth/confirm','/install/private','/manifestXwebmanifest','/axia-swXjs','/offlineXhtml','/offline.html/private']) assert.equal(pattern.test(path),true,path);
});
test('PWA manifest is origin-relative with real PNG icons for normal, maskable and Apple installation',()=>{
  const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/manifest.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
  const m=exports.default();assert.equal(m.id,'/');assert.equal(m.scope,'/');assert.equal(m.start_url,'/');assert.equal(m.display,'standalone');assert.equal(m.dir,'rtl');
  for(const [file,size] of [['icon-192',192],['icon-512',512],['maskable-512',512],['apple-touch-icon',180]]) {const png=fs.readFileSync('public/pwa/'+file+'.png');assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);}
  assert.equal(m.icons.filter(i=>i.purpose==='maskable').length,1);
});
