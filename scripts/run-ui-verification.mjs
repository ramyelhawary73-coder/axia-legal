import { spawn } from "node:child_process";
import fs from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import net from "node:net";

// Keep server and browser in the same disposable process/network context.
const port=3102;
const base=`http://127.0.0.1:${port}`;
const logPath=process.env.AXIA_UI_SERVER_LOG ?? "/tmp/axia-integration-ui-server.log";
const log=fs.openSync(logPath,"w");
const dev=process.env.AXIA_UI_DEV === "1";
const server=spawn(process.execPath,["node_modules/next/dist/bin/next",dev?"dev":"start",...(dev?["--webpack"]:[]),"-p",String(port),"-H","127.0.0.1"],{
  stdio:["ignore",log,log],env:{...process.env,NEXT_TELEMETRY_DISABLED:"1",AXIA_STAFF_REGISTRATION_ENABLED:"0",AXIA_STAFF_REGISTRATION_ORIGIN:""},
});
try {
  let ready=false;
  for(let attempt=0;attempt<45;attempt++) {
    if(server.exitCode!==null) throw new Error(`UI server exited: ${server.exitCode}; see ${logPath}`);
    ready=await new Promise(resolve=>{
      const socket=net.connect({host:"127.0.0.1",port});
      socket.setTimeout(500);
      socket.once("connect",()=>{socket.destroy();resolve(true);});
      socket.once("error",()=>{socket.destroy();resolve(false);});
      socket.once("timeout",()=>{socket.destroy();resolve(false);});
    });
    if(ready) break;
    await delay(500);
  }
  if(!ready) throw new Error(`UI server not ready; see ${logPath}`);
  const code=await new Promise((resolve,reject)=>{
    const test=spawn(process.execPath,["scripts/verify-integration-ui.mjs"],{
      stdio:"inherit",env:{...process.env,AXIA_UI_BASE_URL:base},
    });
    test.on("error",reject);test.on("exit",resolve);
    const timeout=setTimeout(()=>test.kill("SIGTERM"),360000);
    test.on("exit",()=>clearTimeout(timeout));
  });
  if(code!==0) process.exitCode=1;
} finally {
  server.kill("SIGTERM"); fs.closeSync(log);
}
