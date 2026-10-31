import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { classifyRoute } from "@/lib/auth/routes";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

// Refreshes the session cookie and makes early redirects. This is only a first
// check: pages, server actions and RLS each enforce access themselves.
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const access = classifyRoute(pathname);

  const redirectTo = (path: string, next?: string) => {
    const target = request.nextUrl.clone();
    target.pathname = path;
    target.search = next ? `?next=${encodeURIComponent(next)}` : "";
    const redirect = NextResponse.redirect(target);
    // Keep any refreshed session cookies on the redirect.
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  if (!user && access === "user") return redirectTo("/login", pathname + search);
  if (!user && access === "admin") return redirectTo("/admin/login", pathname + search);
  if (user && access === "guest") return redirectTo("/dashboard");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
