export async function readJsonResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || fallbackMessage);
  }

  return payload as T;
}
