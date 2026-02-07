import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get last 3 invoices
    const lastInvoices = await prisma.invoice.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        invoiceNumber: true,
        client: {
          select: {
            name: true
          }
        },
        totalAmount: true,
        createdAt: true,
        status: true
      }
    })

    // Get the latest invoice number to calculate next ones
    const latestInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    })

    // Generate next 3 invoice numbers
    let nextNumbers: string[] = []
    const currentYear = new Date().getFullYear().toString().slice(-2)
    
    if (latestInvoice?.invoiceNumber) {
      // Extract number from format IN-NBTC-XXXX/YY
      const match = latestInvoice.invoiceNumber.match(/IN-NBTC-(\d+)\/(\d+)/)
      if (match) {
        let lastNum = parseInt(match[1])
        const lastYear = match[2]
        
        // If year changed, reset to 1
        if (lastYear !== currentYear) {
          lastNum = 0
        }
        
        // Generate next 3 numbers
        for (let i = 1; i <= 3; i++) {
          const nextNum = (lastNum + i).toString().padStart(4, '0')
          nextNumbers.push(`IN-NBTC-${nextNum}/${currentYear}`)
        }
      }
    }
    
    // If no invoices exist, start from 0001
    if (nextNumbers.length === 0) {
      for (let i = 1; i <= 3; i++) {
        const num = i.toString().padStart(4, '0')
        nextNumbers.push(`IN-NBTC-${num}/${currentYear}`)
      }
    }

    return NextResponse.json({
      lastInvoices: lastInvoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client.name,
        amount: inv.totalAmount,
        date: inv.createdAt,
        status: inv.status
      })),
      suggestedNumbers: nextNumbers
    })
  } catch (error) {
    console.error('Error fetching invoice suggestions:', error)
    return NextResponse.json({ 
      lastInvoices: [], 
      suggestedNumbers: [] 
    }, { status: 200 })
  }
}
