import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(req: NextRequest) {
  if (req.cookies.has("sid")) return NextResponse.next()
  if (req.nextUrl.pathname.startsWith("/api")) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  return NextResponse.redirect(new URL("/login", req.url))
}

export const config = {
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
}
