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

    const inspections = await prisma.productionInspection.findMany({
      where: { result: { not: null } },
      include: {
        productionRelease: {
          include: {
            jobOrderItem: {
              include: {
                jobOrder: true,
              },
            },
          },
        },
      },
      orderBy: { inspectionTimestamp: 'desc' },
    })

    const formatted = inspections.map(inspection => ({
      ...inspection,
      requestTimestampFormatted: inspection.requestTimestamp.toLocaleString(),
      inspectionTimestampFormatted: inspection.inspectionTimestamp
        ? inspection.inspectionTimestamp.toLocaleString()
        : null,
    }))

    return Response.json(formatted)
  } catch (error) {
    console.error('Error fetching completed inspections:', error)
    return Response.json(
      { error: 'Failed to fetch completed inspections' },
      { status: 500 }
    )
  }
}
