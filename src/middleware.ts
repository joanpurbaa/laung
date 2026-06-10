import { auth } from "~/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;

  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/history") ||
    nextUrl.pathname.startsWith("/profile");

  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  if (isProtectedRoute && !isLoggedIn) {
    const from = encodeURIComponent(nextUrl.pathname);
    return NextResponse.redirect(new URL(`/login?from=${from}`, nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    const from = nextUrl.searchParams.get("from");
    const redirectTo = from?.startsWith("/") ? from : "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
