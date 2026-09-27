import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createMockSupabaseServerClient } from "@/lib/supabase/mock-db";

export async function createClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    return createMockSupabaseServerClient() as unknown as ReturnType<typeof createServerClient>;
  }

  const cookieStore = await cookies();
  const { url, publishableKey } = config;

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Proxy refresh handles that path.
        }
      },
    },
  });
}

