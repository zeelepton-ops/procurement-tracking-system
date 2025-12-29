import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'

// GET purchase orders (list or by ID)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const supplierId = searchParams.get('supplierId')

    if (id) {
      // Get single PO with line items
      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
          purchaseOrderItems: {
            include: { materialRequest: true }
          }
        }
      })
      return NextResponse.json(po)
    }

    // List all POs with filters
    const pos = await prisma.purchaseOrder.findMany({
      where: { isDeleted: false },
      include: {
        purchaseOrderItems: true
      },
      orderBy: { orderDate: 'desc' },
      take: 100
    })

    return NextResponse.json(pos)
  } catch (error) {
    console.error('Failed to fetch purchase orders:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}

// POST create purchase order
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { poNumber, supplierName, supplierContact, paymentTerms, orderDate, expectedDelivery, items } = body

    if (!poNumber || !supplierName || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: poNumber, supplierName, items' },
        { status: 400 }
      )
    }

    // Check if PO number already exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { poNumber }
    })
    if (existingPO) {
      return NextResponse.json(
        { error: `PO number ${poNumber} already exists` },
        { status: 400 }
      )
    }

    // Create PO with line items in a transaction
    const po = await prisma.$transaction(async (tx) => {
      const newPO = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierName,
          supplierContact: supplierContact || null,
          paymentTerms: paymentTerms || null,
          orderDate: new Date(orderDate || Date.now()),
          expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
          purchaseOrderItems: {
            create: items.map((item: any) => ({
              materialRequestId: item.materialRequestId || randomUUID(),
              description: item.description || '',
              quantity: parseFloat(item.quantity) || 0,
              unit: item.unit || 'PCS',
              unitPrice: parseFloat(item.unitPrice) || 0,
              totalPrice: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
            }))
          }
        },
        include: {
          purchaseOrderItems: true
        }
      })
      return newPO
    })

    return NextResponse.json(po, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create purchase order:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}

// PUT update purchase order
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, supplierName, supplierContact, paymentTerms, orderDate, expectedDelivery, status } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplierName: supplierName || undefined,
        supplierContact: supplierContact || undefined,
        paymentTerms: paymentTerms || undefined,
        orderDate: orderDate ? new Date(orderDate) : undefined,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined,
        status: status || undefined
      },
      include: {
        purchaseOrderItems: true
      }
    })

    return NextResponse.json(po)
  } catch (error) {
    console.error('Failed to update purchase order:', error)
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
  }
}

// DELETE purchase order (soft delete)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.purchaseOrder.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: session.user.email }
    })

    return NextResponse.json({ message: 'Purchase order deleted' })
  } catch (error) {
    console.error('Failed to delete purchase order:', error)
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 })
  }
}
