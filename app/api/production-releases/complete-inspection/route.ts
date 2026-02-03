import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { productionReleaseId, productionInspectionId, result, remarks, inspectedBy, inspectedQty, approvedQty, rejectedQty, holdQty } = body

    // Try to get releaseId from either field
    const releaseId = productionReleaseId
    
    if (!releaseId || !result || !inspectedBy) {
      return NextResponse.json({ error: 'Missing required fields: productionReleaseId, result, inspectedBy' }, { status: 400 })
    }

    // Validate result value
    const validResults = ['APPROVED', 'REJECTED', 'HOLD']
    if (!validResults.includes(result)) {
      return NextResponse.json({ error: 'Invalid result value' }, { status: 400 })
    }

    // Get current release
    const release = await prisma.productionRelease.findUnique({
      where: { id: releaseId }
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
          productionReleaseId: releaseId,
          result: null // Only update the pending inspection
        },
        data: {
          result,
          remarks,
          inspectedBy,
          inspectionTimestamp: new Date(),
          inspectedQty: inspectedQty || 0,
          approvedQty: approvedQty || 0,
          rejectedQty: rejectedQty || 0,
          holdQty: holdQty || 0
        }
      }),
      prisma.productionRelease.update({
        where: { id: releaseId },
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
