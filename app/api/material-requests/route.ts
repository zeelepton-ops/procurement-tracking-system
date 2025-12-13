import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canEditOrDelete } from '@/lib/permissions'

export async function GET() {
  try {
    const requests = await prisma.materialRequest.findMany({
      where: {
        isDeleted: false
      },
      include: {
        jobOrder: true,
        items: true,
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
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    // Generate request number
    const count = await prisma.materialRequest.count()
    const requestNumber = `MR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
    
    // Use first item as primary or fallback to legacy fields
    const firstItem = body.items && body.items.length > 0 ? body.items[0] : null
    
    const materialRequest = await prisma.materialRequest.create({
      data: {
        requestNumber,
        jobOrderId: body.jobOrderId,
        materialType: body.materialType,
        itemName: firstItem?.itemName || body.itemName || 'Multiple Items',
        description: firstItem?.description || body.description || 'See items list',
        quantity: firstItem ? parseFloat(firstItem.quantity) : parseFloat(body.quantity),
        unit: firstItem?.unit || body.unit || 'PCS',
        reasonForRequest: body.reasonForRequest,
        requiredDate: new Date(body.requiredDate),
        preferredSupplier: body.preferredSupplier || null,
        stockQtyInInventory: firstItem ? parseFloat(firstItem.stockQty || '0') : parseFloat(body.stockQtyInInventory) || 0,
        urgencyLevel: body.urgencyLevel || 'NORMAL',
        requestedBy: body.requestedBy,
        createdBy: session?.user?.email || body.requestedBy,
        status: 'PENDING',
        items: body.items && body.items.length > 0 ? {
          create: body.items.map((item: any) => ({
            itemName: item.itemName,
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            stockQtyInInventory: parseFloat(item.stockQty || '0')
          }))
        } : undefined
      },
      include: {
        jobOrder: true,
        items: true
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

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    if (!canEditOrDelete(materialRequest.createdAt, userRole)) {
      return NextResponse.json({ 
        error: 'You do not have permission to delete this material request. It can only be deleted within 4 days or by an admin.' 
      }, { status: 403 })
    }

    // If no purchase orders, hard delete
    if (materialRequest.purchaseOrderItems.length === 0) {
      await prisma.materialRequest.delete({ where: { id } })
      return NextResponse.json({ message: 'Material request deleted successfully' })
    }

    // If has purchase orders, soft delete
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
