import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, sendSms } from '@/lib/notifications'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10)

  const [enquiries, total] = await Promise.all([
    prisma.enquiry.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { responses: true },
    }),
    prisma.enquiry.count(),
  ])

  return NextResponse.json({ data: enquiries, meta: { page, pageSize, total } })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { prepId, supplierIds = [], message, sendNow = false, createdBy } = body

  if (!prepId || !Array.isArray(supplierIds)) {
    return NextResponse.json({ error: 'prepId and supplierIds are required' }, { status: 400 })
  }

  const enquiry = await prisma.enquiry.create({
    data: {
      prepId,
      createdBy,
      supplierIds,
      message,
      status: sendNow ? 'SENT' : 'DRAFT',
      sentAt: sendNow ? new Date() : null,
    },
  })

  if (sendNow) {
    // send notifications to suppliers in the background
    Promise.all(supplierIds.map(async (sid: string) => {
      try {
        const supplier = await prisma.supplier.findUnique({ where: { id: sid } })
        if (!supplier) return
        const contactMessage = message || `Please provide your quotation for preparation ${prepId}.`
        const subject = `Quotation request: Preparation ${prepId}`

        if (supplier.email) {
          await sendEmail({ to: supplier.email, subject, html: `<p>${contactMessage}</p><p>Ref: ${prepId}</p>`, enquiryId: enquiry.id, supplierId: supplier.id })
        }
        if (supplier.phone) {
          await sendSms({ to: supplier.phone, body: `${contactMessage} Ref: ${prepId}`, enquiryId: enquiry.id, supplierId: supplier.id })
        }
      } catch (err) {
        console.error('Failed to notify supplier', sid, err)
      }
    }))
  }

  return NextResponse.json(enquiry)
}
