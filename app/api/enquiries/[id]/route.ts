import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: { responses: true },
  })
  if (!enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(enquiry)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await request.json()
  const { status } = body
  if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })

  const updated = await prisma.enquiry.update({
    where: { id },
    data: { status },
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  await prisma.enquiry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
