// REVIEW ONLY. No deployed resource, secret or schedule is created by this module.
// Cloudflare holds a dedicated timer HMAC only; no database/VAPID/device data.
export const project = "qshgczulivsxztgrbqew";
export const scope = "axia-push-preview-v1";
export const endpoint = `https://${project}.supabase.co/functions/v1/axia-push-preview`;
const encoder = new TextEncoder();
const denied = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

// Explicit dependencies allow offline tests without credentials or outbound requests.
export function createTimer({ fetcher = fetch, subtle = crypto.subtle, now = Date.now } = {}) {
  return {
    // Even an accidentally enabled route cannot be used to dispatch or inspect configuration.
    fetch: denied,
    async scheduled(event, env) {
      if (env.AXIA_PUSH_TIMER_ENABLED !== "1") return "DISABLED";
      const start = Date.parse(env.AXIA_PUSH_WINDOW_STARTED_AT ?? "");
      const end = Date.parse(env.AXIA_PUSH_APPROVED_UNTIL ?? "");
      let time = now();
      if (env.AXIA_PUSH_SCOPE !== scope || env.AXIA_PUSH_EXPECTED_SUPABASE_REF !== project ||
          env.AXIA_PUSH_DEPLOYMENT_MODE !== "preview" || event.cron !== "* * * * *" ||
          !Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 1800000 ||
          time < start || time >= end || !Number.isFinite(event.scheduledTime) ||
          event.scheduledTime < start || event.scheduledTime >= end ||
          time - event.scheduledTime < -5000 || time - event.scheduledTime > 60000 ||
          !/^[A-Za-z0-9_-]{43}$/.test(env.AXIA_PUSH_CRON_HMAC_KEY ?? "")) return "DENIED";
      try {
        const key = await subtle.importKey("raw", encoder.encode(env.AXIA_PUSH_CRON_HMAC_KEY),
          { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        time = now();
        if (time < start || time >= end || time - event.scheduledTime > 60000) return "DENIED";
        const issued = Math.floor(time / 1000).toString();
        const signature = await subtle.sign("HMAC", key,
          encoder.encode(`axia-push-cron-v1\n${project}\n${scope}\n${issued}`));
        // Recheck after async cryptography; no fetch can start after the local cutoff.
        if (now() >= end || now() < start) return "DENIED";
        const mac = Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, "0")).join("");
        const result = await fetcher(endpoint, {
          // workerd supports manual/follow, not redirect:error. Never follow Location.
          method: "POST", redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(50000),
          headers: { "Content-Type": "application/json", "x-axia-push-issued": issued,
            "x-axia-push-signature": mac }, body: "{}",
        });
        // Never log response bodies, signatures, environment or error objects. No retries.
        await result.body?.cancel();
        return result.status === 202 ? "ACCEPTED_OR_IDLE" : "UNAVAILABLE";
      } catch { return "UNAVAILABLE"; }
    },
  };
}
