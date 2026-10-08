import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "magco_session";

// Rutas que exigen sesión (el rol admin lo verifica cada layout/ruta con requireAdmin).
const PROTECTED_PREFIXES = ["/admin", "/api/admin", "/api/ai"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), payment=()");
  return res;
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isProtected(pathname) && !req.cookies.get(SESSION_COOKIE)?.value) {
    if (pathname.startsWith("/api/")) {
      return withSecurityHeaders(NextResponse.json({ error: "No autorizado" }, { status: 401 }));
    }
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return withSecurityHeaders(NextResponse.redirect(login));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|glb|css|js)).*)"],
};
