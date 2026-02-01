import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch inspections for a job order item
export async function GET(req: NextRequest) {
  const jobOrderItemId = req.nextUrl.searchParams.get('jobOrderItemId');
  if (!jobOrderItemId) return NextResponse.json({ error: 'Missing jobOrderItemId' }, { status: 400 });
  const inspections = await prisma.qualityInspection.findMany({
    where: { jobOrderItemId },
    include: {
      itpTemplate: true,
      steps: { include: { photos: true } },
    },
  });
  return NextResponse.json(inspections);
}

// POST: Create a new inspection for a job order item
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jobOrderItemId, itpTemplateId, isCritical, createdBy } = body;
  if (!jobOrderItemId || !itpTemplateId || !createdBy) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  // Get ITP steps
  const itp = await prisma.iTPTemplate.findUnique({ where: { id: itpTemplateId } });
  if (!itp) return NextResponse.json({ error: 'ITP Template not found' }, { status: 404 });
  // Create inspection and steps
  const inspection = await prisma.qualityInspection.create({
    data: {
      jobOrderItemId,
      itpTemplateId,
      isCritical,
      createdBy,
      steps: {
        create: itp.steps.map((stepName: string) => ({ stepName }))
      }
    },
    include: {
      steps: true,
      itpTemplate: true,
    }
  });
  return NextResponse.json(inspection);
}

// PATCH: Update step status, remarks, or add photo
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { stepId, status, remarks, inspectedBy, photoUrl } = body;
  if (!stepId) return NextResponse.json({ error: 'Missing stepId' }, { status: 400 });
  // Update step
  const step = await prisma.qualityStep.update({
    where: { id: stepId },
    data: {
      status,
      remarks,
      inspectedBy,
      inspectedAt: inspectedBy ? new Date() : undefined,
      photos: photoUrl ? { create: { url: photoUrl, uploadedBy: inspectedBy || 'unknown' } } : undefined,
    },
    include: { photos: true },
  });
  return NextResponse.json(step);
}
