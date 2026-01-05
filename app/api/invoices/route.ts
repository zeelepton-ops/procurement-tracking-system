import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'ALL'
    const paymentStatus = searchParams.get('paymentStatus') || 'ALL'
    const clientId = searchParams.get('clientId')

    // If ID is provided, return single invoice
    if (id) {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          client: true,
          jobOrder: true,
          items: true,
          payments: true,
          _count: {
            select: {
              items: true,
              payments: true
            }
          }
        }
      })
      
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      
      return NextResponse.json(invoice)
    }

    const whereClause: any = {}
    
    if (status !== 'ALL') {
      whereClause.status = status
    }
    
    if (paymentStatus !== 'ALL') {
      whereClause.paymentStatus = paymentStatus
    }

    if (clientId) {
      whereClause.clientId = clientId
    }
    
    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { jobOrder: { jobNumber: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        jobOrder: true,
        items: true,
        payments: true,
        _count: {
          select: {
            items: true,
            payments: true
          }
        }
      }
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check for duplicate invoice number
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: body.invoiceNumber }
    })

    if (existingInvoice) {
      return NextResponse.json({ 
        error: 'Invoice with this number already exists' 
      }, { status: 400 })
    }

    // Validate invoice items against job order items if jobOrderId is provided
    if (body.jobOrderId && body.items?.length > 0) {
      const jobOrder = await prisma.jobOrder.findUnique({
        where: { id: body.jobOrderId },
        include: { items: true }
      })

      if (!jobOrder) {
        return NextResponse.json({ error: 'Job order not found' }, { status: 404 })
      }

      // Check each invoice item against job order items
      for (const invItem of body.items) {
        if (invItem.jobOrderItemId) {
          const jobOrderItem = jobOrder.items.find(joi => joi.id === invItem.jobOrderItemId)
          
          if (!jobOrderItem) {
            return NextResponse.json({ 
              error: `Job order item not found for: ${invItem.description}` 
            }, { status: 400 })
          }

          // Get total invoiced quantity for this job order item
          const existingInvoices = await prisma.invoiceItem.findMany({
            where: { 
              jobOrderItemId: invItem.jobOrderItemId,
              invoice: { status: { not: 'CANCELLED' } }
            }
          })

          const totalInvoiced = existingInvoices.reduce((sum, item) => sum + item.quantity, 0)
          const newTotal = totalInvoiced + invItem.quantity

          // Check if new total exceeds job order item quantity
          if (jobOrderItem.quantity && newTotal > jobOrderItem.quantity) {
            return NextResponse.json({ 
              error: `Invoice quantity (${invItem.quantity}) would exceed remaining quantity for "${invItem.description}". Available: ${jobOrderItem.quantity - totalInvoiced}` 
            }, { status: 400 })
          }

          // Check if total value exceeds job order item total
          const invoicedValue = invItem.quantity * invItem.unitPrice
          const jobOrderValue = (jobOrderItem.quantity || 0) * (jobOrderItem.unitPrice || 0)
          
          if (invoicedValue > jobOrderValue) {
            return NextResponse.json({ 
              error: `Invoice value for "${invItem.description}" exceeds job order item value` 
            }, { status: 400 })
          }
        }
      }
    }

    // Calculate totals
    const subtotal = body.items?.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0) || 0
    const taxAmount = subtotal * (body.taxRate || 0) / 100
    const totalAmount = subtotal + taxAmount - (body.discount || 0)
    const balanceAmount = totalAmount - (body.paidAmount || 0)

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: body.invoiceNumber,
        jobOrderId: body.jobOrderId || null,
        clientId: body.clientId,
        invoiceDate: new Date(body.invoiceDate),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        clientReference: body.clientReference || null,
        subtotal,
        taxRate: body.taxRate || 0,
        taxAmount,
        discount: body.discount || 0,
        totalAmount,
        paidAmount: body.paidAmount || 0,
        balanceAmount,
        paymentStatus: body.paymentStatus || 'UNPAID',
        notes: body.notes || null,
        terms: body.terms || null,
        bankDetails: body.bankDetails || null,
        status: body.status || 'DRAFT',
        createdBy: session.user?.email || 'system',
        items: {
          create: body.items?.map((item: any) => ({
            jobOrderItemId: item.jobOrderItemId || null,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            invoicedQty: item.quantity
          })) || []
        }
      },
      include: {
        client: true,
        jobOrder: true,
        items: true
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, items, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Recalculate totals if items are updated
    if (items) {
      const subtotal = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unitPrice), 0)
      const taxAmount = subtotal * (updateData.taxRate || 0) / 100
      const totalAmount = subtotal + taxAmount - (updateData.discount || 0)
      const balanceAmount = totalAmount - (updateData.paidAmount || 0)

      updateData.subtotal = subtotal
      updateData.taxAmount = taxAmount
      updateData.totalAmount = totalAmount
      updateData.balanceAmount = balanceAmount
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...updateData,
        invoiceDate: updateData.invoiceDate ? new Date(updateData.invoiceDate) : undefined,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        updatedBy: session.user?.email || 'system'
      },
      include: {
        client: true,
        jobOrder: true,
        items: true,
        payments: true
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Failed to update invoice:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.payments.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete invoice with payments. Please cancel the invoice instead.' 
      }, { status: 400 })
    }

    await prisma.invoice.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete invoice:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
