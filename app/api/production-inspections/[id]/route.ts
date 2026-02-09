import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const updateData: any = {}

    if (body.result !== undefined) updateData.result = body.result || null
    if (body.remarks !== undefined) updateData.remarks = body.remarks || null
    if (body.inspectedBy !== undefined) updateData.inspectedBy = body.inspectedBy || null
    if (body.inspectionTimestamp !== undefined) {
      updateData.inspectionTimestamp = body.inspectionTimestamp
        ? new Date(body.inspectionTimestamp)
        : null
    }

    const numberFields = ['inspectedQty', 'approvedQty', 'rejectedQty', 'holdQty']
    numberFields.forEach((field) => {
      if (body[field] !== undefined) {
        const value = body[field]
        updateData[field] = value === null || value === '' ? null : parseFloat(value)
      }
    })

    const inspection = await prisma.productionInspection.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(inspection)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update production inspection' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.productionInspection.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete production inspection' }, { status: 500 })
  }
}
