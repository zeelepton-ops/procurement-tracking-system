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
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const payments = await prisma.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, amount, paymentDate, paymentMethod, referenceNumber, notes } = body

    if (!invoiceId || !amount || !paymentDate || !paymentMethod) {
      return NextResponse.json({ 
        error: 'Invoice ID, amount, payment date, and payment method are required' 
      }, { status: 400 })
    }

    // Get current invoice
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Calculate new paid amount and balance
    const newPaidAmount = invoice.paidAmount + parseFloat(amount)
    const newBalanceAmount = invoice.totalAmount - newPaidAmount

    // Determine payment status
    let paymentStatus = 'UNPAID'
    if (newPaidAmount >= invoice.totalAmount) {
      paymentStatus = 'PAID'
    } else if (newPaidAmount > 0) {
      paymentStatus = 'PARTIAL'
    }

    // Create payment record
    const payment = await prisma.invoicePayment.create({
      data: {
        invoiceId,
        paymentDate: new Date(paymentDate),
        amount: parseFloat(amount),
        paymentMethod,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
        createdBy: session.user?.email || 'system'
      }
    })

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus,
        status: paymentStatus === 'PAID' ? 'PAID' : invoice.status
      }
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Failed to record payment:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Get payment and invoice
    const payment = await prisma.invoicePayment.findUnique({ where: { id } })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: payment.invoiceId } })
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Recalculate invoice amounts
    const newPaidAmount = invoice.paidAmount - payment.amount
    const newBalanceAmount = invoice.totalAmount - newPaidAmount

    let paymentStatus = 'UNPAID'
    if (newPaidAmount >= invoice.totalAmount) {
      paymentStatus = 'PAID'
    } else if (newPaidAmount > 0) {
      paymentStatus = 'PARTIAL'
    }

    // Delete payment
    await prisma.invoicePayment.delete({ where: { id } })

    // Update invoice
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete payment:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
