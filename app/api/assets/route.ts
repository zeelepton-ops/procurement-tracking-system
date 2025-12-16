import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    })
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, name, category, location, status } = body

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })
    }

    const asset = await prisma.asset.create({
      data: {
        code,
        name,
        category: category || null,
        location: location || null,
        status: status || 'ACTIVE'
      }
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create asset:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Asset code already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        category: data.category || null,
        location: data.location || null,
        status: data.status || 'ACTIVE',
        isActive: data.isActive ?? true
      }
    })

    return NextResponse.json(asset)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Asset code already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    await prisma.asset.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
