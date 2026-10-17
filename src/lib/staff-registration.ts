import { normalizeStaffEmail } from "@/lib/staff-invitations";

// Server-only activation: preparing this feature must not send hosted Auth mail.
export function getStaffRegistrationConfig(): { origin: string } | null {
  if (process.env.AXIA_STAFF_REGISTRATION_ENABLED !== "1") return null;
  const value = process.env.AXIA_STAFF_REGISTRATION_ORIGIN;
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" || url.username || url.password ||
      url.search || url.hash || url.pathname !== "/"
    ) return null;
    return { origin: url.origin };
  } catch {
    return null;
  }
}

export function registrationCredentials(body: Record<string, unknown> | null) {
  const email = normalizeStaffEmail(body?.email);
  const password = body?.password;
  if (
    !email || typeof password !== "string" || password.length < 12 ||
    password.length > 128 || !password.trim() || password !== body?.passwordConfirmation
  ) return null;
  return { email, password };
}

// Never accept recovery/invite actions or an arbitrary `next` redirect here.
export function confirmationCredential(url: URL) {
  const code = url.searchParams.get("code");
  const hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const valid = (value: string | null): value is string =>
    value !== null && /^[A-Za-z0-9._~-]{1,2048}$/.test(value);
  if (valid(code) && !url.searchParams.has("token_hash") &&
      !url.searchParams.has("type") && url.searchParams.getAll("code").length === 1)
    return { code };
  if (valid(hash) && !url.searchParams.has("code") &&
      (type === "email" || type === "signup") &&
      url.searchParams.getAll("token_hash").length === 1 &&
      url.searchParams.getAll("type").length === 1)
    return { token_hash: hash, type };
  return null;
}
