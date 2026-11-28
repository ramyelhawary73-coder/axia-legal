import test from "node:test";
import assert from "node:assert/strict";
import { createECDH, randomBytes } from "node:crypto";
import webpush from "web-push";
test("pinned Web Push SDK constructs a standards-based VAPID request with no legal payload",()=>{
  // Ephemeral, discarded test-only keys. Never create hosted credentials or contact a provider.
  const keys=webpush.generateVAPIDKeys(), ecdh=createECDH("prime256v1");
  const subscription={endpoint:"https://fcm.googleapis.com/fcm/send/abcdefghijklmnopqrstuvwxyz_123456789",keys:{p256dh:ecdh.generateKeys().toString("base64url"),auth:randomBytes(16).toString("base64url")}};
  const request=webpush.generateRequestDetails(subscription,null,{vapidDetails:{...keys,subject:"https://example.invalid/push-contact"},TTL:90,urgency:"normal",contentEncoding:"aes128gcm"});
  assert.equal(request.endpoint,subscription.endpoint);assert.equal(request.method,"POST");
  assert.equal(Number(request.headers.TTL),90);assert.match(request.headers.Authorization,/^vapid /);
  assert.ok(request.body==null||request.body.length===0);
});
