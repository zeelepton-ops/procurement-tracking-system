import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const MIN_PASSWORD_LENGTH = 8

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 })
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 })
    }

    // Password reset functionality temporarily disabled
    // resetTokenHash field was removed from schema
    return NextResponse.json({ error: 'Password reset is not currently available. Please contact an administrator.' }, { status: 400 })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 })
  }
}
