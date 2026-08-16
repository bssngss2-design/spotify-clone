import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.includes("auth-token") ||
        c.name.startsWith("sb-") ||
        c.name.includes("sb-access") ||
        c.name.includes("sb-refresh")
    );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/auth");

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();

    // Network / Supabase unreachable — never force logout
    if (error) {
      console.warn("[middleware] auth getUser error (keeping session):", error.message);
      return response;
    }

    user = data.user;
  } catch (err) {
    console.warn(
      "[middleware] auth getUser threw (keeping session):",
      err instanceof Error ? err.message : err
    );
    return response;
  }

  // Definitive logged-out only when auth server responded with no user
  if (!user && !isAuthPage) {
    // If cookies still look like a session, don't bounce to login on flaky network
    if (hasSupabaseSessionCookie(request)) {
      return response;
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    user &&
    isAuthPage &&
    !request.nextUrl.pathname.startsWith("/auth/callback")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
