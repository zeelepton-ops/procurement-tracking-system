export { default } from 'next-auth/middleware'

export const config = {
  // Exclude all API routes from the auth middleware so API endpoints
  // can return JSON/401 responses instead of being redirected to login.
  matcher: [
    '/((?!api|login|register|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
