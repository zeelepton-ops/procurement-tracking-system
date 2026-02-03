import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/notifications'

const RESET_TOKEN_EXPIRY_MINUTES = 60

function buildResetLink(token: string) {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || vercelUrl || 'http://localhost:3000'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${normalizedBase}/reset-password?token=${encodeURIComponent(token)}`
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'If an account exists, we have sent reset instructions.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    if (!user || !user.isActive || user.status !== 'APPROVED') {
      return NextResponse.json({ message: 'If an account exists, we have sent reset instructions.' })
    }

    // Password reset functionality temporarily disabled
    // Fields were removed from schema - will implement alternative mechanism
    // For now return success for security

    return NextResponse.json({ message: 'If an account exists, we have sent reset instructions.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to start password reset.' }, { status: 500 })
  }
}
