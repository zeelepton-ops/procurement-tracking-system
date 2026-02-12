import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productionReleaseId } = body

    if (!productionReleaseId) {
      return NextResponse.json({ error: 'productionReleaseId is required' }, { status: 400 })
    }

    // Get the release with context for QC creation
    const release = await prisma.productionRelease.findUnique({
      where: { id: productionReleaseId },
      include: {
        jobOrderItem: {
          select: {
            id: true,
            unitWeight: true
          }
        }
      }
    })

    if (!release) {
      return NextResponse.json({ error: 'Production release not found' }, { status: 404 })
    }

    const template = release.itpTemplateId
      ? await prisma.iTPTemplate.findUnique({ where: { id: release.itpTemplateId } })
      : await prisma.iTPTemplate.findFirst({ where: { isDefault: true } })

    if (!template) {
      return NextResponse.json({ error: 'No ITP template available for inspection' }, { status: 400 })
    }

    const inspectedQty = release.releaseQty ?? null
    const inspectedWeight =
      release.jobOrderItem?.unitWeight !== null && release.jobOrderItem?.unitWeight !== undefined && inspectedQty !== null
        ? release.jobOrderItem.unitWeight * inspectedQty
        : null

    // Create inspection record and update release status
    const [inspection, qcInspection, updatedRelease] = await prisma.$transaction([
      prisma.productionInspection.create({
        data: {
          productionReleaseId,
          inspectionNumber: release.inspectionCount + 1,
          requestTimestamp: new Date()
        }
      }),
      prisma.qualityInspection.create({
        data: {
          jobOrderItemId: release.jobOrderItemId,
          productionReleaseId: release.id,
          itpTemplateId: template.id,
          isCritical: false,
          status: 'PENDING',
          drawingNumber: release.drawingNumber || null,
          transmittalNo: release.transmittalNo || null,
          inspectedQty,
          inspectedWeight,
          inspectionDate: new Date(),
          createdBy: release.createdBy || 'system',
          steps: {
            create: template.steps.map((stepName: string) => ({ stepName }))
          }
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
      qcInspection,
      release: updatedRelease
    }, { status: 201 })
  } catch (error) {
    console.error('Error pushing for inspection:', error)
    return NextResponse.json({ error: 'Failed to push for inspection' }, { status: 500 })
  }
}
