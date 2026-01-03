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

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
        resetRequestedAt: new Date(),
      },
    })

    const resetLink = buildResetLink(rawToken)
    const subject = 'Reset your NBTC Procurement password'
    const text = `Hello ${user.name},\n\nWe received a request to reset your password. Use the link below to set a new password.\n\n${resetLink}\n\nIf you did not request this, you can ignore this email.`
    const html = `
      <p>Hello ${user.name},</p>
      <p>We received a request to reset your password. Use the button below to set a new password.</p>
      <p style="margin: 24px 0;"><a href="${resetLink}" style="background:#1d4ed8;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block">Reset Password</a></p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `

    const emailResult = await sendEmail({ to: user.email, subject, text, html })

    if (!emailResult.success) {
      console.error('Failed to send reset password email:', emailResult.error)
      return NextResponse.json({ error: 'Unable to send reset email. Please contact an administrator.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'If an account exists, we have sent reset instructions.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to start password reset.' }, { status: 500 })
  }
}
