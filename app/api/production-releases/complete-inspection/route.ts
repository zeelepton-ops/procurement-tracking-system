import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { productionReleaseId, result, remarks, inspectedBy, inspectedQty, approvedQty, rejectedQty, holdQty } = body

    if (!productionReleaseId || !result || !inspectedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate result value
    const validResults = ['APPROVED', 'REJECTED', 'HOLD']
    if (!validResults.includes(result)) {
      return NextResponse.json({ error: 'Invalid result value' }, { status: 400 })
    }

    // Get current release
    const release = await prisma.productionRelease.findUnique({
      where: { id: productionReleaseId }
    })

    if (!release) {
      return NextResponse.json({ error: 'Production release not found' }, { status: 404 })
    }

    // Determine new status based on inspection result
    let newStatus = 'IN_PRODUCTION'
    if (result === 'APPROVED') {
      newStatus = 'APPROVED'
    } else if (result === 'REJECTED') {
      newStatus = 'REWORK'
    } else if (result === 'HOLD') {
      newStatus = 'PENDING_INSPECTION' // Stays pending until resolved
    }

    // Update last inspection and release status
    const [inspection, updatedRelease] = await Promise.all([
      prisma.productionInspection.updateMany({
        where: {
          productionReleaseId,
          result: null // Only update the pending inspection
        },
        data: {
          result,
          remarks,
          inspectedBy,
          inspectionTimestamp: new Date(),
          inspectedQty,
          approvedQty,
          rejectedQty,
          holdQty
        }
      }),
      prisma.productionRelease.update({
        where: { id: productionReleaseId },
        data: {
          status: newStatus
        },
        include: {
          jobOrderItem: {
            include: {
              jobOrder: true
            }
          },
          inspections: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      })
    ])

    return NextResponse.json({
      release: updatedRelease,
      message: `Inspection completed. Status: ${newStatus}`
    })
  } catch (error) {
    console.error('Error completing inspection:', error)
    return NextResponse.json({ error: 'Failed to complete inspection' }, { status: 500 })
  }
}
