import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const preps = await prisma.pOPreparation.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(preps)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await prisma.pOPreparation.create({ data: body })
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    console.error('Failed to create PO prep', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}