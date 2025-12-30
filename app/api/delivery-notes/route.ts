import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if table exists by attempting a query
    let deliveryNotes = []
    try {
      deliveryNotes = await prisma.deliveryNote.findMany({
        include: {
          jobOrder: {
            select: {
              id: true,
              jobNumber: true,
              productName: true
            }
          },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (dbError) {
      // Table doesn't exist yet, return empty array
      console.error('DeliveryNote table may not exist yet:', dbError)
      return NextResponse.json([])
    }

    return NextResponse.json(deliveryNotes)
  } catch (error) {
    console.error('Failed to fetch delivery notes:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if delivery note number already exists
    const existing = await prisma.deliveryNote.findUnique({
      where: { deliveryNoteNumber: body.deliveryNoteNumber }
    })

    if (existing) {
      return NextResponse.json({ error: 'Delivery Note Number already exists' }, { status: 400 })
    }

    const deliveryNote = await prisma.deliveryNote.create({
      data: {
        deliveryNoteNumber: body.deliveryNoteNumber,
        date: new Date(),
        jobOrderId: body.jobOrderId || null,
        client: body.client,
        country: body.country,
        division: body.division,
        department: body.department,
        fabrication: body.fabrication,
        refPoNumber: body.refPoNumber,
        shipmentTo: body.shipmentTo,
        comments: body.comments,
        shipmentType: body.shipmentType,
        representativeName: body.representativeName,
        representativeNo: body.representativeNo,
        qidNumber: body.qidNumber,
        vehicleNumber: body.vehicleNumber,
        vehicleType: body.vehicleType,
        createdBy: session.user.email
      },
      include: {
        jobOrder: {
          select: {
            id: true,
            jobNumber: true,
            productName: true
          }
        },
        items: true
      }
    })

    return NextResponse.json(deliveryNote, { status: 201 })
  } catch (error) {
    console.error('Failed to create delivery note:', error)
    return NextResponse.json({ error: 'Failed to create delivery note' }, { status: 500 })
  }
}
