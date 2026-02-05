import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Fetching delivery notes...')
    const session = await getServerSession()
    console.log('[API] Session:', session ? 'authenticated' : 'not authenticated')
    
    if (!session) {
      console.log('[API] Returning 401 Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobOrderId = searchParams.get('jobOrderId')
    console.log('[API] jobOrderId filter:', jobOrderId || 'none')

    // Check if table exists by attempting a query
    let deliveryNotes = []
    try {
      deliveryNotes = await prisma.deliveryNote.findMany({
        where: jobOrderId ? { jobOrderId } : undefined,
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
      console.log('[API] Found', deliveryNotes.length, 'delivery notes')
    } catch (dbError) {
      // Table doesn't exist yet, return empty array
      console.error('[API] DeliveryNote table may not exist yet:', dbError)
      return NextResponse.json([])
    }

    return NextResponse.json(deliveryNotes)
  } catch (error) {
    console.error('[API] Failed to fetch delivery notes:', error)
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
        refPoNumber: body.refPoNumber,
        shipmentTo: body.shipmentTo,
        comments: body.comments,
        shipmentType: body.shipmentType,
        representativeName: body.representativeName,
        representativeNo: body.representativeNo,
        qidNumber: body.qidNumber,
        vehicleNumber: body.vehicleNumber,
        vehicleType: body.vehicleType,
        createdBy: session.user.email,
        // Calculate totals from lineItems
        totalQuantity: body.lineItems?.reduce((sum: number, item: any) => {
          return sum + item.subItems.reduce((subSum: number, subItem: any) => subSum + (subItem.deliveredQuantity || 0), 0)
        }, 0) || 0,
        totalWeight: 0, // Can be calculated if weight data is available
        status: 'DRAFT',
        items: {
          create: body.lineItems?.flatMap((lineItem: any) => 
            lineItem.subItems.map((subItem: any) => ({
              itemDescription: subItem.subDescription,
              unit: subItem.unit,
              quantity: lineItem.totalQty || 0,
              deliveredQuantity: subItem.deliveredQuantity || 0,
              remarks: subItem.remarks || null,
              jobOrderItemId: lineItem.jobOrderItemId || null
            }))
          ) || []
        }
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
