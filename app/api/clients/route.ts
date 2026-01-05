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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'ALL'

    const whereClause: any = {}
    
    if (status !== 'ALL') {
      whereClause.status = status
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ]
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            jobOrders: true,
            invoices: true
          }
        }
      }
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Failed to fetch clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check for duplicate tax ID
    if (body.taxId) {
      const existingClient = await prisma.client.findUnique({
        where: { taxId: body.taxId }
      })

      if (existingClient) {
        return NextResponse.json({ 
          error: 'Client with this Tax ID already exists' 
        }, { status: 400 })
      }
    }

    const client = await prisma.client.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        contactPerson: body.contactPerson || null,
        contactPhone: body.contactPhone || null,
        address: body.address || null,
        taxId: body.taxId || null,
        paymentTerms: body.paymentTerms || 'Net 30',
        creditLimit: body.creditLimit ? parseFloat(body.creditLimit) : null,
        status: body.status || 'ACTIVE',
        createdBy: session.user?.email || 'system'
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Failed to create client:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Check for duplicate tax ID (excluding current client)
    if (updateData.taxId) {
      const existingClient = await prisma.client.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { taxId: updateData.taxId }
          ]
        }
      })

      if (existingClient) {
        return NextResponse.json({ 
          error: 'Client with this Tax ID already exists' 
        }, { status: 400 })
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...updateData,
        creditLimit: updateData.creditLimit ? parseFloat(updateData.creditLimit) : undefined,
        updatedBy: session.user?.email || 'system'
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Failed to update client:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
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
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Check if client has associated job orders or invoices
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobOrders: true,
            invoices: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client._count.jobOrders > 0 || client._count.invoices > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete client with existing job orders or invoices. Please set status to INACTIVE instead.' 
      }, { status: 400 })
    }

    await prisma.client.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete client:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
