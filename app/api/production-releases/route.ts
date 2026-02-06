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
    const { jobOrderItemId, drawingNumber, releaseQty, releaseItems, itpTemplateId, productionStartDate, productionEndDate, actualCompletionDate, createdBy } = body

    // Validate input
    if (!jobOrderItemId || !createdBy) {
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

    const items = Array.isArray(releaseItems) && releaseItems.length > 0
      ? releaseItems
          .filter((it: any) => Number(it.releaseQty) > 0)
          .map((it: any) => ({
            drawingNumber: it.drawingNumber || null,
            releaseQty: Number(it.releaseQty)
          }))
      : [{ drawingNumber: drawingNumber || null, releaseQty: Number(releaseQty) }]

    const totalRequested = items.reduce((sum: number, it: any) => sum + (it.releaseQty || 0), 0)
    if (!totalRequested || totalRequested <= 0) {
      return NextResponse.json({ error: 'Release quantity must be greater than zero' }, { status: 400 })
    }

    if (totalRequested > remainingQty) {
      return NextResponse.json(
        { error: `Release quantity (${totalRequested}) exceeds remaining quantity (${remainingQty})` },
        { status: 400 }
      )
    }

    const created = await prisma.$transaction(
      items.map((item: any) => {
        const relWeight = jobOrderItem.unitWeight ? item.releaseQty * jobOrderItem.unitWeight : undefined
        return prisma.productionRelease.create({
          data: {
            jobOrderItemId,
            drawingNumber: item.drawingNumber || undefined,
            releaseQty: item.releaseQty,
            releaseWeight: relWeight,
            itpTemplateId,
            productionStartDate: productionStartDate ? new Date(productionStartDate) : undefined,
            productionEndDate: productionEndDate ? new Date(productionEndDate) : undefined,
            actualCompletionDate: actualCompletionDate ? new Date(actualCompletionDate) : undefined,
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
      })
    )

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating production release:', error)
    return NextResponse.json({ error: 'Failed to create release' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, drawingNumber, releaseQty, itpTemplateId, productionStartDate, productionEndDate, actualCompletionDate } = body

    if (!id || !releaseQty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await prisma.productionRelease.findUnique({
      where: { id },
      include: { jobOrderItem: { include: { productionReleases: true } }, inspections: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Production release not found' }, { status: 404 })
    }

    const totalReleased = existing.jobOrderItem.productionReleases
      .filter(rel => rel.id !== id)
      .reduce((sum, rel) => sum + rel.releaseQty, 0)
    const remainingQty = (existing.jobOrderItem.quantity || 0) - totalReleased

    if (releaseQty > remainingQty) {
      return NextResponse.json(
        { error: `Release quantity (${releaseQty}) exceeds remaining quantity (${remainingQty})` },
        { status: 400 }
      )
    }

    const releaseWeight = existing.jobOrderItem.unitWeight ? releaseQty * existing.jobOrderItem.unitWeight : undefined

    const updated = await prisma.productionRelease.update({
      where: { id },
      data: {
        drawingNumber: drawingNumber || null,
        releaseQty,
        releaseWeight,
        itpTemplateId: itpTemplateId || null,
        productionStartDate: productionStartDate ? new Date(productionStartDate) : null,
        productionEndDate: productionEndDate ? new Date(productionEndDate) : null,
        actualCompletionDate: actualCompletionDate ? new Date(actualCompletionDate) : null
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating production release:', error)
    return NextResponse.json({ error: 'Failed to update release' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Release id is required' }, { status: 400 })
    }

    const existing = await prisma.productionRelease.findUnique({
      where: { id },
      include: { inspections: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Production release not found' }, { status: 404 })
    }

    if (existing.inspections && existing.inspections.length > 0) {
      return NextResponse.json({ error: 'Cannot delete release with inspections' }, { status: 400 })
    }

    await prisma.productionRelease.delete({ where: { id } })
    return NextResponse.json({ message: 'Production release deleted' })
  } catch (error) {
    console.error('Error deleting production release:', error)
    return NextResponse.json({ error: 'Failed to delete release' }, { status: 500 })
  }
}
