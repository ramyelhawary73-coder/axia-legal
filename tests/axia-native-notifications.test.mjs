import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function moduleAt(path,globals={}) {
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,Intl,Date,...globals});return exports;
}
const reminders=moduleAt('src/lib/notification-reminders.ts');
const now=Date.parse('2026-11-26T09:00:00Z');
const task={id:'task-private',title:'SECRET TASK',deadline:'2026-11-26T09:30:00Z',priority:'عاجلة',status:'قيد التنفيذ'};
const hearing={id:'hearing-private',court:'SECRET COURT',hearingDate:'2026-11-26',hearingTime:'11:30',status:'قادمة'};
test('reminders use Cairo calendar and authorized input only, without inventing a time for date-only tasks',()=>{
 const rows=reminders.collectWorkspaceReminders([{...task,deadline:'2026-11-26'}],[hearing],now);
 assert.equal(rows.length,2);assert.equal(rows.find(r=>r.kind==='tasks').dueAt,null);assert.equal(rows.find(r=>r.kind==='tasks').nativeDue,false);
 assert.equal(rows.find(r=>r.kind==='hearings').dueAt,Date.parse('2026-11-26T09:30:00Z'));
 assert.equal(reminders.cairoCalendarDate(Date.parse('2026-11-25T23:00:00Z')),'2026-11-26');
 assert.equal(reminders.collectWorkspaceReminders([],[],now).length,0);
});
test('native reminders reject malformed dates, completed/archived rows, expired times and unspecified timezone timestamps',()=>{
 for(const deadline of ['bad','2026-02-30','2026-11-26junk','2026-11-26T11:30:00']) assert.equal(reminders.collectWorkspaceReminders([{...task,deadline}],[],now).length,0);
 assert.equal(reminders.collectWorkspaceReminders([{...task,status:'مكتملة'}],[{...hearing,isArchived:true}],now).length,0);
 assert.equal(reminders.collectWorkspaceReminders([{...task,deadline:'2026-11-26T08:30:00Z'}],[],now)[0].nativeDue,false);
 assert.equal(reminders.collectWorkspaceReminders([{...task,priority:'عادية'}],[],now)[0].nativeDue,false);
 assert.equal(reminders.collectWorkspaceReminders([task],[],now)[0].nativeDue,true);
});
test('Cairo hearing conversion handles Arabic AM/PM and rejects invalid, missing and DST-ambiguous times',()=>{
 assert.equal(reminders.cairoHearingInstant('2026-11-26','١١:٣٠ ص'),Date.parse('2026-11-26T09:30:00Z'));
 for(const time of ['غير مسجل','25:30','11:80','00:30 pm'])assert.equal(reminders.cairoHearingInstant('2026-11-26',time),null);
 assert.equal(reminders.cairoHearingInstant('2026-04-24','00:30'),null);
 assert.equal(reminders.cairoHearingInstant('2026-10-29','23:30'),null);
});
function notifications({permission='default',secure=true,foreignWorker=false,fail=false,afterRegistration}={}) {
 let asks=0;const sent=[];
 const Notification={permission,requestPermission:async()=>{asks++;Notification.permission='granted';return 'granted';}};
 const registration={active:{scriptURL:foreignWorker?'https://foreign.example/axia-sw.js':'https://axia.example/axia-sw.js'},showNotification:async(...args)=>{if(fail)throw new Error('OS unavailable');sent.push(args);}};
 const api=moduleAt('src/lib/browser-notifications.ts',{window:{isSecureContext:secure,Notification,location:{origin:'https://axia.example'}},navigator:{serviceWorker:{getRegistration:async()=>{afterRegistration?.(Notification);return registration;}}}});
 return {api,sent,asks:()=>asks};
}
test('notification permission is never requested by status checks or delivery, only by an explicit request',async()=>{
 const h=notifications();assert.equal(h.api.getNotificationPermissionStatus(),'default');assert.equal(await h.api.sendPublicWorkspaceNotification(),false);assert.equal(h.asks(),0);
 assert.equal(await h.api.requestBrowserNotificationPermission(),'granted');assert.equal(h.asks(),1);
 assert.equal(await h.api.requestBrowserNotificationPermission(),'granted');assert.equal(h.asks(),1);
});
test('denial, insecure contexts and foreign worker never produce native notifications or repeated prompts',async()=>{
 for(const options of [{permission:'denied'},{permission:'granted',secure:false},{permission:'granted',foreignWorker:true}]) {
  const h=notifications(options);assert.equal(await h.api.sendPublicWorkspaceNotification(),false);assert.equal(h.sent.length,0);assert.equal(h.asks(),0);
 }
 const denied=notifications({permission:'denied'});assert.equal(await denied.api.requestBrowserNotificationPermission(),'denied');assert.equal(denied.asks(),0);
});
test('mobile notifications use the real service-worker API with generic private payload and fixed safe destination',async()=>{
 const h=notifications({permission:'granted'});assert.equal(await h.api.sendPublicWorkspaceNotification(),true);assert.equal(h.sent.length,1);
 const [title,options]=h.sent[0];assert.match(title,/AXIA/);assert.equal(options.data.path,'/?workspace=1');assert.doesNotMatch(JSON.stringify(options),/SECRET|task-private|hearing-private/);assert.equal(options.icon,'/pwa/icon-192.png');
 assert.equal(await h.api.sendPublicWorkspaceNotification({test:true}),true);assert.match(h.sent[1][1].body,/غير مفعّل/);
});
test('delivery revalidates consent and active scope after async registration, and reports rejected display honestly',async()=>{
 const revoked=notifications({permission:'granted',afterRegistration:n=>{n.permission='denied';}});assert.equal(await revoked.api.sendPublicWorkspaceNotification(),false);assert.equal(revoked.sent.length,0);
 let live=true;const ended=notifications({permission:'granted',afterRegistration:()=>{live=false;}});assert.equal(await ended.api.sendPublicWorkspaceNotification({shouldDisplay:()=>live}),false);assert.equal(ended.sent.length,0);
 assert.equal(await notifications({permission:'granted',fail:true}).api.sendPublicWorkspaceNotification(),false);
});
function worker(clients=[]) {
 const listeners={},shown=[],opened=[];let focused=0,closed=0;
 const self={location:{origin:'https://axia.example'},registration:{showNotification:async(...args)=>shown.push(args)},clients:{matchAll:async()=>clients.map(url=>({url,focus:async()=>focused++})),openWindow:async url=>opened.push(url)},addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(fs.readFileSync('src/pwa/service-worker.js','utf8'),{self,URL});
 async function event(name,data={}) {let promise;listeners[name]({...data,notification:{data:{path:'https://evil.example/steal'},close:()=>closed++},waitUntil:p=>{promise=p;}});await promise;}
 return {shown,opened,event,focused:()=>focused,closed:()=>closed};
}
test('push receiver never parses private/hostile payloads or displays their contents',async()=>{
 const h=worker();await h.event('push',{data:{json:()=>{throw new Error('must not parse');}}});assert.equal(h.shown.length,1);assert.equal(h.shown[0][1].data.path,'/?workspace=1');
});
test('notification click focuses an existing authorized-origin window without navigating an editor',async()=>{
 const h=worker(['https://foreign.example/','https://axia.example/?editor=unsaved']);await h.event('notificationclick');assert.equal(h.focused(),1);assert.equal(h.opened.length,0);assert.equal(h.closed(),1);
});
test('notification click ignores payload destinations and opens only the fixed same-origin workspace',async()=>{
 const h=worker(['https://foreign.example/']);await h.event('notificationclick');assert.deepEqual(h.opened,['https://axia.example/?workspace=1']);
});
function freshRead({scope='office:actor',tasks=[task],status=200,hearings=[],hearingStatus=200}={}) {
 const calls=[];const reminder=reminders.collectWorkspaceReminders([task],[],now)[0];
 class Clock extends Date {static now(){return now;}}
 const api=moduleAt('src/lib/notification-reminders-client.ts',{Date:Clock,require:id=>{assert.equal(id,'@/lib/notification-reminders');return reminders;},fetch:async(url,options)=>{
  calls.push({url,options});const isTask=url==='/api/tasks';return {ok:(isTask?status:hearingStatus)===200,json:async()=>isTask?{organizationId:scope.split(':')[0],userId:scope.split(':')[1],tasks}:{hearings}};
 }});return {api,calls,reminder};
}
test('foreground delivery requires fresh same-user/office SSR data, never permission alone',async()=>{
 const h=freshRead();assert.equal(await h.api.revalidateWorkspaceReminder('office:actor',h.reminder),true);assert.equal(h.calls.length,1);assert.equal(h.calls[0].url,'/api/tasks');assert.equal(h.calls[0].options.cache,'no-store');assert.equal(h.calls[0].options.method,undefined);
 for(const options of [{status:401},{status:503},{scope:'other:actor'},{scope:'office:other'},{tasks:[]},{tasks:[{...task,status:'مكتملة'}]},{tasks:[{...task,deadline:'2026-11-26T10:30:00Z'}]}]) {
  const denied=freshRead(options);assert.equal(await denied.api.revalidateWorkspaceReminder('office:actor',denied.reminder),false);
 }
});
test('hearing reminders also recheck the authorized record and current date/time/archive state',async()=>{
 const reminder=reminders.collectWorkspaceReminders([],[hearing],now)[0];
 const row={...hearing,status:'scheduled',isArchived:false};
 const h=freshRead({hearings:[row]});assert.equal(await h.api.revalidateWorkspaceReminder('office:actor',reminder),true);assert.deepEqual(h.calls.map(c=>c.url),['/api/tasks','/api/hearings']);
 for(const options of [{hearings:[]},{hearingStatus:403},{hearings:[{...row,isArchived:true}]},{hearings:[{...row,status:'cancelled'}]},{hearings:[{...row,hearingTime:'12:00'}]}]) {
  const denied=freshRead(options);assert.equal(await denied.api.revalidateWorkspaceReminder('office:actor',reminder),false);
 }
});
