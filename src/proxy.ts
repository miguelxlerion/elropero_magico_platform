import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "magco_session";

// Rutas que exigen sesión (el rol admin lo verifica cada layout/ruta con requireAdmin).
const PROTECTED_PREFIXES = ["/admin", "/api/admin", "/api/ai"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// El manual de marca se embebe en /manual, asi que admite marco desde el propio origen.
// El resto del sitio sigue con DENY: ninguna pagina propia lo enmarca.
const SAME_ORIGIN_FRAMEABLE = ["/manual/manual-de-marca.html"];

function withSecurityHeaders(res: NextResponse, pathname: string) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", SAME_ORIGIN_FRAMEABLE.includes(pathname) ? "SAMEORIGIN" : "DENY");
  res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), payment=()");
  return res;
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isProtected(pathname) && !req.cookies.get(SESSION_COOKIE)?.value) {
    if (pathname.startsWith("/api/")) {
      return withSecurityHeaders(NextResponse.json({ error: "No autorizado" }, { status: 401 }), pathname);
    }
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return withSecurityHeaders(NextResponse.redirect(login), pathname);
  }

  return withSecurityHeaders(NextResponse.next(), pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|glb|css|js)).*)"],
};
