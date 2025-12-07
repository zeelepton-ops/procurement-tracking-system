import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const jobOrders = await prisma.jobOrder.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(jobOrders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch job orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const jobOrder = await prisma.jobOrder.create({
      data: {
        jobNumber: body.jobNumber,
        productName: body.productName,
        drawingRef: body.drawingRef || null
      }
    })
    
    return NextResponse.json(jobOrder, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job order' }, { status: 500 })
  }
}
