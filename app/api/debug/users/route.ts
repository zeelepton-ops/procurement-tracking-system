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
      },
    })

    return NextResponse.json({
      status: 'connected',
      userCount,
      users,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      },
      { status: 500 }
    )
  }
}
