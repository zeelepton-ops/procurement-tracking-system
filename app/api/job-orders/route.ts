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
      let jo: any = null
      try {
        jo = await prisma.jobOrder.findFirst({ where: { jobNumber: jobNumberParam }, include: { items: true } })
      } catch (err: any) {
        if (err?.code === 'P2022' && err?.meta?.column) {
          const col = String(err.meta.column)
          console.warn(`Detected missing column ${col} in JobOrder during lookup; attempting to add it temporarily`)
          try {
            const matches = col.match(/\.(.+)$/)
            const columnName = matches ? matches[1] : col
            await prisma.$executeRawUnsafe(`ALTER TABLE "JobOrder" ADD COLUMN IF NOT EXISTS "${columnName}" TEXT`)
            jo = await prisma.jobOrder.findFirst({ where: { jobNumber: jobNumberParam }, include: { items: true } })
          } catch (addErr) {
            console.error('Failed to auto-add missing JobOrder column during lookup:', addErr)
          }
        } else {
          throw err
        }
      }
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
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = Math.min(100, parseInt(searchParams.get('perPage') || '20', 10))
    const search = searchParams.get('search') || ''
    const priority = searchParams.get('priority') || ''

    // Build where clause
    const whereClause: any = includeDeleted ? {} : { isDeleted: false }
    if (priority && priority !== 'ALL') {
      whereClause.priority = priority
    }
    if (search) {
      whereClause.OR = [
        { jobNumber: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { foreman: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Export CSV if requested
    if (searchParams.get('export') === 'csv') {
      const idsParam = searchParams.get('ids')
      const ids = idsParam ? idsParam.split(',').filter(Boolean) : null
      const jobsToExport = ids && ids.length > 0
        ? await prisma.jobOrder.findMany({ where: { id: { in: ids } }, include: { items: true } })
        : await prisma.jobOrder.findMany({ where: whereClause, include: { items: true }, orderBy: { createdAt: 'desc' } })

      const { jobOrdersToCSV } = await import('@/lib/csv')
      const csv = jobOrdersToCSV(jobsToExport)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="job-orders-export.csv"'
        }
      })
    }

    const totalCount = await prisma.jobOrder.count({ where: whereClause })

    const jobOrders = await prisma.jobOrder.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        _count: { select: { materialRequests: true } },
        items: true
      }
    })

    return NextResponse.json({ jobs: jobOrders || [], totalCount })
  } catch (error) {
    console.error('Failed to fetch job orders:', error)
    // Return proper format to avoid parsing errors on frontend
    return NextResponse.json({ jobs: [], totalCount: 0 }, { status: 200 })
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
          .filter((item: any) => item?.workDescription && (Number(item?.quantity) > 0 || Number(item?.totalPrice) > 0))
          .map((item: any) => ({
            workDescription: item.workDescription,
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'PCS',
            unitPrice: Number(item.unitPrice) || 0,
            totalPrice: Number(item.totalPrice) || (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
          }))
      : []
    
    // Check for existing job number (both active and deleted)
    let existingByNumber: any = null
    try {
      existingByNumber = await prisma.jobOrder.findFirst({ where: { jobNumber: body.jobNumber } })
    } catch (err: any) {
      // Handle missing column errors (Prisma P2022) by adding the column and retrying once
      if (err?.code === 'P2022' && err?.meta?.column) {
        const col = String(err.meta.column)
        console.warn(`Detected missing column ${col} in JobOrder; attempting to add it temporarily`)
        try {
          // Extract column name after the dot if formatted like 'JobOrder.clientContactPerson'
          const matches = col.match(/\.(.+)$/)
          const columnName = matches ? matches[1] : col
          // Add as nullable TEXT to avoid breaking existing rows
          await prisma.$executeRawUnsafe(`ALTER TABLE "JobOrder" ADD COLUMN IF NOT EXISTS "${columnName}" TEXT`)
          // Retry the findFirst once
          existingByNumber = await prisma.jobOrder.findFirst({ where: { jobNumber: body.jobNumber } })
        } catch (addErr) {
          console.error('Failed to auto-add missing JobOrder column:', addErr)
          // proceed without existingByNumber, creation will attempt to continue
        }
      } else {
        throw err
      }
    }

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
            discount: Number(body.discount) || 0,
            roundOff: Number(body.roundOff) || 0,
            finalTotal: body.finalTotal !== undefined ? Number(body.finalTotal) : undefined,
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
          discount: Number(body.discount) || 0,
          roundOff: Number(body.roundOff) || 0,
          finalTotal: body.finalTotal !== undefined ? Number(body.finalTotal) : undefined,
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

  // Coerce numeric fields if present
  if (updateData.discount !== undefined) updateData.discount = parseFloat(updateData.discount) || 0
  if (updateData.roundOff !== undefined) updateData.roundOff = parseFloat(updateData.roundOff) || 0
  if (updateData.finalTotal !== undefined) updateData.finalTotal = updateData.finalTotal === null ? null : Number(updateData.finalTotal)


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
    let updatedJobOrder
    try {
      updatedJobOrder = await prisma.$transaction(async (tx) => {
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
    } catch (dbError: any) {
      // If database schema not migrated and doesn't have discount/roundOff fields, retry without them
      if (dbError.code === 'P2009' || dbError.message?.includes('column') || dbError.message?.includes('Unknown field')) {
        const updated = await prisma.$transaction(async (tx) => {
          await tx.jobOrderItem.deleteMany({ where: { jobOrderId: id } })
          return tx.jobOrder.update({
            where: { id },
            data: {
              // omit discount/roundOff
              ...Object.fromEntries(Object.entries(updateData).filter(([k]) => k !== 'discount' && k !== 'roundOff')),
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
            include: { items: true }
          })
        })
        updatedJobOrder = updated
      } else {
        throw dbError
      }
    }

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
    const idsParam = searchParams.get('ids')

    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean)
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
      }

      // Fetch jobs and check permissions
      const jobs = await prisma.jobOrder.findMany({ where: { id: { in: ids } }, select: { id: true, jobNumber: true, isDeleted: true, createdAt: true } })
      const userRole = session.user.role || 'USER'
      const forbidden = jobs.filter(j => !canEditOrDelete(j.createdAt, userRole)).map(j => j.id)
      if (forbidden.length > 0) {
        return NextResponse.json({ error: 'Permission denied for some job orders', forbidden }, { status: 403 })
      }

      const deletionDate = new Date()
      const ops: any[] = []

      for (const j of jobs) {
        if (j.isDeleted) continue

        // Collect material requests
        const materialRequests = await prisma.materialRequest.findMany({ where: { jobOrderId: j.id }, select: { id: true, status: true } })

        // Append receipts updates
        const receipts = await prisma.materialReceipt.findMany({
          where: {
            purchaseOrderItem: {
              materialRequest: {
                jobOrderId: j.id
              }
            }
          },
          select: { id: true, notes: true }
        })

        const deletionNote = `Linked job order ${j.jobNumber} deleted on ${deletionDate.toISOString()}. Materials and requests remain for traceability.`

        receipts.forEach((receipt) => {
          ops.push(prisma.materialReceipt.update({ where: { id: receipt.id }, data: { notes: receipt.notes ? `${receipt.notes}\n${deletionNote}` : deletionNote } }))
        })

        materialRequests.forEach((mr) => {
          ops.push(prisma.statusHistory.create({ data: { materialRequestId: mr.id, oldStatus: mr.status, newStatus: mr.status, changedBy: 'system', notes: deletionNote } }))
        })

        ops.push(prisma.jobOrder.update({ where: { id: j.id }, data: { isDeleted: true, deletedAt: deletionDate, deletedBy: session.user.email } }))
      }

      if (ops.length > 0) {
        await prisma.$transaction(ops)
      }

      return NextResponse.json({ message: 'Selected job orders deleted (soft delete).' })
    }

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