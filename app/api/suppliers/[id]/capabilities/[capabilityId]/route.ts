import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string; capabilityId: string } }) {
  try {
    const { capabilityId } = params
    const body = await request.json()
    const updated = await prisma.supplierCapability.update({ where: { id: capabilityId }, data: { category: body.category || undefined, name: body.name || undefined, details: body.details || null, capacity: body.capacity || null } })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('Failed to update capability', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { capabilityId: string } }) {
  try {
    const { capabilityId } = params
    await prisma.supplierCapability.delete({ where: { id: capabilityId } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err: any) {
    console.error('Failed to delete capability', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}