import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const items = await prisma.supplierCapability.findMany({ where: { supplierId: id } })
    return NextResponse.json(items)
  } catch (err: any) {
    console.error('Failed to list capabilities', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    if (!body.category || !body.name) return NextResponse.json({ error: 'category and name required' }, { status: 400 })

    const created = await prisma.supplierCapability.create({ data: { supplierId: id, category: body.category, name: body.name, details: body.details || null, capacity: body.capacity || null } })
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    console.error('Failed to create capability', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}