import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const itemType = searchParams.get('itemType') || ''
    const location = searchParams.get('location') || ''

    const where: any = {}
    if (itemType) where.itemType = itemType
    if (location) where.storageLocation = location
    if (search) {
      where.OR = [
        { batchNo: { contains: search, mode: 'insensitive' } },
        { itemType: { contains: search, mode: 'insensitive' } },
        { size: { contains: search, mode: 'insensitive' } },
        { thickness: { contains: search, mode: 'insensitive' } },
        { length: { contains: search, mode: 'insensitive' } },
        { grade: { contains: search, mode: 'insensitive' } },
        { storageLocation: { contains: search, mode: 'insensitive' } },
      ]
    }

    const items = await prisma.manufacturingInventoryItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching manufacturing items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      batchNo,
      itemType,
      size,
      thickness,
      length,
      unit,
      grade,
      storageLocation,
      currentStock
    } = body

    if (!batchNo || !itemType || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const item = await prisma.manufacturingInventoryItem.create({
      data: {
        batchNo,
        itemType,
        size: size || null,
        thickness: thickness || null,
        length: length || null,
        unit,
        grade: grade || null,
        storageLocation: storageLocation || null,
        currentStock: Number.isFinite(currentStock) ? Number(currentStock) : 0
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating manufacturing item:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      batchNo,
      itemType,
      size,
      thickness,
      length,
      unit,
      grade,
      storageLocation,
      currentStock
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing item id' }, { status: 400 })
    }

    const item = await prisma.manufacturingInventoryItem.update({
      where: { id },
      data: {
        batchNo,
        itemType,
        size: size || null,
        thickness: thickness || null,
        length: length || null,
        unit,
        grade: grade || null,
        storageLocation: storageLocation || null,
        currentStock: Number.isFinite(currentStock) ? Number(currentStock) : 0
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating manufacturing item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing item id' }, { status: 400 })
    }

    await prisma.manufacturingInventoryItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting manufacturing item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
