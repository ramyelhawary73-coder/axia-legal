import assert from 'node:assert/strict';
import path from 'node:path';

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
    await context.addInitScript(()=>{
      window.axiaUpdateMessages=0;
      const service=new EventTarget(),registration=new EventTarget();
      registration.active={state:'activated'};registration.installing=null;
      registration.waiting={postMessage:message=>{if(message.type==='AXIA_ACTIVATE_UPDATE')window.axiaUpdateMessages++;}};
      registration.update=async()=>{};service.register=async()=>registration;
      Object.defineProperty(navigator,'serviceWorker',{value:service,configurable:true});
    });
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
  {
    // Actual compiled assets + browser Service Worker. No mocked legal/Auth response or external host.
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();await page.goto(base+'/install');
    await page.getByText('شاشة انقطاع الاتصال جاهزة على هذا المتصفح.',{exact:true}).waitFor({timeout:20000});
    await page.reload();
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
    const cached=await page.evaluate(async()=>{const names=(await caches.keys()).filter(n=>n.startsWith('axia-pwa-public-'));return Promise.all(names.map(async name=>({name,urls:(await (await caches.open(name)).keys()).map(r=>new URL(r.url).pathname)})));});
    assert.equal(cached.length,1);assert.equal(cached[0].urls.length,5);
    assert.ok(cached[0].urls.every(url=>url==='/offline.html'||url.startsWith('/pwa/')));
    await context.setOffline(true);await page.goto(base+'/platform');
    await page.getByRole('heading',{name:'الاتصال غير متاح حاليًا',exact:true}).waitFor();
    assert.equal(await page.getByRole('textbox').count(),0);
    await fits(page,'pwa-offline-shell-390');
    await page.screenshot({path:path.join(output,'pwa-offline-shell-390.png'),fullPage:true});
    await context.setOffline(false);await page.goto(base+'/install');
    await page.getByRole('heading',{name:/مكتبك القانوني/}).waitFor();
    records.push({check:'PWA real worker: public-only cache, offline navigation, reconnect'});await context.close();
  }
  const manifestResponse=await fetch(base+'/manifest.webmanifest');assert.equal(manifestResponse.status,200);
  const manifest=await manifestResponse.json();assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');
  for(const icon of manifest.icons) {const response=await fetch(base+icon.src);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/image\/png/);}
  const worker=await fetch(base+'/axia-sw.js');assert.equal(worker.status,200);assert.match(worker.headers.get('content-type'),/javascript/);assert.match(worker.headers.get('cache-control'),/no-store/);assert.equal(worker.headers.get('service-worker-allowed'),'/');assert.doesNotMatch(await worker.text(),/__AXIA_RELEASE__/);
  records.push({check:'PWA compiled manifest, PNG assets and worker security headers'});
}
