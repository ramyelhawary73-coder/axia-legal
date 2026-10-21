import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

const PUBLIC_ROUTES = ["/login"];
const INVITATION_ROUTES = ["/invitations/accept"];
const JSON_AUTH_ROUTES = ["/api/rajih", "/api/staff-invitations", "/api/platform", "/api/drafts"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function redirectWithSession(url: URL, sessionResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);

  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = sessionResponse.headers.get(header);
    if (value) redirectResponse.headers.set(header, value);
  }

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const config = getSupabasePublicConfig();

  if (!config) {
    if (process.env.VERCEL_ENV === "production") {
      return new NextResponse("AXIA Legal authentication is not configured.", { status: 503 });
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const claims = error ? null : data?.claims;
  const pathname = request.nextUrl.pathname;
  const staffPublicEndpoint = pathname === "/auth/confirm" || pathname === "/api/staff-registration";

  if (!claims && !staffPublicEndpoint && !matchesRoute(pathname, [...PUBLIC_ROUTES, ...INVITATION_ROUTES])) {
    if (matchesRoute(pathname, JSON_AUTH_ROUTES)) {
      return supabaseResponse;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return redirectWithSession(url, supabaseResponse);
  }

  if (claims && matchesRoute(pathname, PUBLIC_ROUTES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return redirectWithSession(url, supabaseResponse);
  }

  return supabaseResponse;
}
