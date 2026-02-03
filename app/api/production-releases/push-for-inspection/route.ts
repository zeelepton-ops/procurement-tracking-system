import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productionReleaseId } = body

    if (!productionReleaseId) {
      return NextResponse.json({ error: 'productionReleaseId is required' }, { status: 400 })
    }

    // Get the release and update status
    const release = await prisma.productionRelease.findUnique({
      where: { id: productionReleaseId }
    })

    if (!release) {
      return NextResponse.json({ error: 'Production release not found' }, { status: 404 })
    }

    // Create inspection record and update release status
    const [inspection, updatedRelease] = await Promise.all([
      prisma.productionInspection.create({
        data: {
          productionReleaseId,
          inspectionNumber: release.inspectionCount + 1,
          requestTimestamp: new Date()
        }
      }),
      prisma.productionRelease.update({
        where: { id: productionReleaseId },
        data: {
          status: 'PENDING_INSPECTION',
          inspectionCount: release.inspectionCount + 1
        },
        include: {
          jobOrderItem: {
            include: {
              jobOrder: true
            }
          },
          inspections: true
        }
      })
    ])

    return NextResponse.json({
      inspection,
      release: updatedRelease
    }, { status: 201 })
  } catch (error) {
    console.error('Error pushing for inspection:', error)
    return NextResponse.json({ error: 'Failed to push for inspection' }, { status: 500 })
  }
}
