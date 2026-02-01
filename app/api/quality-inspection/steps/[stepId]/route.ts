import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// PATCH: Update a quality step
export async function PATCH(
  req: NextRequest,
  { params }: { params: { stepId: string } }
) {
  const session = await getServerSession();
  const body = await req.json();
  const { status, remarks, photoUrl } = body;
  const inspectedBy = session?.user?.email || 'system';
  
  const updateData: any = {};
  
  if (status) {
    updateData.status = status;
    updateData.inspectedBy = inspectedBy;
    updateData.inspectedAt = new Date();
  }
  
  if (remarks !== undefined) {
    updateData.remarks = remarks;
  }
  
  if (photoUrl) {
    updateData.photos = {
      create: {
        url: photoUrl,
        uploadedBy: inspectedBy,
      }
    };
  }
  
  const step = await prisma.qualityStep.update({
    where: { id: params.stepId },
    data: updateData,
    include: { photos: true },
  });
  
  return NextResponse.json(step);
}
