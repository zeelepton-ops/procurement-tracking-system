import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
          },
        },
      },
      orderBy: { requestTimestamp: 'asc' },
    })

    // Transform to include formatted data
    const formatted = pendingInspections.map(inspection => ({
      ...inspection,
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
