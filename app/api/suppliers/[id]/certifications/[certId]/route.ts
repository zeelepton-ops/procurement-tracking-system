import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { certId: string } }) {
  try {
    const { certId } = params
    const body = await request.json()
    const updated = await prisma.supplierCertification.update({ where: { id: certId }, data: { name: body.name || undefined, certNumber: body.certNumber || null, issuedBy: body.issuedBy || null, validFrom: body.validFrom ? new Date(body.validFrom) : undefined, validTo: body.validTo ? new Date(body.validTo) : undefined, documentId: body.documentId || null } })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('Failed to update certification', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { certId: string } }) {
  try {
    const { certId } = params
    await prisma.supplierCertification.delete({ where: { id: certId } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err: any) {
    console.error('Failed to delete certification', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}