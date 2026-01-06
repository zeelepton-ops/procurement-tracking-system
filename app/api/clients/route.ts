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

    try {
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
    } catch (dbError: any) {
      if (dbError.code === 'P2021') {
        console.log('Client table does not exist yet - returning empty array')
        return NextResponse.json([])
      }
      throw dbError
    }
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

    // Check for duplicate CR No. (only if provided)
    if (body.crNo && body.crNo.trim()) {
      const existingClient = await prisma.client.findUnique({
        where: { crNo: body.crNo.trim() }
      })

      if (existingClient) {
        return NextResponse.json({ 
          error: 'Client with this CR No. already exists' 
        }, { status: 400 })
      }
    }

    // Check for duplicate tax ID (only if provided)
    if (body.taxId && body.taxId.trim()) {
      const existingClient = await prisma.client.findUnique({
        where: { taxId: body.taxId.trim() }
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
        crNo: body.crNo && body.crNo.trim() ? body.crNo.trim() : null,
        crExpiryDate: body.crExpiryDate ? new Date(body.crExpiryDate) : null,
        email: body.email || null,
        phone: body.phone || null,
        contactPerson: body.contactPerson || null,
        contactPhone: body.contactPhone || null,
        address: body.address || null,
        taxId: body.taxId && body.taxId.trim() ? body.taxId.trim() : null,
        taxIdExpiryDate: body.taxIdExpiryDate ? new Date(body.taxIdExpiryDate) : null,
        establishmentCardNo: body.establishmentCardNo || null,
        establishmentCardExpiryDate: body.establishmentCardExpiryDate ? new Date(body.establishmentCardExpiryDate) : null,
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

    // Check for duplicate CR No. (only if provided and not empty)
    if (updateData.crNo && updateData.crNo.trim()) {
      const existingClient = await prisma.client.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { crNo: updateData.crNo.trim() }
          ]
        }
      })

      if (existingClient) {
        return NextResponse.json({ 
          error: 'Client with this CR No. already exists' 
        }, { status: 400 })
      }
    }

    // Check for duplicate tax ID (only if provided and not empty)
    if (updateData.taxId && updateData.taxId.trim()) {
      const existingClient = await prisma.client.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { taxId: updateData.taxId.trim() }
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
        crNo: updateData.crNo && updateData.crNo.trim() ? updateData.crNo.trim() : null,
        taxId: updateData.taxId && updateData.taxId.trim() ? updateData.taxId.trim() : null,
        crExpiryDate: updateData.crExpiryDate ? new Date(updateData.crExpiryDate) : null,
        taxIdExpiryDate: updateData.taxIdExpiryDate ? new Date(updateData.taxIdExpiryDate) : null,
        establishmentCardExpiryDate: updateData.establishmentCardExpiryDate ? new Date(updateData.establishmentCardExpiryDate) : null,
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
