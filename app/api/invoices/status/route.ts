import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Invoice ID and status are required' }, { status: 400 })
    }

    const validStatuses = ['DRAFT', 'SENT', 'PAID', 'CANCELLED', 'OVERDUE']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
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
    console.error('Failed to update invoice status:', error)
    return NextResponse.json({ error: 'Failed to update invoice status' }, { status: 500 })
  }
}
