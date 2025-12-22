import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string; contactId: string } }) {
  try {
    const { id, contactId } = params
    const body = await request.json()

    if (body.isPrimary) {
      await prisma.supplierContact.updateMany({ where: { supplierId: id }, data: { isPrimary: false } })
    }

    const updated = await prisma.supplierContact.update({ where: { id: contactId }, data: { name: body.name, role: body.role || null, email: body.email || null, phone: body.phone || null, isPrimary: body.isPrimary ?? undefined, notes: body.notes || null } })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('Failed to update contact', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { contactId: string } }) {
  try {
    const { contactId } = params
    await prisma.supplierContact.delete({ where: { id: contactId } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err: any) {
    console.error('Failed to delete contact', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}