import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const action = await prisma.procurementAction.create({
      data: {
        materialRequestId: body.materialRequestId,
        actionType: body.actionType,
        actionBy: body.actionBy,
        notes: body.notes || null,
        quotationAmount: body.quotationAmount ? parseFloat(body.quotationAmount) : null,
        supplierName: body.supplierName || null,
        expectedDelivery: body.expectedDelivery ? new Date(body.expectedDelivery) : null
      }
    })
    
    // Update material request status if applicable
    if (body.newStatus) {
      await prisma.materialRequest.update({
        where: { id: body.materialRequestId },
        data: { status: body.newStatus }
      })
      
      // Create status history
      await prisma.statusHistory.create({
        data: {
          materialRequestId: body.materialRequestId,
          oldStatus: body.oldStatus || '',
          newStatus: body.newStatus,
          changedBy: body.actionBy,
          notes: body.notes || null
        }
      })
    }
    
    return NextResponse.json(action, { status: 201 })
  } catch (error) {
    console.error('Error creating procurement action:', error)
    return NextResponse.json({ error: 'Failed to create procurement action' }, { status: 500 })
  }
}
