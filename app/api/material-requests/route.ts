import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const requests = await prisma.materialRequest.findMany({
      include: {
        jobOrder: true,
        procurementActions: {
          orderBy: { actionDate: 'desc' },
          take: 1
        },
        purchaseOrderItems: {
          include: {
            purchaseOrder: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(requests)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch material requests' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Generate request number
    const count = await prisma.materialRequest.count()
    const requestNumber = `MR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
    
    const materialRequest = await prisma.materialRequest.create({
      data: {
        requestNumber,
        jobOrderId: body.jobOrderId,
        materialType: body.materialType,
        itemName: body.itemName,
        description: body.description,
        quantity: parseFloat(body.quantity),
        unit: body.unit,
        reasonForRequest: body.reasonForRequest,
        requiredDate: new Date(body.requiredDate),
        preferredSupplier: body.preferredSupplier || null,
        stockQtyInInventory: parseFloat(body.stockQtyInInventory) || 0,
        urgencyLevel: body.urgencyLevel || 'NORMAL',
        requestedBy: body.requestedBy,
        status: 'PENDING'
      },
      include: {
        jobOrder: true
      }
    })
    
    // Create status history
    await prisma.statusHistory.create({
      data: {
        materialRequestId: materialRequest.id,
        oldStatus: '',
        newStatus: 'PENDING',
        changedBy: body.requestedBy,
        notes: 'Material request created'
      }
    })
    
    return NextResponse.json(materialRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating material request:', error)
    return NextResponse.json({ error: 'Failed to create material request' }, { status: 500 })
  }
}
