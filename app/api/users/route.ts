import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        qid: true,
        joiningDate: true,
        department: true,
        position: true,
        phone: true,
        isActive: true,
        createdAt: true,
        approvedBy: true,
        approvedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, action, role, status, isActive, name, qid, joiningDate, department, position, phone } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const updateData: any = {}

    // Handle approval/rejection
    if (action === 'approve') {
      updateData.status = 'APPROVED'
      updateData.approvedBy = session.user.email
      updateData.approvedAt = new Date()
    } else if (action === 'reject') {
      updateData.status = 'REJECTED'
    } else {
      // Handle other updates
      if (role) updateData.role = role
      if (status) updateData.status = status
      if (typeof isActive === 'boolean') updateData.isActive = isActive

      // Editable profile fields
      if (typeof name === 'string') updateData.name = name
      if (typeof qid === 'string') updateData.qid = qid || null
      if (typeof department === 'string') updateData.department = department || null
      if (typeof position === 'string') updateData.position = position || null
      if (typeof phone === 'string') updateData.phone = phone || null
      if (joiningDate) {
        // Accept either date string or Date
        updateData.joiningDate = new Date(joiningDate)
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isActive: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
