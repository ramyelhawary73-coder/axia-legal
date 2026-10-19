import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { completeOfficeSnapshot, encryptOfficeSnapshot, decryptOfficeSnapshot, sha256 } from "../src/lib/office-backup.ts";
import { restoreOfficeSnapshot } from "./lib/restore-office-snapshot.mjs";

// No URL/env credential is accepted. PGlite is in-process; native creates its OWN
// named database on loopback inside the explicitly disposable CI PostgreSQL service.
const modulePath = process.env.AXIA_SQL_TEST_MODULE;
if (!modulePath) throw new Error("Set AXIA_SQL_TEST_MODULE to a disposable test module");
const native = process.env.AXIA_SQL_BACKEND === "postgres";
let db, pool, control, ownedDatabase;
if (native) {
  if (process.env.CI !== "true" && process.env.AXIA_DISPOSABLE_CONTROL_DB !== "1") throw new Error("Native platform tests require an explicitly disposable local server");
  const driver = await import(pathToFileURL(modulePath).href);
  const Pool = driver.Pool ?? driver.default.Pool;
  const options = { host: "127.0.0.1", port: 5432, user: "postgres", connectionTimeoutMillis: 5000, statement_timeout: 10000 };
  control = new Pool({ ...options, database: "postgres", max: 1 });
  ownedDatabase = `axia_control_verify_${process.pid}`;
  await control.query(`create database "${ownedDatabase}"`); // fails rather than replacing an existing database
  pool = new Pool({ ...options, database: ownedDatabase, max: 6 });
  db = { query: (...args) => pool.query(...args), exec: sql => pool.query(sql), async transaction(run) {
    const client = await pool.connect();
    try { await client.query("begin"); const result = await run({ exec: sql => client.query(sql), query: (...args) => client.query(...args) }); await client.query("commit"); return result; }
    catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  } };
} else {
  const { PGlite } = await import(pathToFileURL(modulePath).href);
  db = new PGlite();
}
const uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const office=uuid(301),other=uuid(302),client=uuid(401),matter=uuid(501);
let checks=0;
const check=async(name,fn)=>{await fn();checks++;console.log(`PASS ${name}`);};
async function user(n,fn,extra={}) {return db.transaction(async tx=>{
  await tx.exec('set local role authenticated');
  await tx.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uuid(n),session_id:uuid(100+n),aal:'aal2',...extra})]);
  return fn(tx);
});}
const call=(n,action,id=office,input={})=>user(n,async tx=>(await tx.query('select public.axia_control($1,$2,$3) data',[action,id,JSON.stringify(input)])).rows[0].data);
const deny=fn=>assert.rejects(fn,/CONTROL_|DRAFT_|permission denied|row-level security|enum|unique|check constraint|invalid input|PLATFORM_|STAFF_/);
const reason='Synthetic acceptance operation';
const configure=(id=office,changes={})=>call(1,'configure',id,{revision:0,status:'active',plan:'first-client',expiresAt:null,seatLimit:10,storageLimitMb:1,rajihEnabled:true,reason,...changes});
const draftPayload={title:'Synthetic persisted draft',docType:'مذكرة دفاع',contentHtml:'<p>synthetic text</p>',versions:[],clientId:client,matterId:matter};
const save=(n,id,revision,payload=draftPayload,archived=false,legacy=null)=>user(n,async tx=>(await tx.query('select public.axia_draft_save($1,$2,$3,$4,$5,$6) data',[office,id,revision,JSON.stringify(payload),archived,legacy])).rows[0].data);
try {
  await db.exec(await fs.readFile('tests/sql/control-center-fixture.sql','utf8'));
  for(let n=1;n<=10;n++){
    await db.query('insert into auth.users values($1,$2,$3,false,null)',[uuid(n),`fixture${n}@example.invalid`,n===8?null:'2026-01-01']);
    await db.query("insert into auth.mfa_factors values($1,$2,'totp','verified')",[uuid(200+n),uuid(n)]);
    await db.query("insert into auth.sessions values($1,$2,$3,'aal2',null)",[uuid(100+n),uuid(n),uuid(200+n)]);
    await db.query('insert into public.profiles(id,full_name) values($1,$2)',[uuid(n),`Synthetic ${n}`]);
  }
  for(const [id,name] of [[office,'Synthetic office A'],[other,'Synthetic office B']]) await db.query('insert into public.organizations(id,name,slug,created_by) values($1,$2,$3,$4)',[id,name,id,uuid(1)]);
  for(const [n,id,role] of [[1,office,'owner'],[2,other,'owner'],[3,office,'staff'],[4,office,'viewer'],[5,office,'lawyer'],[6,other,'staff'],[7,office,'owner']]) await db.query('insert into public.organization_members(organization_id,user_id,role) values($1,$2,$3)',[id,uuid(n),role]);
  for(const [id,org] of [[client,office],[uuid(402),other]])await db.query("insert into public.clients(id,organization_id,name,type,created_by) values($1,$2,'Synthetic client','individual',$3)",[id,org,uuid(1)]);
  for(const [id,org,c] of [[matter,office,client],[uuid(502),other,uuid(402)]])await db.query("insert into public.matters(id,organization_id,client_id,title,case_number,created_by) values($1,$2,$3,'Synthetic matter',$4,$5)",[id,org,c,id,uuid(1)]);
  await db.query("insert into public.matter_members(matter_id,user_id,access_level) values($1,$2,'write')",[matter,uuid(3)]);
  await db.exec(await fs.readFile('supabase/migrations/20261015081218_axia_staff_email_invitations.sql','utf8'));
  await db.exec(await fs.readFile('supabase/migrations/20261018173401_axia_platform_owner_foundation.sql','utf8'));
  await db.query('insert into private.platform_principals(user_id) values($1)',[uuid(1)]);
  const membershipBefore=(await db.query('select * from public.organization_members order by organization_id,user_id')).rows;
  await db.exec(await fs.readFile('supabase/migrations/20261019142538_axia_control_center_office_operations.sql','utf8'));
  await check('migration preserves every membership and seeds no office controls',async()=>{
    assert.deepEqual((await db.query('select * from public.organization_members order by organization_id,user_id')).rows,membershipBefore);
    assert.equal(Number((await db.query('select count(*) n from private.office_controls')).rows[0].n),0);
  });
  await check('legacy active office/case access remains unchanged',async()=>assert.equal(Number((await user(3,tx=>tx.query('select count(*) n from public.matters'))).rows[0].n),1));
  await check('normal office roles and forged metadata cannot call any control operation',async()=>{
    for(const n of [2,3,4,5,6,7]) await deny(()=>call(n,'list',null));
    await deny(()=>user(3,tx=>tx.query("select public.axia_control('export',$1,'{}')",[office]),{user_metadata:{role:'platform_owner'}}));
  });
  await check('AAL1 and foreign/missing/revoked sessions fail closed',async()=>{
    for(const claims of [{aal:'aal1'},{session_id:uuid(102)},{session_id:null}]) await deny(()=>user(1,tx=>tx.query("select public.axia_control('list',null,'{}')"),claims));
    await db.query("update auth.sessions set aal='aal1' where id=$1",[uuid(101)]);await deny(()=>call(1,'list',null));
    await db.query("update auth.sessions set aal='aal2' where id=$1",[uuid(101)]);
  });
  await check('clients cannot alter membership, private controls, grants or audit tables directly',async()=>{
    for(const table of ['office_controls','office_member_access','office_support_grants','control_events']) await deny(()=>user(1,tx=>tx.exec(`select * from private.${table}`)));
    await deny(()=>user(3,tx=>tx.exec("update public.organization_members set role='owner'")));
  });
  await check('control inputs are bounded and cannot select arbitrary SQL/data/Auth tables',async()=>{
    for(const [act,input] of [['drop',{}],['list',{limit:51}],['list',{table:'auth.users'}],['configure',{reason:'short'}]])await deny(()=>call(1,act,office,input));
  });
  await check('configuration is revision checked, audited and preserves tenant ownership',async()=>{
    const c=await configure();assert.equal(c.revision,1);await deny(()=>configure());
    const logs=(await db.query("select * from private.control_events where action='control.configure'")).rows;
    assert.equal(logs.length,1);assert.equal(logs[0].actor_id,uuid(1));assert.equal(logs[0].reason,reason);
  });
  await check('cannot demote/block platform identity or the last valid office owner',async()=>{
    await deny(()=>call(1,'member',office,{userId:uuid(1),role:'staff',blocked:true,reason}));
    await deny(()=>call(1,'member',other,{userId:uuid(2),role:'staff',blocked:false,reason}));
    await deny(()=>call(1,'member',other,{userId:uuid(2),role:'owner',blocked:true,reason}));
    await deny(()=>call(1,'member',office,{userId:uuid(3),role:'platform_owner',blocked:false,reason}));
  });
  await check('member role/block affects only that office, leaves Auth and memberships intact',async()=>{
    await call(1,'member',office,{userId:uuid(3),role:'staff',blocked:true,reason});
    assert.equal(Number((await user(3,tx=>tx.query('select count(*) n from public.clients'))).rows[0].n),0);
    assert.equal(Number((await user(6,tx=>tx.query('select count(*) n from public.clients'))).rows[0].n),1);
    await call(1,'member',office,{userId:uuid(3),role:'staff',blocked:false,reason});
  });
  await check('suspension and expiry block direct SQL and old SECURITY DEFINER invitation routes',async()=>{
    await configure(office,{revision:1,status:'suspended'});
    assert.equal((await user(3,tx=>tx.query('select public.axia_workspace_access() data'))).rows[0].data[0].access,'WORKSPACE_SUSPENDED');
    assert.equal(Number((await user(3,tx=>tx.query('select count(*) n from public.clients'))).rows[0].n),0);
    await deny(()=>save(1,uuid(601),0));
    await deny(()=>user(7,tx=>tx.query("select public.axia_staff_manage($1,'create','new@example.invalid','staff',null)",[office])));
    await configure(office,{revision:2,expiresAt:'2000-01-01'});
    assert.equal((await user(3,tx=>tx.query('select public.axia_workspace_access() data'))).rows[0].data[0].access,'WORKSPACE_EXPIRED');
    assert.equal(Number((await user(3,tx=>tx.query('select count(*) n from public.clients'))).rows[0].n),0);
    await configure(office,{revision:3});
  });
  await check('seat limit is enforced even for direct invitation membership inserts',async()=>{
    await configure(office,{revision:4,seatLimit:5});
    await deny(()=>db.query("insert into public.organization_members(organization_id,user_id,role) values($1,$2,'viewer')",[office,uuid(9)]));
    await configure(office,{revision:5,seatLimit:10});
  });
  await check('Storage quota uses actual metadata and fails closed for unknown size',async()=>{
    await deny(()=>db.query("insert into storage.objects(bucket_id,name,metadata) values('legal-documents',$1,'{}')",[office+'/general/missing-size.txt']));
    await deny(()=>db.query("insert into storage.objects(bucket_id,name,metadata) values('legal-documents',$1,'{\"size\":1048577}')",[office+'/general/oversize.txt']));
    await db.query("insert into storage.objects(bucket_id,name,metadata) values('legal-documents',$1,'{\"size\":9}')",[office+'/general/synthetic.txt']);
  });
  await check('Storage permission probes can roll back, while only final sized rows may commit',async()=>{
    await db.exec('begin');
    await db.query("insert into storage.objects(bucket_id,name,metadata) values('legal-documents',$1,'{\"contentLength\":9}')",[office+'/general/probe.txt']);
    await db.exec('rollback');
    assert.equal(Number((await db.query("select count(*) n from storage.objects where name like '%/probe.txt'")).rows[0].n),0);
    await db.transaction(async tx=>{
      await tx.query("insert into storage.objects(bucket_id,name,metadata) values('legal-documents',$1,'{}')",[office+'/general/final.txt']);
      await tx.query("update storage.objects set metadata='{\"size\":4}' where name=$1",[office+'/general/final.txt']);
    });
    await db.query('delete from storage.objects where name=$1',[office+'/general/final.txt']);
  });
  await check('support reads require explicit reason and a fresh office/session-specific lease',async()=>{
    await deny(()=>call(1,'records',other,{dataset:'clients'}));
    await deny(()=>call(1,'support',other,{reason:'short'}));
    await call(1,'support',other,{reason});
    assert.equal((await call(1,'records',other,{dataset:'clients'})).items.length,1);
    await deny(()=>call(1,'records',office,{dataset:'clients'}));
    await deny(()=>call(1,'records',other,{dataset:'auth.users'}));
    await call(1,'end_support',other);await deny(()=>call(1,'records',other,{dataset:'clients'}));
  });
  await check('root support never grants permanent cross-office tenant/case membership',async()=>{
    assert.equal(Number((await user(1,tx=>tx.query('select count(*) n from public.clients where organization_id=$1',[other]))).rows[0].n),0);
    assert.deepEqual((await db.query('select * from public.organization_members order by organization_id,user_id')).rows,membershipBefore);
  });
  await check('draft save produces durable revision history with correct actor',async()=>{
    const d=await save(3,uuid(601),0);assert.equal(d.revision,1);assert.equal(d.created_by,uuid(3));
    assert.equal(d.payload.id,uuid(601));assert.equal(Date.parse(d.payload.createdAt),Date.parse(d.created_at));
    const next=await save(3,uuid(601),1,{...draftPayload,contentHtml:'<p>revision two</p>'});assert.equal(next.revision,2);
    const versions=(await db.query('select revision,actor_id from public.legal_draft_versions order by revision')).rows;
    assert.deepEqual(versions,[{revision:1,actor_id:uuid(3)},{revision:2,actor_id:uuid(3)}]);
  });
  await check('stale saves, cross-office client/case binding and read-only users cannot overwrite drafts',async()=>{
    await deny(()=>save(3,uuid(601),1));await deny(()=>save(4,uuid(602),0));
    await deny(()=>save(3,uuid(602),0,{...draftPayload,clientId:uuid(402)}));
    await deny(()=>save(3,uuid(602),0,{...draftPayload,matterId:uuid(502),clientId:uuid(402)}));
    await deny(()=>save(6,uuid(601),2));
  });
  await check('draft rows/history cannot be forged, deleted or edited by direct client SQL',async()=>{
    for(const query of ['delete from public.legal_drafts','update public.legal_draft_versions set revision=99','insert into public.legal_drafts default values'])await deny(()=>user(3,tx=>tx.exec(query)));
    await deny(()=>db.exec('delete from public.legal_draft_versions'));
  });
  await check('legacy import is explicit, scoped, idempotently protected and cannot replace current drafts',async()=>{
    await save(3,uuid(603),0,draftPayload,false,'DRAFT-local-one');
    await deny(()=>save(3,uuid(604),0,draftPayload,false,'DRAFT-local-one'));
    const archived=await save(3,uuid(601),2,draftPayload,true);assert.equal(archived.archived,true);assert.equal(archived.revision,3);
  });
  await check('export includes every tenant dataset, archived drafts/history, relations and Storage orphans',async()=>{
    const b=await call(1,'export',office,{reason});
    assert.equal(b.format,'axia-office-snapshot');assert.equal(b.organizationId,office);
    assert.equal(b.tables.clients.length,1);assert.equal(b.tables.legal_drafts.length,2);assert.equal(b.tables.legal_draft_versions.length,4);
    assert.equal(b.storage.length,1);assert.ok(b.storage[0].path.startsWith(office+'/'));
    assert.equal(b.tables.organizations.length,1);assert.equal(b.tables.matters[0].organization_id,office);
    assert.equal(Object.keys(b.tables).length,17);assert.equal('users' in b.tables,false);
    for(const rows of Object.values(b.tables))for(const r of rows)if(r.organization_id)assert.equal(r.organization_id,office);
  });
  await check('export redacts invitation token hashes and never includes Auth/session/MFA/private authority',async()=>{
    await user(7,tx=>tx.query("select public.axia_staff_manage($1,'create','new@example.invalid','staff',null)",[office]));
    const b=await call(1,'export',office,{reason});assert.equal(b.tables.staff_invitations.length,1);
    assert.equal('token_hash' in b.tables.staff_invitations[0],false);
    assert.doesNotMatch(JSON.stringify(b),/request.jwt|access_token|refresh_token|qr_code|banned_until|factor_id/);
  });
  await check('file authorization is restricted to the exact exported path/session and expires on revocation',async()=>{
    await call(1,'file',office,{path:office+'/general/synthetic.txt'});
    await deny(()=>call(1,'file',office,{path:other+'/general/foreign.txt'}));
    await deny(()=>call(1,'file',office,{path:office+'/general/unlisted.txt'}));
    await db.query('update private.office_support_grants set expires_at=now()-interval \'1 second\'');
    await deny(()=>call(1,'file',office,{path:office+'/general/synthetic.txt'}));
  });
  await check('missing document bytes fail the whole export rather than claiming a complete backup',async()=>{
    await db.query("insert into public.documents(organization_id,matter_id,title,storage_path,mime_type,content_hash,created_by) values($1,$2,'missing',$3,'text/plain','deadbeef',$4)",[other,uuid(502),other+'/general/absent.txt',uuid(2)]);
    await deny(()=>call(1,'export',other,{reason}));
  });
  await check('new offices require a confirmed existing unassigned owner, never create Auth accounts',async()=>{
    const before=Number((await db.query('select count(*) n from auth.users')).rows[0].n);
    await db.query("update auth.users set email='fixture9@example.invalid' where id=$1",[uuid(10)]);
    await deny(()=>call(1,'create',null,{name:'Ambiguous synthetic office',slug:'ambiguous-office',ownerEmail:'fixture9@example.invalid',reason}));
    await db.query("update auth.users set email='fixture10@example.invalid' where id=$1",[uuid(10)]);
    for(const n of [8,2])await deny(()=>call(1,'create',null,{name:'Synthetic new office',slug:'synthetic-new',ownerEmail:`fixture${n}@example.invalid`,reason}));
    const r=await call(1,'create',null,{name:'Synthetic new office',slug:'synthetic-new',ownerEmail:"fixture9@example.invalid",reason});assert.ok(r.id);
    assert.equal(Number((await db.query('select count(*) n from auth.users')).rows[0].n),before);
  });
  await check('control audit is immutable and fails mutations atomically when audit insert fails',async()=>{
    await deny(()=>db.exec('delete from private.control_events'));
    await db.exec("create function private.reject_control_test() returns trigger language plpgsql as $$ begin raise exception 'CONTROL_TEST_AUDIT_FAILURE'; end $$; create trigger reject_test before insert on private.control_events for each row execute function private.reject_control_test();");
    await deny(()=>configure(office,{revision:6,status:'suspended'}));
    assert.equal((await db.query('select status from private.office_controls where organization_id=$1',[office])).rows[0].status,'active');
    await db.exec('drop trigger reject_test on private.control_events');
  });
  await check('encrypted office backup restores typed rows, foreign keys, history and exact file bytes in a fresh isolated database',async()=>{
    const path=office+'/general/synthetic.txt';
    const hash=await sha256(new TextEncoder().encode('synthetic'));
    await db.query("insert into public.documents(id,organization_id,title,storage_path,mime_type,content_hash,created_by) values($1,$2,'Synthetic file',$3,'text/plain',$4,$5)",[uuid(701),office,path,hash,uuid(1)]);
    await user(1,tx=>tx.query("insert into public.tasks(id,organization_id,matter_id,title,category,deadline,assigned_to,created_by) values($1,$2,$3,'Synthetic task','general','2026-12-31',$4,$5)",[uuid(801),office,matter,uuid(3),uuid(1)]));
    await db.query("insert into public.hearings(id,organization_id,matter_id,hearing_date,created_by) values($1,$2,$3,'2026-12-31',$4)",[uuid(802),office,matter,uuid(1)]);
    await db.query("insert into public.financial_records(id,organization_id,client_id,matter_id,record_type,direction,amount,created_by) values($1,$2,$3,$4,'fee_payment','income',1500,$5)",[uuid(803),office,client,matter,uuid(1)]);
    await db.query("insert into public.matter_parties(id,organization_id,matter_id,party_type,name,created_by) values($1,$2,$3,'client','Synthetic party',$4)",[uuid(804),office,matter,uuid(1)]);
    await db.query("insert into public.client_powers_of_attorney(id,organization_id,client_id,document_id,poa_number,created_by) values($1,$2,$3,$4,'SYNTHETIC-001',$5)",[uuid(805),office,client,uuid(701),uuid(1)]);
    await db.query("insert into public.rajih_action_requests(id,organization_id,requested_by,matter_id,action_type) values($1,$2,$3,$4,'create_task')",[uuid(806),office,uuid(1),matter]);
    const snapshot=await call(1,'export',office,{reason});
    const complete=await completeOfficeSnapshot(snapshot,async()=>new TextEncoder().encode('synthetic'));
    const encoded=await encryptOfficeSnapshot(complete,'Synthetic recovery password only');
    const decoded=await decryptOfficeSnapshot(encoded,'Synthetic recovery password only');
    let target,restorePool,restoreName;
    if(native){
      restoreName=`axia_restore_verify_${process.pid}`;
      await control.query(`create database "${restoreName}"`);
      restorePool=new pool.constructor({host:'127.0.0.1',port:5432,user:'postgres',database:restoreName,max:1,connectionTimeoutMillis:5000,statement_timeout:15000});
      target={query:(...a)=>restorePool.query(...a),exec:q=>restorePool.query(q),transaction:async run=>{
        const client=await restorePool.connect();try{await client.query('begin');const value=await run({query:(...a)=>client.query(...a),exec:q=>client.query(q)});await client.query('commit');return value;}catch(error){await client.query('rollback');throw error;}finally{client.release();}
      }};
    }else target=new db.constructor();
    try{
      for(const file of ['tests/sql/control-center-fixture.sql','supabase/migrations/20261015081218_axia_staff_email_invitations.sql','supabase/migrations/20261018173401_axia_platform_owner_foundation.sql','supabase/migrations/20261019142538_axia_control_center_office_operations.sql'])await target.exec(await fs.readFile(file,'utf8'));
      const nonce=randomUUID();await target.exec('create table private.axia_restore_disposable(nonce uuid not null)');await target.query('insert into private.axia_restore_disposable values($1)',[nonce]);
      const report=await restoreOfficeSnapshot(target,decoded,nonce);
      assert.equal(report.counts.clients,1);assert.equal(report.counts.matters,1);assert.equal(report.counts.tasks,1);assert.equal(report.counts.hearings,1);assert.equal(report.counts.financial_records,1);assert.equal(report.counts.client_powers_of_attorney,1);assert.equal(report.counts.legal_draft_versions,4);
      assert.equal(report.quarantinedInvitations,1);assert.equal(report.quarantinedActions,1);
      const file=(await target.query('select bytes,sha256 from private.restored_file_bytes')).rows[0];
      assert.equal(new TextDecoder().decode(file.bytes),'synthetic');assert.equal(file.sha256,hash);
      assert.equal(Number((await target.query('select count(*) n from private.platform_principals')).rows[0].n),0);
      await assert.rejects(()=>restoreOfficeSnapshot(target,decoded,nonce),/EMPTY_DATABASE/);
      await target.exec("begin; set local role authenticated;");
      assert.equal(Number((await target.query('select count(*) n from public.clients')).rows[0].n),0);await target.exec('rollback');
    }finally{if(native){await restorePool?.end();if(restoreName)await control.query(`drop database "${restoreName}" with (force)`);}else await target.close();}
  });
  if(native){
    await check('parallel subscription updates produce exactly one committed revision',async()=>{
      const rev=Number((await db.query('select revision from private.office_controls where organization_id=$1',[office])).rows[0].revision);
      const results=await Promise.allSettled([configure(office,{revision:rev,plan:'race-a'}),configure(office,{revision:rev,plan:'race-b'})]);
      assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
    });
    await check('parallel draft saves reject the losing revision instead of losing an edit',async()=>{
      const results=await Promise.allSettled([save(3,uuid(603),1,{...draftPayload,title:'Race A'}),save(3,uuid(603),1,{...draftPayload,title:'Race B'})]);
      assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
    });
    await check('simultaneous first saves cannot overwrite a newly created draft',async()=>{
      const key=uuid(620);
      const results=await Promise.allSettled([save(3,key,0,{...draftPayload,title:'First A'}),save(5,key,0,{...draftPayload,title:'First B'})]);
      assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
      const current=(await db.query('select revision,created_by from public.legal_drafts where id=$1',[key])).rows[0];
      assert.equal(current.revision,1);assert.equal(Number((await db.query('select count(*) n from public.legal_draft_versions where draft_id=$1',[key])).rows[0].n),1);
    });
    await check('competing owner demotions serialize and retain one valid owner',async()=>{
      await call(1,'member',other,{userId:uuid(6),role:'owner',blocked:false,reason});
      const results=await Promise.allSettled([call(1,'member',other,{userId:uuid(2),role:'staff',blocked:false,reason}),call(1,'member',other,{userId:uuid(6),role:'staff',blocked:false,reason})]);
      assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
      assert.equal(Number((await db.query("select count(*) n from public.organization_members where organization_id=$1 and role='owner'",[other])).rows[0].n),1);
    });
  }
  await check('root revocation invalidates existing support grants and all administrative calls',async()=>{
    await call(1,'support',office,{reason});
    await db.query('update private.platform_principals set enabled=false,revoked_at=now() where user_id=$1',[uuid(1)]);
    await deny(()=>call(1,'records',office,{dataset:'clients'}));await deny(()=>call(1,'configure',office,{}));
    assert.equal((await user(1,tx=>tx.query('select private.axia_control_support_file($1) ok',[office+'/general/synthetic.txt']))).rows[0].ok,false);
  });
  console.log(`Control center SQL: ${checks} checks passed (${native?'native PostgreSQL':'PGlite'}).`);
} catch(error) {
  console.error("Control SQL failure:", error.message, error.code ?? "", error.position ?? "");
  process.exitCode=1;
} finally {
  if(native){await pool?.end();if(ownedDatabase)await control.query(`drop database "${ownedDatabase}" with (force)`);await control?.end();}
  else await db.close();
}
