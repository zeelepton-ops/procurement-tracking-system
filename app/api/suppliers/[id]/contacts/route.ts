import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const contacts = await prisma.supplierContact.findMany({ where: { supplierId: id }, orderBy: { isPrimary: 'desc' } })
    return NextResponse.json(contacts)
  } catch (err: any) {
    console.error('Failed to list contacts', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    // If setting isPrimary, clear others
    if (body.isPrimary) {
      await prisma.supplierContact.updateMany({ where: { supplierId: id }, data: { isPrimary: false } })
    }

    const created = await prisma.supplierContact.create({ data: { supplierId: id, name: body.name, role: body.role || null, email: body.email || null, phone: body.phone || null, isPrimary: body.isPrimary || false, notes: body.notes || null } })
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    console.error('Failed to create contact', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}