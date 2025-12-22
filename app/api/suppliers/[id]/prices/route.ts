import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supplierId = searchParams.get('supplierId')
  if (!supplierId) return NextResponse.json({ error: 'supplierId required' }, { status: 400 })
  const prices = await prisma.supplierPrice.findMany({ where: { supplierId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(prices)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await prisma.supplierPrice.create({ data: body })
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    console.error('Failed to create supplier price', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}