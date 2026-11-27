import { spawnSync } from "node:child_process";
// Read-only baseline report: no automatic upgrades, provider access, or hosted credentials.
const report=spawnSync("npm",["audit","--omit=dev","--json"],{encoding:"utf8",timeout:60000,maxBuffer:4*1024*1024});
if(report.error||report.status>1)throw new Error("Root production audit report unavailable");
const data=JSON.parse(report.stdout);
if(!data.metadata?.vulnerabilities)throw new Error("Root dependency audit did not produce a valid report");
console.log("AXIA_ROOT_AUDIT_META="+JSON.stringify({counts:data.metadata?.vulnerabilities,packages:Object.entries(data.vulnerabilities??{}).map(([name,value])=>({name,severity:value.severity,isDirect:value.isDirect,range:value.range,fixAvailable:value.fixAvailable}))}));
if(data.metadata.vulnerabilities.critical||data.metadata.vulnerabilities.high)throw new Error("High/critical runtime dependency findings block Push acceptance");
