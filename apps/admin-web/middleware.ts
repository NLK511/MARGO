import { NextResponse, type NextRequest } from 'next/server';
import { isAdminRouteAllowed, parseDevSessionCookie, routeModuleForPath } from './app/admin-context';

const PUBLIC_PATHS = ['/login', '/module-unavailable'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const session = parseDevSessionCookie(request.cookies.get('margo_dev_session')?.value);
  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isAdminRouteAllowed(pathname, session)) {
    const unavailableUrl = request.nextUrl.clone();
    unavailableUrl.pathname = '/module-unavailable';
    unavailableUrl.searchParams.set('module', routeModuleForPath(pathname) ?? 'unknown');
    return NextResponse.rewrite(unavailableUrl, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
