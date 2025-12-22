import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

type Attachment = { filename: string; url: string }

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const responses = await prisma.enquiryResponse.findMany({ where: { enquiryId: id } })
  return NextResponse.json(responses)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params

  const contentType = request.headers.get('content-type') || ''
  let supplierId: string | undefined
  let quoteJson: unknown
  let total: number | undefined
  let attachments: Attachment[] = []

  if (contentType.startsWith('multipart/form-data')) {
    const fd = await request.formData()
    supplierId = String(fd.get('supplierId') || '')
    const q = fd.get('quoteJson')
    try { quoteJson = q ? JSON.parse(String(q)) : null } catch (_) { quoteJson = String(q) }
    const t = fd.get('total')
    total = t ? Number(t) : undefined

    const file = fd.get('file') as File | null
    if (file) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'enquiries', id)
      await fs.promises.mkdir(uploadsDir, { recursive: true })
      const filename = `${Date.now()}_${file.name}`
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const filePath = path.join(uploadsDir, filename)
      await fs.promises.writeFile(filePath, buffer)
      const url = `/uploads/enquiries/${id}/${filename}`
      attachments.push({ filename, url })
    }
  } else {
    const body = await request.json()
    supplierId = body.supplierId
    quoteJson = body.quoteJson
    total = body.total
    attachments = body.attachments || []
  }

  if (!supplierId || quoteJson === undefined || typeof total !== 'number') {
    return NextResponse.json({ error: 'supplierId, quoteJson and total are required' }, { status: 400 })
  }

  const response = await prisma.enquiryResponse.create({
    data: {
      enquiryId: id,
      supplierId,
      quoteJson: quoteJson as any,
      total,
      attachments: attachments.length ? attachments : undefined,
    },
  })

  // Update enquiry status to RESPONSES_RECEIVED if it was SENT.
  await prisma.enquiry.update({ where: { id }, data: { status: 'RESPONSES_RECEIVED' } })

  return NextResponse.json(response)
}
