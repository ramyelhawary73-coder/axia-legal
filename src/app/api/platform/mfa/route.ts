import { getPlatformControlConfig, PLATFORM_UUID, readPlatformBody } from "@/lib/platform-control";
import { platformError, platformJson, resolvePlatformContext } from "@/lib/api/platform";

type MfaFactor = { id: string; factor_type: string; status: string };

export async function GET() {
  const context = await resolvePlatformContext(true);
  if (!context.ok) return platformError(context.code);
  try {
    const { data, error } = await context.supabase.auth.mfa.listFactors();
    if (error || !Array.isArray(data?.all)) return platformError("MFA_UNAVAILABLE");
    return platformJson({ factors: data.all.filter((f: MfaFactor) => f.factor_type === "totp").map((f: MfaFactor) => ({ id: f.id, status: f.status })) });
  } catch { return platformError("MFA_UNAVAILABLE"); }
}

export async function POST(request: Request) {
  const config = getPlatformControlConfig();
  if (!config) return platformError("PLATFORM_DISABLED");
  if (request.headers.get("origin") !== config.origin) return platformError("PLATFORM_FORBIDDEN");
  const body = await readPlatformBody(request);
  if (!body || !["enroll", "verify"].includes(String(body.action)) || Object.keys(body).some(k => !["action", "factorId", "code"].includes(k))) return platformError("VALIDATION_ERROR");
  if (body.action === "verify" && (typeof body.factorId !== "string" || !PLATFORM_UUID.test(body.factorId) || typeof body.code !== "string" || !/^\d{6}$/.test(body.code))) return platformError("VALIDATION_ERROR");
  const context = await resolvePlatformContext(true);
  if (!context.ok) return platformError(context.code);
  try {
    const { data: factors, error: listError } = await context.supabase.auth.mfa.listFactors();
    if (listError || !Array.isArray(factors?.all)) return platformError("MFA_UNAVAILABLE");
    if (body.action === "enroll") {
      if (Object.keys(body).length !== 1) return platformError("VALIDATION_ERROR");
      if (factors.all.some((f: MfaFactor) => f.factor_type === "totp")) return platformError("MFA_PENDING");
      const { data, error } = await context.supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "AXIA Platform" });
      if (error || !data || data.type !== "totp") return platformError("MFA_UNAVAILABLE");
      // The QR necessarily contains the enrollment secret: never log/cache/persist it.
      return platformJson({ factorId: data.id, qrCode: data.totp.qr_code });
    }
    if (!factors.all.some((f: MfaFactor) => f.id === body.factorId && f.factor_type === "totp")) return platformError("PLATFORM_FORBIDDEN");
    const { error } = await context.supabase.auth.mfa.challengeAndVerify({ factorId: String(body.factorId), code: String(body.code) });
    if (error) return platformError(error.status === 429 ? "RATE_LIMIT" : "MFA_UNAVAILABLE");
    const freshUser = await context.supabase.auth.getUser();
    const freshRole = await context.supabase.rpc("axia_platform_context");
    if (freshUser.error || freshUser.data.user?.id !== context.userId || freshRole.error || freshRole.data?.state !== "ready" || freshRole.data?.version !== 1 || freshRole.data?.userId !== context.userId) return platformError("PLATFORM_FORBIDDEN");
    return platformJson({ verified: true });
  } catch { return platformError("MFA_UNAVAILABLE"); }
}

// No GET credential consumption and no Auth user/factor deletion endpoint.
