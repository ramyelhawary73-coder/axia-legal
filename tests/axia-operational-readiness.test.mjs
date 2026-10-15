import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadTs(path, context = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, console, Blob, setTimeout: () => 1,
    ...context }, { filename: path });
  return exports;
}

function serviceHarness() {
  const data = new Map();
  const blobs = [];
  const events = [];
  let clicks = 0;
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-10-15T10:00:00Z'])); }
  }
  const api = loadTs('src/lib/daily-snapshot-service.ts', {
    Date: FixedDate,
    localStorage: {getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key,value)},
    window: {dispatchEvent: event => events.push(event)},
    CustomEvent: class { constructor(type, detail) { Object.assign(this, {type}, detail); } },
    document: {createElement: () => ({click() { clicks++; }}), body: {appendChild() {}, removeChild() {}}},
    URL: {createObjectURL: blob => {blobs.push(blob); return 'blob:test';}, revokeObjectURL() {}},
  });
  return {api, data, blobs, events, clicks: () => clicks};
}

test('cloud-only legacy preferences do not suppress a real local export and raw data is retained', () => {
  const h = serviceHarness();
  const original = JSON.stringify({destination:'cloud_sync',lastExportDate:'2026-10-15',cloudSyncStatus:'synced'});
  h.data.set('axia_daily_snapshot_config', original);
  h.data.set('axia_cloud_snapshot_vault','legacy payload');
  const config = h.api.getSnapshotConfig();
  assert.equal(config.destination,'download_folder');
  assert.equal(config.lastExportDate,undefined);
  assert.equal(config.cloudSyncStatus,'idle');
  assert.equal(h.data.get('axia_daily_snapshot_config'), original);
  assert.equal(h.data.get('axia_cloud_snapshot_vault'),'legacy payload');
});

test('unimplemented cloud sync never claims success or writes a local vault', async () => {
  const h = serviceHarness();
  const result = await h.api.syncSnapshotToCloud(h.api.buildDailySnapshot([],[]),'https://example.invalid');
  assert.equal(result.success,false);
  assert.equal(h.data.size,0);
  assert.equal(h.clicks(),0);
});

test('explicit unsupported destination cannot record a successful export', async () => {
  const h = serviceHarness();
  await assert.rejects(h.api.performDailyExport([],[],{destination:'both'}));
  assert.equal(h.data.size,0);
  assert.equal(h.clicks(),0);
  assert.equal(h.events.length,0);
});

test('local export requests an actual file download before recording its history', async () => {
  const h = serviceHarness();
  const result = await h.api.performDailyExport([],[],{format:'json'});
  assert.equal(h.clicks(),1);
  const payload = JSON.parse(await h.blobs[0].text());
  assert.equal(payload.activeMatters.length,0);
  assert.equal(result.record.destination,'download_folder');
  assert.equal(h.api.getSnapshotRecords().length,1);
  assert.equal(h.api.getSnapshotConfig().lastExportDate,result.snapshot.date);
  assert.equal(h.events.length,1);
});

test('snapshot output contains no invented office identity or financial totals', () => {
  const h = serviceHarness();
  const s = h.api.buildDailySnapshot([],[]);
  assert.equal(s.firm.barRegistration,'غير مسجل');
  assert.equal(s.firm.managingPartner,'غير مسجل');
  assert.equal(s.metrics.totalAgreedFees,'غير متاح في هذه اللقطة');
});

