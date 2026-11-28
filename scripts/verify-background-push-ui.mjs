import assert from "node:assert/strict";
import path from "node:path";
// Synthetic browser contracts only. No real subscription, OS permission, provider or hosted account.
export async function verifyBackgroundPushUi({base,output,records,fits,fixtureContext}) {
  const owner="00000000-0000-4000-8000-000000000001",publicKey=Buffer.from([4,...Array(64).fill(0)]).toString("base64url");
  for(const scenario of ["disabled","denied","enabled"]) {
    const {context}=await fixtureContext({width:scenario==="disabled"?320:390,height:844},"dark");
    const requests=[];let deviceId;
    await context.route("**/api/push/**",async route=>{
      const req=route.request(),action=new URL(req.url()).pathname.split("/").at(-1);
      assert.equal(req.headers()["x-axia-push-client"],"1");assert.equal(req.headers()["x-axia-organization-id"],"office-test");
      if(action==="config")return route.fulfill({json:scenario==="disabled"?{enabled:false}:{enabled:true,testOnly:true,publicKey,csrf:"fixture-csrf",workspace:"office-test:"+owner}});
      assert.equal(req.headers()["x-axia-push-csrf"],"fixture-csrf");const body=req.postDataJSON();requests.push({action,method:req.method(),body});
      if(action==="device"&&req.method()==="POST") {
        assert.deepEqual(Object.keys(body).sort(),["installationId","subscription"]);
        assert.match(body.installationId,/^[0-9a-f-]{36}$/);deviceId=body.installationId;
        return route.fulfill({status:201,json:{id:deviceId,expiresAt:new Date(Date.now()+900000).toISOString()}});
      }
      assert.equal(body.deviceId,deviceId);
      if(action==="test")return route.fulfill({status:202,json:{accepted:true,id:"00000000-0000-4000-8000-000000000090",scheduledAt:new Date(Date.now()+90000).toISOString()}});
      if(action==="device"&&req.method()==="DELETE")return route.fulfill({json:{revoked:true}});
      throw new Error("Unexpected Push fixture request");
    });
    await context.addInitScript(({scenario,publicKey})=>{
      window.axiaBackground={permissionRequests:0,subscribes:0,unsubscribes:0,shows:0};let permission=scenario==="denied"?"denied":"default",current=null;
      Object.defineProperty(window,"PushManager",{configurable:true,value:class {}});
      window.Notification=class {static get permission(){return permission;}static async requestPermission(){window.axiaBackground.permissionRequests++;permission="granted";return permission;}};
      const pushManager={getSubscription:async()=>current,subscribe:async options=>{
        if(options.userVisibleOnly!==true||!(options.applicationServerKey instanceof Uint8Array))throw new Error("Invalid subscription options");
        window.axiaBackground.subscribes++;
        current={options:{applicationServerKey:options.applicationServerKey.buffer},toJSON:()=>({endpoint:"https://fcm.googleapis.com/fcm/send/fixture_abcdefghijklmnopqrstuvwxyz",expirationTime:null,keys:{p256dh:publicKey,auth:"AAAAAAAAAAAAAAAAAAAAAA"}}),
          unsubscribe:async()=>{window.axiaBackground.unsubscribes++;current=null;return true;}};
        return current;
      }};
      Object.defineProperty(navigator.serviceWorker,"getRegistration",{configurable:true,value:async()=>({active:{scriptURL:location.origin+"/axia-sw.js"},pushManager,showNotification:async()=>{window.axiaBackground.shows++;}})});
    },{scenario,publicKey});
    const page=await context.newPage();await page.goto(base+"/");
    await page.getByRole("button",{name:"الإشعارات",exact:true}).click();
    const panel=page.getByRole("region",{name:"اختبار الإرسال والتطبيق مغلق",exact:true});
    await panel.waitFor();assert.deepEqual(await page.evaluate(()=>window.axiaBackground),{permissionRequests:0,subscribes:0,unsubscribes:0,shows:0});
    await panel.getByRole("button",{name:"فحص جاهزية الإرسال في الخلفية",exact:true}).click();
    if(scenario==="disabled") {
      await panel.getByText(/خدمة الخلفية تنتظر اعتماد/).waitFor();
      assert.equal(await panel.getByRole("button",{name:"السماح باختبار الخلفية لهذا الجهاز",exact:true}).count(),0);
    } else {
      await panel.getByText(/خدمة الاختبار جاهزة/).waitFor();
      assert.equal(await page.evaluate(()=>window.axiaBackground.permissionRequests),0);
      await panel.getByRole("button",{name:"السماح باختبار الخلفية لهذا الجهاز",exact:true}).click();
      if(scenario==="denied")await panel.getByText(/لم يُمنح إذن الإشعارات/).waitFor();
      else {
        await panel.getByText(/تم تسجيل جهاز الاختبار مؤقتًا/).waitFor();
        await panel.getByRole("button",{name:"اختبار بعد ٩٠ ثانية",exact:true}).click();
        await panel.getByText(/قبول الطلب لا يؤكد وصول الإشعار/).waitFor();
        assert.equal(requests.length,2);assert.equal(requests[1].action,"test");
        assert.deepEqual(Object.keys(requests[1].body).sort(),["deviceId","requestId"]);
        assert.equal(await page.evaluate(()=>window.axiaBackground.shows),0,"queued test never fakes a local delivery");
        await panel.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,"background-push-enabled-390.png"),fullPage:true});
        await panel.getByRole("button",{name:"إلغاء اشتراك الاختبار",exact:true}).click();
        await panel.getByText(/تم إبطال اشتراك الاختبار على الخادم/).waitFor();
        assert.equal(requests.length,3);assert.equal(requests[2].method,"DELETE");
        assert.deepEqual(await page.evaluate(()=>window.axiaBackground),{permissionRequests:1,subscribes:1,unsubscribes:1,shows:0});
      }
    }
    if(scenario!=="enabled"){assert.equal(requests.length,0);assert.deepEqual(await page.evaluate(()=>window.axiaBackground),{permissionRequests:0,subscribes:0,unsubscribes:0,shows:0});}
    await fits(page,"background-push-"+scenario);records.push({check:"Synthetic background Push consent/queue/revoke; no real OS/provider delivery",scenario});await context.close();
  }
}
