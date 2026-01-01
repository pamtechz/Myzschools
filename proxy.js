import { NextResponse } from "next/server"

export function proxy(request) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/setup", "/api/public"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // In a real Firebase app, we'd check for a session cookie here.
  // Since Firebase Auth is client-side by default in this setup,
  // we rely on client-side protection for the preview.

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
