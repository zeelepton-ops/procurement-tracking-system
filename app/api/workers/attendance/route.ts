import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')
    const month = searchParams.get('month')

    const whereClause: any = {}
    if (workerId) whereClause.workerId = workerId
    if (month) whereClause.month = month

    const attendances = await prisma.workerAttendance.findMany({
      where: whereClause,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            qid: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(attendances)
  } catch (error) {
    console.error('Failed to fetch attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const attendance = await prisma.workerAttendance.create({
      data: {
        workerId: body.workerId,
        date: new Date(body.date),
        checkIn: body.checkIn ? new Date(body.checkIn) : null,
        checkOut: body.checkOut ? new Date(body.checkOut) : null,
        status: body.status || 'PRESENT',
        workHours: body.workHours || null,
        overtimeHours: body.overtimeHours || null,
        notes: body.notes || null,
        createdBy: session.user?.email || 'system'
      }
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Failed to create attendance:', error)
    return NextResponse.json({ error: 'Failed to create attendance' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    const attendance = await prisma.workerAttendance.update({
      where: { id },
      data: {
        ...updateData,
        date: updateData.date ? new Date(updateData.date) : undefined,
        checkIn: updateData.checkIn ? new Date(updateData.checkIn) : undefined,
        checkOut: updateData.checkOut ? new Date(updateData.checkOut) : undefined,
        updatedBy: session.user?.email || 'system'
      }
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Failed to update attendance:', error)
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
  }
}
