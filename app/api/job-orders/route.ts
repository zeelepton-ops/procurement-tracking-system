import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canEditOrDelete } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobNumberParam = searchParams.get('jobNumber')

    // Direct lookup by job number (includes soft-deleted) for debugging/resolution
    if (jobNumberParam) {
      const jo = await prisma.jobOrder.findFirst({
        where: { jobNumber: jobNumberParam },
        include: { items: true }
      })
      if (!jo) {
        return NextResponse.json({ message: `Job number '${jobNumberParam}' not found`, found: false }, { status: 404 })
      }
      return NextResponse.json({ found: true, data: jo })
    }

    // Debug mode: list all job numbers with delete status
    if (searchParams.get('debug') === 'true') {
      const allJobs = await prisma.jobOrder.findMany({
        select: { id: true, jobNumber: true, isDeleted: true, createdAt: true }
      })
      return NextResponse.json({ totalCount: allJobs.length, jobs: allJobs })
    }

    // Include soft-deleted if requested
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const whereClause = includeDeleted ? {} : { isDeleted: false }

    const jobOrders = await prisma.jobOrder.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { materialRequests: true }
        },
        items: true
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
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const productName = body.productName || body.workScope
    if (!productName) {
      return NextResponse.json({ error: 'Work scope is required' }, { status: 400 })
    }

    const safeItems = Array.isArray(body.items)
      ? body.items
          .filter((item: any) => item?.workDescription && Number(item?.quantity) > 0)
          .map((item: any) => ({
            workDescription: item.workDescription,
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'PCS',
            unitPrice: Number(item.unitPrice) || 0,
            totalPrice: Number(item.totalPrice) || (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
          }))
      : []
    
    // Check for existing job number (both active and deleted)
    const existingByNumber = await prisma.jobOrder.findFirst({
      where: { jobNumber: body.jobNumber }
    })

    // If job exists and is ACTIVE (not deleted), reject it
    if (existingByNumber && !existingByNumber.isDeleted) {
      return NextResponse.json({ error: 'Job number already exists' }, { status: 409 })
    }

    // If job exists but is SOFT-DELETED, restore it transparently
    if (existingByNumber && existingByNumber.isDeleted) {
      const restored = await prisma.$transaction(async (tx) => {
        // Delete old items
        await tx.jobOrderItem.deleteMany({ where: { jobOrderId: existingByNumber.id } })

        // Restore and update the job
        return tx.jobOrder.update({
          where: { id: existingByNumber.id },
          data: {
            productName,
            drawingRef: body.drawingRef || null,
            clientName: body.clientName || null,
            contactPerson: body.contactPerson || null,
            phone: body.phone || null,
            clientContactPerson: body.clientContactPerson || null,
            clientContactPhone: body.clientContactPhone || null,
            lpoContractNo: body.lpoContractNo || null,
            priority: body.priority || 'MEDIUM',
            foreman: body.foreman || null,
            workScope: body.workScope || productName,
            scopeOfWorks: body.scopeOfWorks && body.scopeOfWorks.length > 0 ? JSON.stringify(body.scopeOfWorks) : null,
            qaQcInCharge: body.qaQcInCharge || null,
            createdBy: session?.user?.email || 'unknown',
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            items: safeItems.length > 0 ? {
              create: safeItems
            } : undefined
          },
          include: { items: true }
        })
      })

      return NextResponse.json(restored, { status: 201 })
    }

    // Try creating with all fields first
    try {
      const jobOrder = await prisma.jobOrder.create({
        data: {
          jobNumber: body.jobNumber,
          productName,
          drawingRef: body.drawingRef || null,
          clientName: body.clientName || null,
          contactPerson: body.contactPerson || null,
          phone: body.phone || null,          clientContactPerson: body.clientContactPerson || null,
          clientContactPhone: body.clientContactPhone || null,          lpoContractNo: body.lpoContractNo || null,
          priority: body.priority || 'MEDIUM',
          foreman: body.foreman || null,
          workScope: body.workScope || productName,
          scopeOfWorks: body.scopeOfWorks && body.scopeOfWorks.length > 0 ? JSON.stringify(body.scopeOfWorks) : null,
          qaQcInCharge: body.qaQcInCharge || null,
          createdBy: session?.user?.email || 'unknown',
          items: safeItems.length > 0 ? {
            create: safeItems
          } : undefined
        },
        include: {
          items: true
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
            productName,
            drawingRef: body.drawingRef || null
          }
        })
        
        return NextResponse.json(jobOrder, { status: 201 })
      }

      if (dbError.code === 'P2002') {
        return NextResponse.json({ error: 'Job number already exists' }, { status: 409 })
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

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, items, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Job order ID is required' }, { status: 400 })
    }

    const existingJobOrder = await prisma.jobOrder.findUnique({
      where: { id }
    })

    if (!existingJobOrder) {
      return NextResponse.json({ error: 'Job order not found' }, { status: 404 })
    }

    // Check permission
    const userRole = session.user.role || 'USER'
    if (!canEditOrDelete(existingJobOrder.createdAt, userRole)) {
      return NextResponse.json({ 
        error: 'You do not have permission to edit this job order. It can only be edited within 4 days or by an admin.' 
      }, { status: 403 })
    }

    // Track changes
    const changes: Record<string, any> = {}
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== (existingJobOrder as any)[key]) {
        changes[key] = {
          from: (existingJobOrder as any)[key],
          to: updateData[key]
        }
      }
    })

    // Update job order and items in transaction
    const userEmail = session.user.email || 'unknown'
    const updatedJobOrder = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.jobOrderItem.deleteMany({
        where: { jobOrderId: id }
      })

      // Update job order with new items
      const updated = await tx.jobOrder.update({
        where: { id },
        data: {
          ...updateData,
          scopeOfWorks: updateData.scopeOfWorks && updateData.scopeOfWorks.length > 0 ? JSON.stringify(updateData.scopeOfWorks) : null,
          lastEditedBy: userEmail,
          lastEditedAt: new Date(),
          items: items && items.length > 0 ? {
            create: items.map((item: any) => ({
              workDescription: item.workDescription,
              quantity: parseFloat(item.quantity),
              unit: item.unit,
              unitPrice: parseFloat(item.unitPrice),
              totalPrice: parseFloat(item.totalPrice)
            }))
          } : undefined
        },
        include: {
          items: true
        }
      })

      return updated
    })

    // Record edit history
    if (Object.keys(changes).length > 0 || items) {
      await prisma.jobOrderEditHistory.create({
        data: {
          jobOrderId: id,
          editedBy: userEmail,
          changesMade: JSON.stringify(changes)
        }
      })
    }

    return NextResponse.json(updatedJobOrder)
  } catch (error: any) {
    console.error('Failed to update job order:', error)
    return NextResponse.json({ 
      error: 'Failed to update job order', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        isDeleted: true,
        createdAt: true
      }
    })

    if (!jobOrder) {
      return NextResponse.json({ error: 'Job order not found' }, { status: 404 })
    }

    // Check permission
    const userRole = session.user.role || 'USER'
    if (!canEditOrDelete(jobOrder.createdAt, userRole)) {
      return NextResponse.json({ 
        error: 'You do not have permission to delete this job order. It can only be deleted within 4 days or by an admin.' 
      }, { status: 403 })
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

    // Proceed with soft delete even if some material requests are not fully received
    // This keeps stock and procurement trace intact while removing the job order from active lists

    const deletionDate = new Date()
    const deletionNote = `Linked job order ${jobOrder.jobNumber} deleted on ${deletionDate.toISOString()}. Materials and requests remain for traceability.`

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
          deletedAt: deletionDate,
          deletedBy: session.user.email
        }
      })
    ])

    return NextResponse.json({ message: 'Job order deleted. Materials remain in stock with remark recorded.' })
  } catch (error) {
    console.error('Failed to delete job order:', error)
    return NextResponse.json({ error: 'Failed to delete job order' }, { status: 500 })
  }
}
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, action } = body

    if (!id) {
      return NextResponse.json({ error: 'Job order ID is required' }, { status: 400 })
    }

    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!jobOrder) {
      return NextResponse.json({ error: 'Job order not found' }, { status: 404 })
    }

    // Restore soft-deleted job order
    if (action === 'restore') {
      if (!jobOrder.isDeleted) {
        return NextResponse.json({ error: 'Job order is not deleted' }, { status: 400 })
      }

      const restored = await prisma.jobOrder.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null
        },
        include: { items: true }
      })

      return NextResponse.json(restored)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Failed to update job order:', error)
    return NextResponse.json({ error: 'Failed to update job order' }, { status: 500 })
  }
}