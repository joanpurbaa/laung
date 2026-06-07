import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route yang butuh auth
const PROTECTED_ROUTES = ["/history"];

// Route khusus auth (tidak boleh diakses kalau sudah login)
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek token dari cookie (sesuaikan nama cookie dengan BE kamu)
  const token = request.cookies.get("auth_token")?.value;
  const isAuthenticated = !!token;

  // Kalau akses route protected tanpa auth → redirect ke /login
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname); // simpan tujuan asal
    return NextResponse.redirect(loginUrl);
  }

  // Kalau sudah login tapi akses /login atau /register → redirect ke /
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan middleware hanya di route ini
  matcher: ["/history/:path*", "/login", "/register"],
};
