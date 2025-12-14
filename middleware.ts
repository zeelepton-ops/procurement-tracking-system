export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/((?!api/auth|api/health|login|register|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
