import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        contacts: true,
        capabilities: true,
        certifications: true,
        documents: true,
        references: true,
        bankDetails: true,
        supplierPrices: true,
      },
    })
    if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(supplier)
  } catch (err: any) {
    console.error('GET supplier failed', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = params
    const body = await request.json()

    // Only admins or the supplier's creator can change certain fields (simple rule for now)
    const isAdmin = !!session?.user && session.user.role === 'ADMIN'

    // Disallow status change unless admin
    if (body.status && body.status !== 'PENDING' && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to change status' }, { status: 403 })
    }

    // Add updatedBy field
    const dataToUpdate = {
      ...body,
      updatedBy: session?.user?.email || session?.user?.name || 'Unknown'
    }

    const updated = await prisma.supplier.update({ where: { id }, data: dataToUpdate })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('PATCH supplier failed', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    await prisma.supplier.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err: any) {
    console.error('DELETE supplier failed', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}