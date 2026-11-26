import assert from 'node:assert/strict';
import path from 'node:path';
import http from 'node:http';

// Browser offline emulation does not reliably stop Service Worker-owned requests.
// This loopback-only proxy forwards real compiled bytes, then drops TCP requests on demand.
async function transportGate(base) {
  assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
  let offline=false;
  const server=http.createServer((request,response)=>{
    if(offline) {request.socket.destroy();return;}
    const upstream=http.request(new URL(request.url,base),{method:request.method,headers:{...request.headers,host:new URL(base).host}},result=>{
      response.writeHead(result.statusCode,result.headers);result.pipe(response);
    });
    upstream.on('error',()=>response.destroy());request.pipe(upstream);
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {base:`http://127.0.0.1:${server.address().port}`,
    setOffline(value) {offline=value;if(value)server.closeAllConnections();},
    async close() {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}

export async function mockWaitingPwaUpdate(context) {
  await context.addInitScript(()=>{
    window.axiaUpdateMessages=0;
    const service=new EventTarget(),registration=new EventTarget();
    registration.active={state:'activated'};registration.installing=null;
    registration.waiting={postMessage:message=>{if(message.type==='AXIA_ACTIVATE_UPDATE')window.axiaUpdateMessages++;}};
    registration.update=async()=>{};service.register=async()=>registration;
    Object.defineProperty(navigator,'serviceWorker',{value:service,configurable:true});
  });
}

export async function verifyPwa({browser,base,output,records,fits}) {
  for(const [width,height,theme] of [[1440,900,'dark'],[390,844,'light'],[320,568,'dark']]) {
    const context=await browser.newContext({viewport:{width,height},colorScheme:theme,locale:'ar-EG'});
    await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/install');await page.getByRole('heading',{name:/مكتبك القانوني/}).waitFor();
    await page.getByRole('button',{name:'آيفون / آيباد',exact:true}).click();
    await page.getByText('افتح رابط AXIA في Safari على جهازك.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'أندرويد',exact:true}).click();
    await page.getByText('افتح الرابط في Chrome مباشرة، وليس داخل تطبيق تواصل.',{exact:true}).waitFor();
    await fits(page,`pwa-install-${width}-${theme}`);
    for(const button of await page.getByRole('group',{name:'نوع الجهاز'}).getByRole('button').all()) assert.ok((await button.boundingBox()).height>=44);
    await page.screenshot({path:path.join(output,`pwa-install-${width}-${theme}.png`),fullPage:true});
    assert.deepEqual(errors,[]);records.push({check:'PWA install guidance/layout',width,theme});await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addInitScript(()=>{
      window.axiaInstallPrompts=0;
      window.addEventListener('load',()=>setTimeout(()=>{
        const event=new Event('beforeinstallprompt',{cancelable:true});
        event.prompt=async()=>{window.axiaInstallPrompts++;};event.userChoice=Promise.resolve({outcome:'dismissed'});
        window.dispatchEvent(event);
      },200));
    });
    const page=await context.newPage();await page.goto(base+'/install');
    const install=page.getByRole('button',{name:'تثبيت AXIA',exact:true});await install.waitFor();
    assert.equal(await page.evaluate(()=>window.axiaInstallPrompts),0);
    await install.click();await page.getByText('يمكنك التثبيت لاحقًا من قائمة المتصفح.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.axiaInstallPrompts),1);
    assert.equal(await install.count(),0);records.push({check:'PWA native prompt requires click; dismissal safe'});await context.close();
  }
  {
    const context=await browser.newContext();
    await context.addInitScript(()=>{
      Object.defineProperty(navigator,'standalone',{value:true,configurable:true});
    });
    const page=await context.newPage();await page.goto(base+'/install');
    await page.getByText('AXIA مفتوح في نافذة تطبيق مستقلة.',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'تثبيت AXIA',exact:true}).count(),0);
    records.push({check:'PWA standalone state (synthetic Apple signal, not real OS installation)'});await context.close();
  }
  {
    const context=await browser.newContext();
    await mockWaitingPwaUpdate(context);
    const page=await context.newPage();await page.goto(base+'/install');
    const update=page.getByRole('complementary',{name:'تحديث AXIA'});await update.waitFor();
    assert.equal(await page.evaluate(()=>window.axiaUpdateMessages),0);
    await update.getByRole('button',{name:'لاحقًا',exact:true}).click();assert.equal(await update.count(),0);
    await page.getByRole('button',{name:'فحص تحديث AXIA',exact:true}).click();await update.waitFor();
    assert.equal(await page.evaluate(()=>window.axiaUpdateMessages),0);
    await update.getByRole('button',{name:'حفظت عملي، أعد التحميل',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.axiaUpdateMessages),1);
    records.push({check:'PWA update deferral/reopen/explicit message (synthetic registration)'});await context.close();
  }
  for(const [width,height] of [[320,568],[390,844],[390,400]]) {
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
    await mockWaitingPwaUpdate(context);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/login');
    const update=page.getByRole('complementary',{name:'تحديث AXIA',exact:true});await update.waitFor();
    await page.getByRole('tab',{name:'طلب ترخيص مكتب',exact:true}).tap();
    assert.equal(await page.getByRole('tab',{name:'طلب ترخيص مكتب',exact:true}).getAttribute('aria-selected'),'true');
    await page.getByRole('tab',{name:'دخول الأعضاء',exact:true}).tap();
    await page.getByRole('button',{name:'إظهار كلمة المرور',exact:true}).tap();
    await page.getByRole('button',{name:'إخفاء كلمة المرور',exact:true}).waitFor();
    const submit=page.getByRole('button',{name:'الدخول الآمن إلى مساحة العمل',exact:true});
    await submit.scrollIntoViewIfNeeded();
    const geometry=await submit.evaluate(el=>{
      const r=el.getBoundingClientRect(),content=document.querySelector('.axia-app-content').getBoundingClientRect(),banner=document.querySelector('.axia-update-banner').getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return {bottom:r.bottom,contentBottom:content.bottom,bannerTop:banner.top,reachable:hit===el||el.contains(hit)};
    });
    assert.ok(geometry.bottom<=geometry.contentBottom+1,JSON.stringify(geometry));
    assert.ok(geometry.contentBottom<=geometry.bannerTop+1,JSON.stringify(geometry));assert.equal(geometry.reachable,true,JSON.stringify(geometry));
    // Native required-field validation; never submit real credentials or contact an Auth provider.
    await submit.tap();assert.equal(await page.getByRole('textbox',{name:'البريد الإلكتروني المهني',exact:true}).evaluate(el=>el.validity.valueMissing),true);
    assert.equal(await page.evaluate(()=>window.axiaUpdateMessages),0,'login interaction must never apply an update');
    await fits(page,`pwa-update-login-${width}-${height}`);
    await page.screenshot({path:path.join(output,`pwa-update-login-${width}-${height}.png`),fullPage:true});
    await update.getByRole('button',{name:'لاحقًا',exact:true}).tap();await update.waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>window.axiaUpdateMessages),0);assert.deepEqual(errors,[]);
    records.push({check:'Waiting PWA update reserves space; mobile login tabs, password toggle and submit remain touch-reachable without applying it',width,height});await context.close();
  }
  {
    // Actual compiled assets + browser Service Worker. No mocked legal/Auth response or external host.
    const gate=await transportGate(base),workerBase=gate.base;
    const context=await browser.newContext({viewport:{width:390,height:844}});
    try {
    let page=await context.newPage();await page.goto(workerBase+'/install');
    await page.getByText('شاشة انقطاع الاتصال جاهزة على هذا المتصفح.',{exact:true}).waitFor({timeout:20000});
    assert.equal(await page.getByRole('complementary',{name:'تحديث AXIA',exact:true}).count(),0,'first installation must not claim an update is waiting');
    await page.reload();
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
    const cached=await page.evaluate(async()=>{const names=(await caches.keys()).filter(n=>n.startsWith('axia-pwa-public-'));return Promise.all(names.map(async name=>({name,urls:(await (await caches.open(name)).keys()).map(r=>new URL(r.url).pathname)})));});
    assert.equal(cached.length,1);assert.equal(cached[0].urls.length,6);
    assert.ok(cached[0].urls.every(url=>url==='/offline.html'||url.startsWith('/pwa/')));
    assert.match(await page.evaluate(async()=>{const name=(await caches.keys()).find(n=>n.startsWith('axia-pwa-public-'));return (await (await caches.open(name)).match('/offline.html')).text();}),/الاتصال غير متاح حاليًا/);
    await context.setOffline(true);gate.setOffline(true);
    // Cold launch from a fresh page exercises document navigation, independent of the active Next router.
    const onlinePage=page;page=await context.newPage();
    const offlineResponse=await page.goto(workerBase+'/platform');
    try { await page.getByRole('heading',{name:'الاتصال غير متاح حاليًا',exact:true}).waitFor({timeout:10000}); }
    catch(error) {
      await page.screenshot({path:path.join(output,'pwa-offline-failure.png'),fullPage:true});
      console.error('PWA offline diagnostic',JSON.stringify({url:page.url(),status:offlineResponse?.status(),fromServiceWorker:offlineResponse?.fromServiceWorker(),response:(await offlineResponse?.text())?.slice(0,2500),body:await page.locator('body').innerText(),workers:await onlinePage.evaluate(async()=>({online:navigator.onLine,controller:navigator.serviceWorker.controller?.scriptURL,registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,state:r.active?.state}))}))}));
      throw error;
    }
    assert.equal(await page.getByRole('textbox').count(),0);
    await fits(page,'pwa-offline-shell-390');
    await page.screenshot({path:path.join(output,'pwa-offline-shell-390.png'),fullPage:true});
    gate.setOffline(false);await context.setOffline(false);await page.goto(workerBase+'/install');
    await page.getByRole('heading',{name:/مكتبك القانوني/}).waitFor();
    records.push({check:'PWA real worker: public-only cache, dropped TCP transport, offline cold launch, reconnect'});
    } finally {await context.close();await gate.close();}
  }
  const manifestResponse=await fetch(base+'/manifest.webmanifest');assert.equal(manifestResponse.status,200);
  const manifest=await manifestResponse.json();assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');
  for(const icon of manifest.icons) {const response=await fetch(base+icon.src);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/image\/png/);}
  const worker=await fetch(base+'/axia-sw.js');assert.equal(worker.status,200);assert.match(worker.headers.get('content-type'),/javascript/);assert.match(worker.headers.get('cache-control'),/no-store/);assert.equal(worker.headers.get('service-worker-allowed'),'/');assert.doesNotMatch(await worker.text(),/__AXIA_RELEASE__/);
  records.push({check:'PWA compiled manifest, PNG assets and worker security headers'});
}
