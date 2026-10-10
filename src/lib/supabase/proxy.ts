import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

const PUBLIC_ROUTES = ["/login"];
const JSON_AUTH_ROUTES = ["/api/rajih"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
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
  redirectResponse.headers.set("Cache-Control", "private, no-store");

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const config = getSupabasePublicConfig();
  const pathname = request.nextUrl.pathname;

  function unavailable() {
    const headers = { "Cache-Control": "private, no-store" };
    return pathname.startsWith("/api/")
      ? NextResponse.json(
          {
            code: "WORKSPACE_UNAVAILABLE",
            error: "خدمة الدخول غير متاحة مؤقتًا.",
          },
          { status: 503, headers },
        )
      : new NextResponse(
          "خدمة الدخول غير متاحة مؤقتًا. يرجى المحاولة لاحقًا.",
          { status: 503, headers },
        );
  }

  if (!config) {
    // The public form can explain the outage; protected routes always fail closed.
    return matchesRoute(pathname, PUBLIC_ROUTES)
      ? NextResponse.next({ request })
      : unavailable();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  let result: Awaited<ReturnType<typeof supabase.auth.getClaims>>;
  try {
    result = await supabase.auth.getClaims();
  } catch {
    return matchesRoute(pathname, PUBLIC_ROUTES)
      ? supabaseResponse
      : unavailable();
  }
  const { data, error } = result;
  supabaseResponse.headers.set("Cache-Control", "private, no-store");
  if (error && "status" in error && Number(error.status) >= 500) {
    return matchesRoute(pathname, PUBLIC_ROUTES)
      ? supabaseResponse
      : unavailable();
  }
  const claims = error ? null : data?.claims;

  if (!claims && !matchesRoute(pathname, PUBLIC_ROUTES)) {
    if (matchesRoute(pathname, JSON_AUTH_ROUTES)) {
      return supabaseResponse;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
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
