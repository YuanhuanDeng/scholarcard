import { NextResponse, type NextRequest } from 'next/server';

/**
 * Subdomain routing middleware
 *
 * - scholarcard.app          → main app
 * - www.scholarcard.app      → main app
 * - localhost / *.vercel.app → main app (dev/preview)
 * - {user}.scholarcard.app   → rewritten to /sites/{user}
 */

const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'admin', 'docs', 'blog', 'mail', 'localhost',
]);

export function middleware(request: NextRequest) {
  try {
    const hostname = request.headers.get('host') || '';
    const hostnameClean = hostname.split(':')[0];

    // Dev / preview deployments → pass through
    if (
      hostnameClean === 'localhost' ||
      hostnameClean === '127.0.0.1' ||
      hostnameClean.endsWith('.vercel.app')
    ) {
      return NextResponse.next();
    }

    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'scholarcard.app';
    const domainParts = hostnameClean.split('.');

    // Apex domain (scholarcard.app) or too few parts → main app
    if (hostnameClean === appDomain || domainParts.length <= 2) {
      return NextResponse.next();
    }

    const subdomain = domainParts[0];

    // Reserved subdomains → main app
    if (RESERVED_SUBDOMAINS.has(subdomain)) {
      return NextResponse.next();
    }

    // User subdomain → rewrite to /sites/[username]
    const url = request.nextUrl.clone();
    url.pathname = `/sites/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
};
