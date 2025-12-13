import { prisma } from './prisma'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        console.log('🔍 Attempting login for:', credentials.email)
        console.log('🔍 DATABASE_URL set:', !!process.env.DATABASE_URL)

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        console.log('🔍 User found:', !!user)
        if (!user) {
          console.log('❌ User not found in database')
          return null
        }

        // Check if user account is approved
        if (user.status !== 'APPROVED') {
          console.log('❌ User account not approved, status:', user.status)
          throw new Error(`Account ${user.status.toLowerCase()}, pending approval`)
        }

        // Check if user account is active
        if (!user.isActive) {
          console.log('❌ User account is inactive')
          throw new Error('Account inactive')
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword)
        console.log('🔍 Password valid:', isValid)
        if (!isValid) {
          console.log('❌ Password mismatch')
          return null
        }

        console.log('✅ Login successful for:', credentials.email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret',
}
