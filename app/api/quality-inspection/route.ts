import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET: Fetch all inspections or by job order item
export async function GET(req: NextRequest) {
  const jobOrderItemId = req.nextUrl.searchParams.get('jobOrderItemId');
  
  const inspections = await prisma.qualityInspection.findMany({
    where: jobOrderItemId ? { jobOrderItemId } : undefined,
    include: {
      itpTemplate: true,
      steps: { include: { photos: true } },
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
    },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(inspections);
}

// POST: Create a new inspection for a job order item
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const body = await req.json();
  const { jobOrderItemId, itpTemplateId, isCritical } = body;
  const createdBy = session?.user?.email || 'system';
  
  if (!jobOrderItemId || !itpTemplateId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  // Validate job order item
  const jobOrderItem = await prisma.jobOrderItem.findUnique({
    where: { id: jobOrderItemId },
    select: { id: true }
  });
  if (!jobOrderItem) {
    return NextResponse.json({ error: 'Job order item not found' }, { status: 400 });
  }

  // Get ITP steps
  const itp = await prisma.iTPTemplate.findUnique({ where: { id: itpTemplateId } });
  if (!itp) return NextResponse.json({ error: 'ITP Template not found' }, { status: 404 });
  
  // Create inspection and steps
  const inspection = await prisma.qualityInspection.create({
    data: {
      jobOrderItemId,
      itpTemplateId,
      isCritical: isCritical || false,
      createdBy,
      steps: {
        create: itp.steps.map((stepName: string) => ({ stepName }))
      }
    },
    include: {
      steps: true,
      itpTemplate: true,
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
  return NextResponse.json(inspection);
}

// PATCH: Update inspection status
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { inspectionId, status } = body;
  
  if (!inspectionId) {
    return NextResponse.json({ error: 'Missing inspectionId' }, { status: 400 });
  }
  
  const inspection = await prisma.qualityInspection.update({
    where: { id: inspectionId },
    data: { status },
    include: {
      steps: { include: { photos: true } },
      itpTemplate: true,
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
    },
  });
  return NextResponse.json(inspection);
}
