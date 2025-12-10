import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        hashedPassword: true,
        role: true,
      },
    })

    return NextResponse.json({
      status: 'connected',
      userCount,
      users,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        code: error.code,
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        nodeEnv: process.env.NODE_ENV,
      },
      { status: 500 }
    )
  }
}
