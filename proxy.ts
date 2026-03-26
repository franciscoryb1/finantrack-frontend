import { NextRequest, NextResponse } from "next/server";

// Rutas públicas que no requieren autenticación
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const hasSession = !!(accessToken || refreshToken);

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Usuario sin sesión intentando acceder a ruta protegida
  if (!hasSession && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Usuario con sesión intentando acceder a rutas públicas → redirigir al inicio
  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplica a todas las rutas excepto assets estáticos y API routes de Next.js
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
