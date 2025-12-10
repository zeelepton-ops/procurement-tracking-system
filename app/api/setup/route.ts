import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if admin user exists
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    })

    if (adminExists) {
      return NextResponse.json({
        message: 'Admin user already exists',
        status: 'ready',
      })
    }

    // Create admin user if it doesn't exist
    const hashedPassword = await bcrypt.hash('Admin@123', 10)
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'System Admin',
        hashedPassword,
        role: 'ADMIN',
      },
    })

    return NextResponse.json({
      message: 'Admin user created successfully',
      status: 'initialized',
      email: 'admin@example.com',
      password: 'Admin@123',
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      {
        message: error.message,
        status: 'error',
      },
      { status: 500 }
    )
  }
}
