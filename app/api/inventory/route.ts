import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const inventory = await prisma.inventoryItem.findMany({
      orderBy: {
        itemName: 'asc'
      }
    })
    
    return NextResponse.json(inventory)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itemName, description, currentStock, unit, minimumStock, location } = body

    if (!itemName || !unit) {
      return NextResponse.json({ error: 'Item name and unit are required' }, { status: 400 })
    }

    const item = await prisma.inventoryItem.create({
      data: {
        itemName,
        description: description || null,
        currentStock: parseFloat(currentStock ?? '0'),
        unit,
        minimumStock: parseFloat(minimumStock ?? '0'),
        location: location || null
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Item already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        itemName: data.itemName,
        description: data.description || null,
        currentStock: data.currentStock !== undefined ? parseFloat(data.currentStock) : undefined,
        unit: data.unit,
        minimumStock: data.minimumStock !== undefined ? parseFloat(data.minimumStock) : undefined,
        location: data.location || null
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    await prisma.inventoryItem.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
  }
}
