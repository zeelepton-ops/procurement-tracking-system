import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/notifications'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const body = await request.json()
    const status = body.status || 'APPROVED'
    const notes = body.notes || null

    const updated = await prisma.supplier.update({ where: { id }, data: { status, notes } })

    // send notification email to primary supplier contact if available
    try {
      const primary = await prisma.supplierContact.findFirst({ where: { supplierId: id, isPrimary: true } })
      const to = primary?.email || updated.email
      if (to) {
        const subject = `Your supplier registration has been ${status.toLowerCase()}`
        const text = `Hello ${primary?.name || updated.name},\n\nYour supplier registration status has been updated to ${status}.${notes ? `\n\nNotes: ${notes}` : ''}\n\nRegards, Procurement Team` 
        await sendEmail({ to, subject, text, supplierId: id })
      }
    } catch (notifyErr) {
      console.error('Failed to send approval email', notifyErr)
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('Failed to approve supplier', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}