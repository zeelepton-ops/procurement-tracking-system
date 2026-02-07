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
    const status = searchParams.get('status') || 'PENDING'

    let requests = []
    try {
      requests = await prisma.deliveryNoteRequest.findMany({
        where: { status },
        include: {
          jobOrder: { select: { id: true, jobNumber: true, clientName: true } },
          jobOrderItem: { select: { id: true, workDescription: true, quantity: true, unit: true } },
          inspection: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (dbError) {
      console.error('DeliveryNoteRequest table may not exist yet:', dbError)
      return NextResponse.json([])
    }

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Failed to fetch delivery note requests:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const inspectionIds: string[] = Array.isArray(body.inspectionIds) ? body.inspectionIds : []

    if (inspectionIds.length === 0) {
      return NextResponse.json({ error: 'No inspections provided' }, { status: 400 })
    }

    const inspections = await prisma.qualityInspection.findMany({
      where: { id: { in: inspectionIds } },
      include: {
        jobOrderItem: {
          include: { jobOrder: true }
        }
      }
    })

    const existing = await prisma.deliveryNoteRequest.findMany({
      where: { inspectionId: { in: inspectionIds }, status: 'PENDING' },
      select: { inspectionId: true }
    })
    const existingIds = new Set(existing.map(r => r.inspectionId).filter(Boolean) as string[])

    const toCreate = inspections
      .filter(i => !existingIds.has(i.id))
      .map(i => ({
        inspectionId: i.id,
        jobOrderId: i.jobOrderItem?.jobOrder?.id || null,
        jobOrderItemId: i.jobOrderItemId || null,
        requestedBy: session.user.email || session.user.name || 'system',
        status: 'PENDING'
      }))

    if (toCreate.length === 0) {
      return NextResponse.json({ message: 'Requests already exist', created: 0 })
    }

    const created = await prisma.deliveryNoteRequest.createMany({ data: toCreate })
    return NextResponse.json({ message: 'Requests created', created: created.count })
  } catch (error) {
    console.error('Failed to create delivery note requests:', error)
    return NextResponse.json({ error: 'Failed to create requests' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    const updated = await prisma.deliveryNoteRequest.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update delivery note request:', error)
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}
