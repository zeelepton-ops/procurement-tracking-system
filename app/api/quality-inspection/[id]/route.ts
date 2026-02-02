import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
          jobOrder: {
            select: {
              jobNumber: true,
              clientName: true,
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

// DELETE: Delete an inspection
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.qualityInspection.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 });
  }
}
