import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const enquiryId = url.searchParams.get('enquiryId')
  const supplierId = url.searchParams.get('supplierId')

  const where: any = {}
  if (enquiryId) where.enquiryId = enquiryId
  if (supplierId) where.supplierId = supplierId

  const notifications = await prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(notifications)
}
