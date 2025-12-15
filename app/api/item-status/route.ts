import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { itemId, materialRequestId, newStatus, oldStatus, actionBy } = body

    // Check if item is from the items table or if it's the main request item
    const isMainItem = itemId.includes('-main')
    
    if (isMainItem) {
      // Update the main MaterialRequest status
      await prisma.materialRequest.update({
        where: { id: materialRequestId },
        data: { 
          status: newStatus,
          lastEditedAt: new Date()
        }
      })
    } else {
      // Update the MaterialRequestItem status
      await prisma.materialRequestItem.update({
        where: { id: itemId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        }
      })
    }

    // Log the action
    await prisma.procurementAction.create({
      data: {
        materialRequestId,
        actionType: 'STATUS_UPDATE',
        actionBy,
        notes: `Status changed from ${oldStatus.replace(/_/g, ' ')} to ${newStatus.replace(/_/g, ' ')}`,
        actionDate: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to update item status:', error)
    return NextResponse.json(
      { error: 'Failed to update status', details: error.message },
      { status: 500 }
    )
  }
}
