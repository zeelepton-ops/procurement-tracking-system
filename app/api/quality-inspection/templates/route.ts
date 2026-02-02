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
  try {
    const body = await req.json();
    const { name, steps, isDefault } = body;

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedName = String(name).trim();
    const normalizedSteps = steps
      .map((s: string) => String(s).trim())
      .filter(Boolean);

    if (!normalizedName || normalizedSteps.length === 0) {
      return NextResponse.json({ error: 'Template name and at least one step are required' }, { status: 400 });
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
        name: normalizedName,
        steps: normalizedSteps,
        isDefault: !!isDefault,
      }
    });

    return NextResponse.json(template);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create template' }, { status: 500 });
  }
}
