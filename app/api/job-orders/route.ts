import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const jobOrders = await prisma.jobOrder.findMany({
      where: {
        isDeleted: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { materialRequests: true }
        }
      }
    })
    
    return NextResponse.json(jobOrders || [])
  } catch (error) {
    console.error('Failed to fetch job orders:', error)
    // Return empty array on error instead of 500
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Try creating with all fields first
    try {
      const jobOrder = await prisma.jobOrder.create({
        data: {
          jobNumber: body.jobNumber,
          productName: body.productName,
          drawingRef: body.drawingRef || null,
          clientName: body.clientName || null,
          contactPerson: body.contactPerson || null,
          phone: body.phone || null,
          lpoContractNo: body.lpoContractNo || null,
          priority: body.priority || 'MEDIUM',
          foreman: body.foreman || null,
          workScope: body.workScope || null,
          qaQcInCharge: body.qaQcInCharge || null
        }
      })
      
      return NextResponse.json(jobOrder, { status: 201 })
    } catch (dbError: any) {
      // If new fields don't exist, try with old schema
      if (dbError.code === 'P2009' || dbError.message?.includes('column') || dbError.message?.includes('Unknown field')) {
        console.log('Database schema not migrated yet, using legacy fields only')
        const jobOrder = await prisma.jobOrder.create({
          data: {
            jobNumber: body.jobNumber,
            productName: body.productName,
            drawingRef: body.drawingRef || null
          }
        })
        
        return NextResponse.json(jobOrder, { status: 201 })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Failed to create job order:', error)
    return NextResponse.json({ 
      error: 'Failed to create job order', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Job order ID is required' }, { status: 400 })
    }

    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id },
      select: {
        id: true,
        jobNumber: true,
        isDeleted: true
      }
    })

    if (!jobOrder) {
      return NextResponse.json({ error: 'Job order not found' }, { status: 404 })
    }

    if (jobOrder.isDeleted) {
      return NextResponse.json({ message: 'Job order already deleted' }, { status: 200 })
    }

    const materialRequests = await prisma.materialRequest.findMany({
      where: { jobOrderId: id },
      select: { id: true, status: true }
    })

    // No related MRs: safe hard delete
    if (materialRequests.length === 0) {
      await prisma.jobOrder.delete({ where: { id } })
      return NextResponse.json({ message: 'Job order deleted successfully' })
    }

    // If any MR is not fully received, block deletion
    const hasUndelivered = materialRequests.some((mr) => mr.status !== 'RECEIVED')
    if (hasUndelivered) {
      return NextResponse.json({
        error: 'Cannot delete job order with pending material requests. Deletion is only allowed when all related material requests are RECEIVED.'
      }, { status: 400 })
    }

    const deletionDate = new Date()
    const deletionNote = `Linked job order ${jobOrder.jobNumber} deleted on ${deletionDate.toISOString()}. Material retained in stock.`

    const receipts = await prisma.materialReceipt.findMany({
      where: {
        purchaseOrderItem: {
          materialRequest: {
            jobOrderId: id
          }
        }
      },
      select: { id: true, notes: true }
    })

    await prisma.$transaction([
      // Append remark to receipts so stock trace keeps the job link
      ...receipts.map((receipt) =>
        prisma.materialReceipt.update({
          where: { id: receipt.id },
          data: {
            notes: receipt.notes
              ? `${receipt.notes}\n${deletionNote}`
              : deletionNote
          }
        })
      ),
      // Log in status history that the job was deleted
      ...materialRequests.map((mr) =>
        prisma.statusHistory.create({
          data: {
            materialRequestId: mr.id,
            oldStatus: mr.status,
            newStatus: mr.status,
            changedBy: 'system',
            notes: deletionNote
          }
        })
      ),
      // Soft-delete the job order so relations stay intact
      prisma.jobOrder.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: deletionDate
        }
      })
    ])

    return NextResponse.json({ message: 'Job order deleted. Materials remain in stock with remark recorded.' })
  } catch (error) {
    console.error('Failed to delete job order:', error)
    return NextResponse.json({ error: 'Failed to delete job order' }, { status: 500 })
  }
}
