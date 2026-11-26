import assert from 'node:assert/strict';
import path from 'node:path';
import {mockWaitingPwaUpdate} from './verify-pwa-ui.mjs';

export async function verifyNativeUi({browser,base,output,records,fits,fixtureContext}) {
  async function toolbarReachable(page) {
    for (const button of await page.locator('.axia-toolbar button').all()) {
      if (!await button.isVisible()) continue;
      assert.equal(await button.evaluate(el=>{
        const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        return hit===el||el.contains(hit);
      }),true,`Workspace toolbar control must be reachable: ${await button.getAttribute('aria-label')||await button.getAttribute('title')}`);
    }
  }
  for(const [width,height,theme] of [[320,568,'dark'],[390,844,'light'],[768,1024,'dark'],[1440,900,'light']]) {
    const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});
    await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
    const page=await context.newPage();await page.goto(base+'/login');
    await page.getByRole('textbox',{name:'البريد الإلكتروني المهني',exact:true}).waitFor();
    const header=page.getByRole('banner');
    await fits(page,`native-login-${width}-${theme}`);
    const brand=header.locator('[data-brand-wordmark]');
    assert.equal(await brand.evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap');
    assert.equal(await brand.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
    for(const button of await header.getByRole('button').all()) if(await button.isVisible()) assert.ok((await button.boundingBox()).height>=44,`Header button needs 44px at ${width}px: ${await button.innerText()}`);
    assert.ok(await page.getByRole('textbox',{name:'البريد الإلكتروني المهني',exact:true}).evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=16);
    const promo=page.getByRole('region',{name:'AXIA على جهازك',exact:true});await promo.waitFor();
    assert.ok(await promo.getByRole('link',{name:'طريقة التثبيت',exact:true}).count()===1||await promo.getByRole('button',{name:'تثبيت AXIA',exact:true}).count()===1);
    assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('button')).scrollBehavior),'auto');
    await page.screenshot({path:path.join(output,`native-login-${width}-${theme}.png`),fullPage:true});
    records.push({check:'Native-style login: toolbar, readable inputs, install promotion and reduced motion',width,theme});await context.close();
  }
  for (const width of [320,768,1024,1440]) {
    const {context}=await fixtureContext({width,height:900},'dark');
    const page=await context.newPage();await page.goto(base+'/');
    await page.locator('span[title="مكتب الاختبار المصرح به — اسم طويل للتحقق من عرض الحساب"]').waitFor({state:'attached'});
    await toolbarReachable(page);await fits(page,`native-workspace-${width}`);
    await page.screenshot({path:path.join(output,`native-workspace-${width}.png`),fullPage:true});
    if(width===768) {
      await page.getByRole('button',{name:'البحث الشامل في القضايا والموكلين والمستندات (Ctrl+K)',exact:true}).click();
      const search=page.getByRole('dialog',{name:'البحث الشامل',exact:true});await search.waitFor();
      assert.ok((await search.boundingBox()).height>=850,'tablet search must cover the viewport, not just the blurred toolbar');
      assert.ok(await search.getByRole('textbox').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=16);
      assert.ok((await search.getByRole('button',{name:'إلغاء',exact:true}).boundingBox()).height>=44);
      await search.getByRole('textbox').fill('مهمة');
      await search.getByRole('button',{name:'إلغاء',exact:true}).click();await search.waitFor({state:'hidden'});
    }
    records.push({check:'Workspace toolbar buttons are reachable without overlap; tablet search uses the full viewport',width});await context.close();
  }
  {
    const {context}=await fixtureContext({width:390,height:844},'dark');await mockWaitingPwaUpdate(context);
    const page=await context.newPage();await page.goto(base+'/');
    const update=page.getByRole('complementary',{name:'تحديث AXIA',exact:true});await update.waitFor();
    await toolbarReachable(page);
    assert.ok(await page.locator('.axia-workspace').evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('.axia-update-banner').getBoundingClientRect().top+1));
    await page.getByRole('button',{name:'فتح قائمة التنقل',exact:true}).click();
    const nav=page.getByRole('navigation',{name:'أقسام المكتب',exact:true});await nav.getByRole('button',{name:/القضايا والملفات/}).click();
    await page.getByRole('heading',{name:'سجل القضايا والمنازعات',exact:true}).waitFor();await update.waitFor();
    await fits(page,'pwa-update-workspace-390');records.push({check:'Waiting PWA update resizes workspace and preserves mobile read-only navigation'});await context.close();
  }
  {
    const {context}=await fixtureContext({width:390,height:844},'dark');
    let requests=0;const privateTitle='PRIVATE LEGAL TASK TITLE';
    const owner='00000000-0000-4000-8000-000000000001',due=new Date(Date.now()+30*60000).toISOString();
    await context.route('**/api/tasks',route=>route.fulfill({json:{organizationId:'office-test',userId:owner,assigneeLabel:'مالك الاختبار',canReassign:true,matters:[],assignees:[],tasks:[{id:'00000000-0000-4000-8000-000000000101',title:privateTitle,category:'قلم المحضرين',courtOrBailiffOffice:'PRIVATE COURT',assignedToUserId:owner,assignedTo:'PRIVATE PERSON',deadline:due,priority:'عاجلة',status:'قيد التنفيذ'}]}}));
    context.on('request',r=>{if(r.url().includes('/api/maps/travel-time'))requests++;});
    await context.addInitScript(()=>{
      window.axiaPermissionRequests=0;window.axiaNativeMessages=[];let permission='default';
      window.Notification=class {constructor(){throw new Error('Mobile notification constructor must not be used');}static get permission(){return permission;}static async requestPermission(){window.axiaPermissionRequests++;permission='granted';return permission;}};
      Object.defineProperty(navigator.serviceWorker,'getRegistration',{configurable:true,value:async()=>({active:{scriptURL:location.origin+'/axia-sw.js'},showNotification:async(title,options)=>window.axiaNativeMessages.push({title,options})})});
    });
    const page=await context.newPage();await page.goto(base+'/');
    await page.getByRole('button',{name:'الإشعارات',exact:true}).waitFor();
    await toolbarReachable(page);
    await page.screenshot({path:path.join(output,'native-workspace-390.png'),fullPage:true});
    await page.getByRole('button',{name:'الإشعارات',exact:true}).click();
    const modal=page.getByRole('dialog',{name:'الإشعارات والتذكيرات',exact:true});await modal.waitFor();
    await modal.getByText(privateTitle,{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.axiaPermissionRequests),0);
    assert.equal(requests,0,'notifications must not request invented travel estimates');
    await modal.getByRole('button',{name:'السماح بتذكيرات الجهاز',exact:true}).click();
    await modal.getByRole('button',{name:'إيقاف التذكيرات لهذه الجلسة',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.axiaPermissionRequests),1);
    await page.waitForFunction(()=>window.axiaNativeMessages.length>0);
    const messages=await page.evaluate(()=>window.axiaNativeMessages);assert.doesNotMatch(JSON.stringify(messages),/PRIVATE/);
    await modal.getByRole('button',{name:'إرسال إشعار تجريبي',exact:true}).click();
    await modal.getByText(/تم طلب عرض الإشعار التجريبي/).waitFor();
    await modal.getByRole('button',{name:/الجلسات \(/}).click();
    await modal.getByText('لا توجد تذكيرات في هذه القائمة من البيانات المحمّلة.',{exact:true}).waitFor();
    await fits(page,'native-notifications-390');await page.screenshot({path:path.join(output,'native-notifications-390.png'),fullPage:true});
    assert.ok(await modal.evaluate(el=>el.contains(document.activeElement)));
    await page.keyboard.press('Escape');await modal.waitFor({state:'hidden'});
    await toolbarReachable(page);
    await page.getByRole('button',{name:'فتح قائمة التنقل',exact:true}).click();
    const navigation=page.getByRole('navigation',{name:'أقسام المكتب',exact:true});
    for(const label of ['نظرة عامة','قلم المحضرين والمهام','إدارة المكتب والترخيص'])assert.ok(await navigation.getByText(label,{exact:true}).evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=16);
    await fits(page,'native-sidebar-390');await page.screenshot({path:path.join(output,'native-sidebar-390.png'),fullPage:true});
    records.push({check:'Native reminder sheet: authorized data, explicit permission, SW API, generic OS payload, no fake hearings/travel, focus and 16px navigation'});await context.close();
  }
  {
    const {context}=await fixtureContext({width:320,height:568},'light');
    await context.route('**/api/hearings',route=>route.fulfill({status:503,json:{error:'fixture failure'}}));
    const page=await context.newPage();await page.goto(base+'/');await page.getByRole('button',{name:'الإشعارات',exact:true}).click();
    const modal=page.getByRole('dialog',{name:'الإشعارات والتذكيرات',exact:true});
    await modal.getByText('تعذر تحميل بيانات التذكيرات. افتح سجل المهام أو الجلسات للمراجعة وإعادة المحاولة.',{exact:true}).waitFor();
    assert.equal(await modal.getByRole('button',{name:'السماح بتذكيرات الجهاز',exact:true}).isEnabled(),false);
    await fits(page,'native-notifications-error-320');records.push({check:'Notification load failure never becomes an empty-success list or enables reminder delivery'});await context.close();
  }
}
