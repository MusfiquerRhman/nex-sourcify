// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const segments: string[] = [];
    try {
        for (const segment of decodeURIComponent(req.nextUrl.pathname).replaceAll('\\', '/').split('/')) {
            if (segment === '..') segments.pop();
            else if (segment && segment !== '.') segments.push(segment);
        }
    } catch {
        return new NextResponse('Invalid path', { status: 400 });
    }

    // Checklist photos must go through the authenticated /uploads route, even though they live in public.
    if (segments[0]?.toLowerCase() === 'sample_checklist') {
        return new NextResponse('File not found', { status: 404 });
    }

    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const isDev = process.env.NODE_ENV === 'development';

    const cspHeader = [
        "default-src 'self'",
        isDev
            ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
            : `script-src 'nonce-${nonce}' 'strict-dynamic' 'self'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; ');

    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", cspHeader);
    response.headers.set("x-nonce", nonce);

    return response;
}

export const config = {
    matcher: [ '/((?!_next/static|_next/image|favicon.ico).*)' ],
};
