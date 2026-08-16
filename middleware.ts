// middleware.ts
import { NextResponse } from 'next/server';

export function middleware() {
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