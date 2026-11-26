import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Exact public installation/help assets only; protected work routes remain matched.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|install$|install/$|manifest\\.webmanifest$|axia-sw\\.js$|offline\\.html$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
