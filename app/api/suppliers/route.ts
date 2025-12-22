import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(suppliers)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await prisma.supplier.create({ data: body })
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