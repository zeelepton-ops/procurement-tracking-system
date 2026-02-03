import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobOrderItemId = searchParams.get('jobOrderItemId')
    const status = searchParams.get('status')
    const jobOrderId = searchParams.get('jobOrderId')

    const where: any = {}
    
    if (jobOrderItemId) {
      where.jobOrderItemId = jobOrderItemId
    }
    if (status) {
      where.status = status
    }
    if (jobOrderId) {
      where.jobOrderItem = {
        jobOrder: {
          id: jobOrderId
        }
      }
    }

    const releases = await prisma.productionRelease.findMany({
      where,
      include: {
        jobOrderItem: {
          include: {
            jobOrder: {
              select: {
                id: true,
                jobNumber: true,
                clientName: true
              }
            }
          }
        },
        itpTemplate: true,
        inspections: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(releases)
  } catch (error) {
    console.error('Error fetching production releases:', error)
    return NextResponse.json({ error: 'Failed to fetch releases' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { jobOrderItemId, drawingNumber, releaseQty, itpTemplateId, productionStartDate, createdBy } = body

    // Validate input
    if (!jobOrderItemId || !releaseQty || !createdBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get job order item to check order quantity
    const jobOrderItem = await prisma.jobOrderItem.findUnique({
      where: { id: jobOrderItemId },
      include: {
        productionReleases: true
      }
    })

    if (!jobOrderItem) {
      return NextResponse.json({ error: 'Job order item not found' }, { status: 404 })
    }

    // Calculate remaining quantity
    const totalReleased = jobOrderItem.productionReleases.reduce((sum, rel) => sum + rel.releaseQty, 0)
    const remainingQty = (jobOrderItem.quantity || 0) - totalReleased

    if (releaseQty > remainingQty) {
      return NextResponse.json(
        { error: `Release quantity (${releaseQty}) exceeds remaining quantity (${remainingQty})` },
        { status: 400 }
      )
    }

    // Calculate theoretical weight
    const releaseWeight = jobOrderItem.unitWeight ? releaseQty * jobOrderItem.unitWeight : undefined

    const release = await prisma.productionRelease.create({
      data: {
        jobOrderItemId,
        drawingNumber,
        releaseQty,
        releaseWeight,
        itpTemplateId,
        productionStartDate: productionStartDate ? new Date(productionStartDate) : undefined,
        createdBy,
        status: 'PLANNING'
      },
      include: {
        jobOrderItem: {
          include: {
            jobOrder: {
              select: {
                id: true,
                jobNumber: true,
                clientName: true
              }
            }
          }
        },
        itpTemplate: true
      }
    })

    return NextResponse.json(release, { status: 201 })
  } catch (error) {
    console.error('Error creating production release:', error)
    return NextResponse.json({ error: 'Failed to create release' }, { status: 500 })
  }
}
