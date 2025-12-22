import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTemplateExcel } from '@/lib/printTemplate'

export async function POST(request: Request) {
  try {
    const fd = await request.formData()
    const file = fd.get('file') as File | null
    const name = String(fd.get('name') || 'Unnamed Template')
    const entityType = String(fd.get('entityType') || 'JOB_ORDER')

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const parsed = parseTemplateExcel(buffer)

    const created = await prisma.printTemplate.create({
      data: {
        name,
        entityType,
        htmlTemplate: parsed.htmlTemplate || '',
        mapping: parsed.mapping ? parsed.mapping : undefined,
        createdBy: 'system'
      }
    })

    return NextResponse.json(created)
  } catch (err: any) {
    console.error('Failed to upload template', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  const templates = await prisma.printTemplate.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(templates)
}