import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canEditOrDelete } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const summary = searchParams.get('summary')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
    const skip = Math.max(0, (page - 1) * pageSize)

    // Lightweight summary mode for faster list loading
    if (summary) {
      const requests = await prisma.materialRequest.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          requestNumber: true,
          itemName: true,
          description: true,
          quantity: true,
          unit: true,
          stockQtyInInventory: true,
          requiredDate: true,
          urgencyLevel: true,
          status: true,
          jobOrder: { select: { jobNumber: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      })
      return NextResponse.json(requests)
    }

    // Full payload (fallback) - temporarily without items until Prisma regenerates on Vercel
    const requests = await prisma.materialRequest.findMany({
      where: {
        isDeleted: false
      },
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
    console.error('Failed to fetch material requests:', error)
    // Return empty array instead of error object to prevent frontend filter errors
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    console.log('POST /api/material-requests - Received body:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    if (!body.jobOrderId) {
      return NextResponse.json({ error: 'Job Order is required' }, { status: 400 })
    }
    
    // Generate request number
    const count = await prisma.materialRequest.count()
    const requestNumber = `MR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
    
    // Use first item as primary or fallback to legacy fields
    const firstItem = body.items && body.items.length > 0 ? body.items[0] : null
    
    // Use first item's required date or fallback to legacy field or default to 7 days from now
    const requiredDate = firstItem?.requiredDate 
      ? new Date(firstItem.requiredDate)
      : body.requiredDate 
        ? new Date(body.requiredDate)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    
    console.log('Creating material request with:', {
      requestNumber,
      jobOrderId: body.jobOrderId,
      hasItems: !!firstItem,
      itemCount: body.items?.length || 0,
      requiredDate
    })
    
    const materialRequest = await prisma.materialRequest.create({
      data: {
        requestNumber,
        jobOrderId: body.jobOrderId,
        materialType: body.materialType,
        itemName: firstItem?.itemName || body.itemName || 'Multiple Items',
        description: firstItem?.description || body.description || 'See items list',
        quantity: firstItem ? parseFloat(firstItem.quantity) : parseFloat(body.quantity || '1'),
        unit: firstItem?.unit || body.unit || 'PCS',
        reasonForRequest: firstItem?.reasonForRequest || body.reasonForRequest || 'As required',
        requiredDate,
        preferredSupplier: firstItem?.preferredSupplier || body.preferredSupplier || null,
        stockQtyInInventory: firstItem ? parseFloat(firstItem.stockQty || '0') : parseFloat(body.stockQtyInInventory || '0'),
        urgencyLevel: firstItem?.urgencyLevel || body.urgencyLevel || 'NORMAL',
        requestedBy: body.requestedBy,
        createdBy: session?.user?.email || body.requestedBy,
        status: 'PENDING'
        // TODO: Re-enable items after Vercel Prisma regenerates
        // items: body.items && body.items.length > 0 ? {
        //   create: body.items.map((item: any) => ({
        //     itemName: item.itemName,
        //     description: item.description,
        //     quantity: parseFloat(item.quantity),
        //     unit: item.unit,
        //     stockQtyInInventory: parseFloat(item.stockQty || '0'),
        //     reasonForRequest: item.reasonForRequest || null,
        //     urgencyLevel: item.urgencyLevel || 'NORMAL',
        //     requiredDate: item.requiredDate ? new Date(item.requiredDate) : null,
        //     preferredSupplier: item.preferredSupplier || null
        //   }))
        // } : undefined
      },
      include: {
        jobOrder: true
      }
    })
    
    console.log('Material request created:', materialRequest.id)
    
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
    console.error('Error creating material request - Full error:', error)
    console.error('Error name:', error instanceof Error ? error.name : 'unknown')
    console.error('Error message:', error instanceof Error ? error.message : 'unknown')
    console.error('Error stack:', error instanceof Error ? error.stack : 'unknown')
    return NextResponse.json({ 
      error: 'Failed to create material request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Delete request - Session:', session?.user)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Material request ID is required' }, { status: 400 })
    }

    const materialRequest = await prisma.materialRequest.findUnique({
      where: { id },
      include: {
        purchaseOrderItems: true,
        procurementActions: true
      }
    })

    if (!materialRequest) {
      return NextResponse.json({ error: 'Material request not found' }, { status: 404 })
    }

    if (materialRequest.isDeleted) {
      return NextResponse.json({ message: 'Material request already deleted' }, { status: 200 })
    }

    // Check permission
    const userRole = session.user.role || 'USER'
    const createdAt = materialRequest.createdAt || new Date()
    
    console.log('Permission check:', { 
      userRole, 
      createdAt, 
      canDelete: canEditOrDelete(createdAt, userRole) 
    })
    
    if (!canEditOrDelete(createdAt, userRole)) {
      const daysOld = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return NextResponse.json({ 
        error: `You do not have permission to delete this material request. It was created ${daysOld} days ago and can only be deleted within 4 days or by an admin.` 
      }, { status: 403 })
    }

    // Always soft delete to avoid FK constraint issues (status history, actions)
    const deletionDate = new Date()
    
    await prisma.$transaction([
      // Soft-delete the material request
      prisma.materialRequest.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: deletionDate,
          deletedBy: session.user.email
        }
      }),
      // Record deletion in status history
      prisma.statusHistory.create({
        data: {
          materialRequestId: id,
          oldStatus: materialRequest.status,
          newStatus: materialRequest.status,
          changedBy: session.user.email || 'system',
          notes: `Material request ${materialRequest.requestNumber} deleted on ${deletionDate.toISOString()}`
        }
      })
    ])

    return NextResponse.json({ message: 'Material request deleted successfully' })
  } catch (error) {
    console.error('Failed to delete material request:', error)
    return NextResponse.json({ error: 'Failed to delete material request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Material request ID is required' }, { status: 400 })
    }

    const existing = await prisma.materialRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Material request not found' }, { status: 404 })
    }

    const userRole = session.user.role || 'USER'
    if (!canEditOrDelete(existing.createdAt, userRole)) {
      return NextResponse.json({ 
        error: 'You do not have permission to edit this material request. It can only be edited within 4 days or by an admin.' 
      }, { status: 403 })
    }

    const changes: Record<string, any> = {}
    Object.keys(updateData).forEach(key => {
      if ((updateData as any)[key] !== (existing as any)[key]) {
        changes[key] = {
          from: (existing as any)[key],
          to: (updateData as any)[key]
        }
      }
    })

    const updated = await prisma.materialRequest.update({
      where: { id },
      data: {
        ...updateData,
        lastEditedBy: session.user.email,
        lastEditedAt: new Date()
      }
    })

    if (Object.keys(changes).length > 0) {
      await prisma.materialRequestEditHistory.create({
        data: {
          materialRequestId: id,
          editedBy: session.user.email || 'unknown',
          changesMade: JSON.stringify(changes)
        }
      })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Failed to update material request:', error)
    return NextResponse.json({ error: 'Failed to update material request', details: error.message }, { status: 500 })
  }
}
