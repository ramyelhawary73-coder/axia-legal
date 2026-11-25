import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
const template = fs.readFileSync("src/pwa/service-worker.js", "utf8");
let release = process.env.VERCEL_GIT_COMMIT_SHA;
if (!release) {
  try { release = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { release = "local"; }
}
const version = crypto.createHash("sha256").update(template).update(release).digest("hex").slice(0, 20);
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/axia-sw.js", template.replace("__AXIA_RELEASE__", version));
console.log("Prepared versioned public-only PWA worker");
