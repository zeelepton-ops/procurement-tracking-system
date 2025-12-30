import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deliveryNote = await prisma.deliveryNote.findUnique({
      where: { id: params.id },
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

    if (!deliveryNote) {
      return NextResponse.json({ error: 'Delivery note not found' }, { status: 404 })
    }

    return NextResponse.json(deliveryNote)
  } catch (error) {
    console.error('Failed to fetch delivery note:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery note' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const deliveryNote = await prisma.deliveryNote.update({
      where: { id: params.id },
      data: {
        client: body.client,
        country: body.country,
        division: body.division,
        department: body.department,
        fabrication: body.fabrication,
        refPoNumber: body.refPoNumber,
        jobOrderId: body.jobOrderId || null,
        shipmentTo: body.shipmentTo,
        comments: body.comments,
        shipmentType: body.shipmentType,
        representativeName: body.representativeName,
        representativeNo: body.representativeNo,
        qidNumber: body.qidNumber,
        vehicleNumber: body.vehicleNumber,
        vehicleType: body.vehicleType
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

    return NextResponse.json(deliveryNote)
  } catch (error) {
    console.error('Failed to update delivery note:', error)
    return NextResponse.json({ error: 'Failed to update delivery note' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.deliveryNote.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete delivery note:', error)
    return NextResponse.json({ error: 'Failed to delete delivery note' }, { status: 500 })
  }
}
