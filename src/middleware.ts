import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    let cookie = request.cookies.get('adminAuth')
    if (!cookie) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }
}

export const config = {
  matcher: '/admin/dashboard/:path*',
}
