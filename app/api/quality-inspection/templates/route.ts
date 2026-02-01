import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET: Fetch all ITP templates
export async function GET(req: NextRequest) {
  const templates = await prisma.iTPTemplate.findMany({
    orderBy: [
      { isDefault: 'desc' },
      { name: 'asc' }
    ]
  });
  return NextResponse.json(templates);
}

// POST: Create a new ITP template
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, steps, isDefault } = body;
  
  if (!name || !steps || !Array.isArray(steps)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  // If setting as default, unset other defaults
  if (isDefault) {
    await prisma.iTPTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    });
  }
  
  const template = await prisma.iTPTemplate.create({
    data: {
      name,
      steps,
      isDefault: isDefault || false,
    }
  });
  
  return NextResponse.json(template);
}
