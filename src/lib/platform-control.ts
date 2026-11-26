export type PlatformState = "ready" | "mfa_required";
export type PlatformOffice = { id: string; name: string; slug: string; createdAt: string };
export type PlatformAudit = { id: string; actorId: string | null; actorType: "user" | "operator"; subjectId: string | null; action: string; createdAt: string };
export type PlatformPage<T> = { items: T[]; nextCursor: string | null };

export const PLATFORM_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server-only switch: no real Auth/MFA calls until activation is separately approved.
export function getPlatformControlConfig(): { origin: string } | null {
  if (process.env.AXIA_PLATFORM_CONTROL_ENABLED !== "1") return null;
  try {
    const url = new URL(process.env.AXIA_PLATFORM_CONTROL_ORIGIN ?? "");
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return { origin: url.origin };
  } catch { return null; }
}

export function platformPagination(url: string) {
  const params = new URL(url).searchParams;
  if ([...params.keys()].some(key => !["limit", "after"].includes(key) || params.getAll(key).length !== 1)) return null;
  const rawLimit = params.get("limit") ?? "20";
  const after = params.get("after");
  if (!/^\d{1,2}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 50 || (after !== null && !PLATFORM_UUID.test(after))) return null;
  return { p_limit: Number(rawLimit), p_after_id: after };
}

export async function readPlatformBody(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > 4096)) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0, text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return null; }
      text += decoder.decode(value, { stream: true });
    }
    const value = JSON.parse(text + decoder.decode());
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch { return null; } finally { reader.releaseLock(); }
}
