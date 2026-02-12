import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all pending inspections (result = null) with their associated releases and job order details
    const pendingInspections = await prisma.productionInspection.findMany({
      where: {
        result: null, // inspection not yet completed
      },
      include: {
        productionRelease: {
          include: {
            jobOrderItem: {
              include: {
                jobOrder: true,
              },
            },
            inspections: {
              orderBy: { requestTimestamp: 'desc' },
              take: 1, // latest inspection
            },
            qualityInspections: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true }
            }
          },
        },
      },
      orderBy: { requestTimestamp: 'asc' },
    })

    // Transform to include formatted data
    const formatted = pendingInspections.map(inspection => ({
      ...inspection,
      qualityInspectionId: inspection.productionRelease?.qualityInspections?.[0]?.id || null,
      productionRelease: {
        ...inspection.productionRelease,
        // Add formatted dates
        requestTimestampFormatted: inspection.requestTimestamp.toLocaleString(),
      },
    }))

    return Response.json(formatted)
  } catch (error) {
    console.error('Error fetching pending inspections:', error)
    return Response.json(
      { error: 'Failed to fetch pending inspections' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ error: 'Inspection id is required' }, { status: 400 })
    }

    const inspection = await prisma.productionInspection.findUnique({
      where: { id },
      include: { productionRelease: true }
    })

    if (!inspection) {
      return Response.json({ error: 'Inspection not found' }, { status: 404 })
    }

    const releaseId = inspection.productionReleaseId

    await prisma.$transaction(async (tx) => {
      await tx.productionInspection.delete({ where: { id } })

      const remaining = await tx.productionInspection.count({
        where: { productionReleaseId: releaseId }
      })

      if (remaining === 0) {
        const current = await tx.productionRelease.findUnique({ where: { id: releaseId } })
        if (current) {
          await tx.productionRelease.update({
            where: { id: releaseId },
            data: {
              status: 'IN_PRODUCTION',
              inspectionCount: Math.max((current.inspectionCount || 0) - 1, 0)
            }
          })
        }
      }
    })

    return Response.json({ message: 'Inspection deleted' })
  } catch (error) {
    console.error('Error deleting pending inspection:', error)
    return Response.json({ error: 'Failed to delete inspection' }, { status: 500 })
  }
}
