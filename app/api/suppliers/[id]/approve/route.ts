import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const body = await request.json()
    const status = body.status || 'APPROVED'
    const notes = body.notes || null

    const updated = await prisma.supplier.update({ where: { id }, data: { status, notes } })

    // TODO: send notification email to supplier contact on approval

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('Failed to approve supplier', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}