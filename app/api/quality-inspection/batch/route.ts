import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobOrderId, itpTemplateId, isCritical } = await request.json()

    // Validate inputs
    if (!jobOrderId || !itpTemplateId) {
      return NextResponse.json(
        { error: 'Job Order ID and ITP Template ID are required' },
        { status: 400 }
      )
    }

    // Verify job order exists
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: { items: true },
    })

    if (!jobOrder) {
      return NextResponse.json({ error: 'Job order not found' }, { status: 404 })
    }

    if (jobOrder.items.length === 0) {
      return NextResponse.json(
        { error: 'Job order has no line items' },
        { status: 400 }
      )
    }

    // Verify ITP template exists
    const template = await prisma.iTPTemplate.findUnique({
      where: { id: itpTemplateId },
    })

    if (!template) {
      return NextResponse.json({ error: 'ITP template not found' }, { status: 404 })
    }

    // Create inspections for each job order item
    const inspections = await Promise.all(
      jobOrder.items.map(async (item) => {
        const inspectedQty = item.quantity ?? null
        const unitWeight = (item as any).unitWeight ?? null
        const inspectedWeight =
          unitWeight !== null && inspectedQty !== null ? unitWeight * inspectedQty : null
        const inspection = await prisma.qualityInspection.create({
          data: {
            jobOrderItemId: item.id,
            itpTemplateId,
            isCritical,
            createdBy: userEmail,
            drawingNumber: jobOrder.drawingRef || null,
            inspectionDate: new Date(),
            inspectedQty,
            inspectedWeight,
            steps: {
              create: template.steps.map((stepName) => ({
                stepName,
                status: 'PENDING',
              })),
            },
          },
          include: {
            jobOrderItem: {
              include: {
                jobOrder: true,
              },
            },
            itpTemplate: true,
            steps: true,
          },
        })
        return inspection
      })
    )

    return NextResponse.json({
      message: `Created ${inspections.length} inspections for all line items`,
      inspections,
    })
  } catch (error) {
    console.error('Error creating batch inspections:', error)
    return NextResponse.json(
      { error: 'Failed to create inspections' },
      { status: 500 }
    )
  }
}