test('CSV escapes quotes and treats spreadsheet formulas as text', async () => {
  const h = serviceHarness();
  assert.equal(h.api.snapshotCsvCell('a"b'), '"a""b"');
  assert.equal(h.api.snapshotCsvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(h.api.snapshotCsvCell('\t+123'), '"\'\t+123"');
  await h.api.performDailyExport([], [{id:'t1',title:'=1+1',status:'معلقة',priority:'عاجلة'}],{format:'csv'});
  assert.match(await h.blobs[0].text(), /"'=1\+1"/);
});

test('consistency marker changes when task content changes, even with unchanged IDs', () => {
  const h = serviceHarness();
  const task = {id:'t1',title:'original',status:'معلقة',priority:'عاجلة'};
  assert.notEqual(h.api.buildDailySnapshot([], [task]).checksum,
    h.api.buildDailySnapshot([], [{...task,title:'updated'}]).checksum);
});

test('auto-export hook waits for readiness and executes only once after a successful load', async () => {
  let effects = [], timers = [], exportsCount = 0;
  const ref = {current:false};
  const api = loadTs('src/hooks/use-daily-snapshot-auto-export.ts', {
    require(name) {
      if (name === 'react') return {
        useState: initial => [initial, () => {}], useRef: () => ref,
        useEffect: effect => effects.push(effect), useCallback: fn => fn,
      };
      return {
        getSnapshotConfig: () => ({enabled:true,autoDownloadOnAppOpen:true}),
        getTodayDateString: () => '2026-10-15',
        performDailyExport: async () => { exportsCount++; return {record:{mattersCount:0,tasksCount:0,filename:'test',destination:'download_folder'}}; },
      };
    },
    window: {addEventListener() {},removeEventListener() {}},
    setTimeout: fn => {timers.push(fn); return 1;}, clearTimeout() {},
  });
  api.useDailySnapshotAutoExport([],[],false);
  effects.forEach(effect => effect());
  assert.equal(timers.length,0);
  assert.equal(ref.current,false);
  effects = [];
  api.useDailySnapshotAutoExport([],[],true);
  effects.forEach(effect => effect());
  await timers[0]();
  assert.equal(exportsCount,1);
  effects = []; timers = [];
  api.useDailySnapshotAutoExport([],[],true);
  effects.forEach(effect => effect());
  assert.equal(timers.length,0);
});

function libraryHarness({authenticated = true, data = [], error = null} = {}) {
  const calls = [];
  const chain = {};
  for (const method of ['select','eq','not','order']) {
    chain[method] = (...args) => { calls.push([method,...args]); return chain; };
  }
  chain.limit = (value) => { calls.push(['limit',value]); return Promise.resolve({data,error}); };
  const api = loadTs('src/app/api/library/route.ts', {
    URL, Response,
    require(name) {
      if (name === 'next/server') return {NextResponse:{json: (...args) => Response.json(...args)}};
      if (name.endsWith('/workspace')) return {resolveWorkspace: async () => authenticated ? {ok:true,supabase:{from: (...args) => {calls.push(['from',...args]); return chain;}}} : {ok:false,code:'SESSION_EXPIRED'}};
      if (name.endsWith('/errors')) return {workspaceErrorResponse: code => Response.json({code},{status:401}), apiError: (code,message,status) => Response.json({code,error:message},{status})};
      throw new Error(name);
    },
  });
  return {api,calls};
}

test('library requires an authenticated workspace before reading documents', async () => {
  const h = libraryHarness({authenticated:false});
  const response = await h.api.GET(new Request('https://example.invalid/api/library'));
  assert.equal(response.status,401);
  assert.equal(h.calls.length,0);
});

test('library selects only published non-test reviewed metadata and rejects executable URLs', async () => {
  const h = libraryHarness({data:[{id:'one',title:'Title',source_url:'javascript:alert(1)',original_storage_path:'private/internal',reviewed_at:'2026-10-15'}]});
  const response = await h.api.GET(new Request('https://example.invalid/api/library'));
  const payload = await response.json();
  assert.ok(h.calls.some(c => c[0] === 'eq' && c[1] === 'status' && c[2] === 'published'));
  assert.ok(h.calls.some(c => c[0] === 'eq' && c[1] === 'is_test_only' && c[2] === false));
  assert.ok(h.calls.some(c => c[0] === 'not' && c[1] === 'reviewed_by' && c[3] === null));
  assert.equal(payload.documents[0].sourceUrl,null);
  assert.equal('original_storage_path' in payload.documents[0],false);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
});

test('library reports data failures without falling back to sample legal content', async () => {
  const h = libraryHarness({error:{message:'database unavailable'}});
  const response = await h.api.GET(new Request('https://example.invalid/api/library'));
  assert.equal(response.status,502);
  assert.equal((await response.json()).code,'QUERY_FAILED');
});
