import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If database credentials are not fully configured yet, let requests pass to render pages
    const isConfigured = 
      url && 
      url !== "" && 
      !url.includes("your-project-id") &&
      key && 
      key !== "" && 
      !key.includes("...") &&
      key.length > 50;

    if (!isConfigured) {
      return supabaseResponse;
    }

    const supabase = createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => 
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session and get user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    const isDashboardRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/ratings") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/settings");

    const isAuthRoute =
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/forgot-password");

    if (isDashboardRoute && !user) {
      const urlClone = request.nextUrl.clone();
      urlClone.pathname = "/login";
      return NextResponse.redirect(urlClone);
    }

    if (isAuthRoute && user) {
      const urlClone = request.nextUrl.clone();
      urlClone.pathname = "/dashboard";
      return NextResponse.redirect(urlClone);
    }
  } catch (err) {
    console.error("Middleware updateSession exception caught:", err);
  }

  return supabaseResponse;
}
