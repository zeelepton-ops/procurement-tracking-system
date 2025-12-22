import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const where = q
      ? { OR: [{ name: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }, { tradingName: { contains: q, mode: 'insensitive' as Prisma.QueryMode } }] }
      : undefined

    const suppliers = await prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, include: { contacts: true, capabilities: true, supplierPrices: true } })
    return NextResponse.json(suppliers)
  } catch (err: any) {
    console.error('Failed to list suppliers', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Minimal validation
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    const created = await prisma.supplier.create({
      data: {
        name: body.name,
        tradingName: body.tradingName || null,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        website: body.website || null,
        paymentTerms: body.paymentTerms || null,
        leadTimeDays: body.leadTimeDays ?? null,
        defaultCurrency: body.defaultCurrency || 'QAR',
        taxId: body.taxId || null,
        tradeLicense: body.tradeLicense || null,
        notes: body.notes || null,
        // create primary contact if provided
        contacts: body.contact ? { create: { name: body.contact.name, role: body.contact.role || 'Primary', email: body.contact.email || null, phone: body.contact.phone || null, isPrimary: true } } : undefined
      }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    console.error('Failed to create supplier', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const updated = await prisma.supplier.update({ where: { id: body.id }, data: body })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('Failed to update supplier', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.supplier.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err: any) {
    console.error('Failed to delete supplier', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}