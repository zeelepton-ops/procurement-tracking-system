import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const shift = searchParams.get('shift')

    if (!date || !shift) {
      return NextResponse.json({ error: 'Date and shift are required' }, { status: 400 })
    }

    const schedules = await prisma.transportSchedule.findMany({
      where: {
        date: new Date(date),
        shift: shift
      },
      include: {
        worker: true,
        vehicle: true
      },
      orderBy: [
        { vehicle: { vehicleNumber: 'asc' } },
        { worker: { priority: 'desc' } }
      ]
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}
