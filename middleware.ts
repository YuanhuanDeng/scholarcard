import { NextResponse, type NextRequest } from 'next/server';

/**
 * Subdomain routing middleware
 *
 * This is the magic that makes "user.scholarcard.app" work without
 * actually deploying a separate site for each user.
 *
 * - scholarcard.app          → main app (landing, onboarding, dashboard)
 * - www.scholarcard.app      → same as main app
 * - localhost / *.vercel.app → main app (for dev/preview)
 * - {anything}.scholarcard.app → rewritten to /sites/{anything}
 *
 * The user sees "user.scholarcard.app/about" in their browser,
 * but Next.js renders /sites/user/about behind the scenes.
 */

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'scholarcard.app';

// Subdomains that should NOT be treated as user sites
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'docs',
  'blog',
  'mail',
  'localhost',
]);

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Strip port number if present (localhost:3000 → localhost)
  const hostnameClean = hostname.split(':')[0];

  // For local dev: localhost or 127.0.0.1 → treat as main app
  if (
    hostnameClean === 'localhost' ||
    hostnameClean === '127.0.0.1' ||
    hostnameClean.endsWith('.vercel.app')
  ) {
    return NextResponse.next();
  }

  // Extract subdomain
  // "yuanhuan.scholarcard.app" → "yuanhuan"
  // "scholarcard.app" → "" (no subdomain)
  const domainParts = hostnameClean.split('.');
  const isApex =
    hostnameClean === APP_DOMAIN ||
    domainParts.length <= 2;

  if (isApex) {
    return NextResponse.next();
  }

  const subdomain = domainParts[0];

  // Reserved subdomains → main app
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.next();
  }

  // It's a user subdomain — rewrite to /sites/[username]
  url.pathname = `/sites/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (.png, .svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
