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
        include: {
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
