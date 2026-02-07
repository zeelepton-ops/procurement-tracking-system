import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobOrderId = searchParams.get('jobOrderId')

    if (!jobOrderId) {
      return NextResponse.json({ error: 'Job Order ID is required' }, { status: 400 })
    }

    // Get job order with items
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: { items: true }
    })

    if (!jobOrder) {
      return NextResponse.json({ error: 'Job Order not found' }, { status: 404 })
    }

    // Get all invoiced items for this job order
    const invoicedItems = await prisma.invoiceItem.findMany({
      where: {
        jobOrderItemId: { in: jobOrder.items.map(i => i.id) },
        invoice: { status: { not: 'CANCELLED' } }
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            status: true
          }
        }
      }
    })

    // Calculate available quantities
    const availableQuantities = jobOrder.items.map(item => {
      const invoiced = invoicedItems
        .filter(ii => ii.jobOrderItemId === item.id)
        .reduce((sum, ii) => sum + ii.quantity, 0)
      
      const available = (item.quantity || 0) - invoiced
      const invoicedValue = invoicedItems
        .filter(ii => ii.jobOrderItemId === item.id)
        .reduce((sum, ii) => sum + ii.totalPrice, 0)
      
      const totalValue = (item.quantity || 0) * (item.unitPrice || 0)
      const availableValue = totalValue - invoicedValue

      return {
        jobOrderItemId: item.id,
        description: item.workDescription,
        unit: item.unit,
        totalQuantity: item.quantity || 0,
        invoicedQuantity: invoiced,
        availableQuantity: available,
        unitPrice: item.unitPrice || 0,
        totalValue,
        invoicedValue,
        availableValue,
        invoices: invoicedItems
          .filter(ii => ii.jobOrderItemId === item.id)
          .map(ii => ({
            invoiceNumber: ii.invoice.invoiceNumber,
            quantity: ii.quantity,
            value: ii.totalPrice
          }))
      }
    })

    return NextResponse.json({
      jobOrder: {
        id: jobOrder.id,
        jobNumber: jobOrder.jobNumber,
        productName: jobOrder.productName
      },
      items: availableQuantities
    })
  } catch (error) {
    console.error('Failed to fetch available quantities:', error)
    return NextResponse.json({ error: 'Failed to fetch available quantities' }, { status: 500 })
  }
}
