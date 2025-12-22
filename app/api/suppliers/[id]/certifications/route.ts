import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const items = await prisma.supplierCertification.findMany({ where: { supplierId: id } })
    return NextResponse.json(items)
  } catch (err: any) {
    console.error('Failed to list certifications', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    const created = await prisma.supplierCertification.create({ data: { supplierId: id, name: body.name, certNumber: body.certNumber || null, issuedBy: body.issuedBy || null, validFrom: body.validFrom ? new Date(body.validFrom) : null, validTo: body.validTo ? new Date(body.validTo) : null, documentId: body.documentId || null } })
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    console.error('Failed to create certification', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}