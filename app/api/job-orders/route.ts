import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const jobOrders = await prisma.jobOrder.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { materialRequests: true }
        }
      }
    })
    
    return NextResponse.json(jobOrders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch job orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job order' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Job order ID is required' }, { status: 400 })
    }

    // Check if job order has material requests
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id },
      include: {
        _count: {
          select: { materialRequests: true }
        }
      }
    })

    if (!jobOrder) {
      return NextResponse.json({ error: 'Job order not found' }, { status: 404 })
    }

    if (jobOrder._count.materialRequests > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete job order with existing material requests. Please delete material requests first.' 
      }, { status: 400 })
    }

    await prisma.jobOrder.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Job order deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete job order' }, { status: 500 })
  }
}
