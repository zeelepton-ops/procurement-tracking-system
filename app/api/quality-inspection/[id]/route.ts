import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: Fetch a single inspection by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const inspection = await prisma.qualityInspection.findUnique({
    where: { id: params.id },
    include: {
      itpTemplate: true,
      steps: { 
        include: { photos: true },
        orderBy: { createdAt: 'asc' }
      },
      jobOrderItem: {
        select: {
          workDescription: true,
          quantity: true,
          unit: true,
          unitWeight: true,
          jobOrder: {
            select: {
              jobNumber: true,
              clientName: true,
              drawingRef: true,
            }
          }
        }
      }
    }
  });
  
  if (!inspection) {
    return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
  }
  
  return NextResponse.json(inspection);
}

// PATCH: Update inspection header fields (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const updateData: any = {}

    if (body.drawingNumber !== undefined) updateData.drawingNumber = body.drawingNumber || null
    if (body.transmittalNo !== undefined) updateData.transmittalNo = body.transmittalNo || null
    if (body.remarks !== undefined) updateData.remarks = body.remarks || null

    if (body.inspectionDate !== undefined) {
      updateData.inspectionDate = body.inspectionDate ? new Date(body.inspectionDate) : null
    }

    const numberFields = ['inspectedQty', 'approvedQty', 'rejectedQty', 'holdQty', 'inspectedWeight']
    numberFields.forEach((field) => {
      if (body[field] !== undefined) {
        const value = body[field]
        updateData[field] = value === null || value === '' ? null : parseFloat(value)
      }
    })

    const inspection = await prisma.qualityInspection.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(inspection)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 })
  }
}

// DELETE: Delete an inspection
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await prisma.qualityInspection.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 });
  }
}
