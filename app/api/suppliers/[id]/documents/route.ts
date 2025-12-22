import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const docs = await prisma.supplierDocument.findMany({ where: { supplierId: id }, orderBy: { uploadedAt: 'desc' } })
    return NextResponse.json(docs)
  } catch (err: any) {
    console.error('Failed to list documents', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const form = await request.formData()
    const file = form.get('file') as any
    const type = (form.get('type') as string) || 'DOCUMENT'
    const notes = (form.get('notes') as string) || null

    if (!file || !file.name) return NextResponse.json({ error: 'File is required' }, { status: 400 })

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'suppliers', id)
    fs.mkdirSync(uploadsDir, { recursive: true })

    // ensure filename safety
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
    const filepath = path.join(uploadsDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filepath, buffer)

    const url = `/uploads/suppliers/${id}/${filename}`

    const doc = await prisma.supplierDocument.create({
      data: {
        supplierId: id,
        type,
        filename: file.name,
        url,
        uploadedBy: session.user.email || session.user.id,
        notes
      }
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (err: any) {
    console.error('Failed to upload document', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}