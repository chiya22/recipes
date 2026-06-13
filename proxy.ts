import { NextResponse, type NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/auth/session";

// 未認証でもアクセス可能なパス
const PUBLIC_PATHS = ["/login"];

/**
 * 認証の楽観的チェック（Optimistic check）。
 * Cookie の JWT 署名のみを検証し、DB アクセスは行わない。
 * 本番の認可は各 Route Handler / Server Action / DAL で行う（多層防御）。
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(token);

  if (!session && !isPublic) {
    const url = new URL("/login", req.nextUrl);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // api / 静的アセットには適用しない
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
