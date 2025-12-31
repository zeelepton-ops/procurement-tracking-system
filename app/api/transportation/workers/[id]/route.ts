import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const worker = await prisma.worker.update({
      where: { id: params.id },
      data: {
        name: body.name,
        qid: body.qid || null,
        phone: body.phone || null,
        shift: body.shift,
        priority: body.priority,
        department: body.department || null,
        position: body.position || null
      }
    })

    return NextResponse.json(worker)
  } catch (error) {
    console.error('Error updating worker:', error)
    return NextResponse.json({ error: 'Failed to update worker' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.worker.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Worker deleted successfully' })
  } catch (error) {
    console.error('Error deleting worker:', error)
    return NextResponse.json({ error: 'Failed to delete worker' }, { status: 500 })
  }
}
