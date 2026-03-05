import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const LOCATION_OPTIONS = ['Fabrication', 'Manufacturing'] as const

const parseNumber = (value: unknown, fallback = 0) => {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : fallback
}

const normalizeLocation = (value: unknown) => {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return null
  if (raw === 'fabrication') return 'Fabrication'
  if (raw === 'manufacturing') return 'Manufacturing'
  return null
}

const toInventoryResponse = (item: any) => ({
  ...item,
  updatedAt: item.lastUpdated,
})

export async function GET() {
  try {
    const inventory = await prisma.inventoryItem.findMany({
      orderBy: {
        itemName: 'asc'
      }
    })
    console.log('Inventory items fetched:', inventory.length)
    return NextResponse.json(inventory.map(toInventoryResponse))
  } catch (error) {
    console.error('Failed to fetch inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itemName, description, currentStock, unit, minimumStock, location } = body
    const normalizedLocation = normalizeLocation(location)

    if (!itemName || !unit) {
      return NextResponse.json({ error: 'Item name and unit are required' }, { status: 400 })
    }

    if (!normalizedLocation) {
      return NextResponse.json({ error: `Location must be one of: ${LOCATION_OPTIONS.join(', ')}` }, { status: 400 })
    }

    const item = await prisma.inventoryItem.create({
      data: {
        itemName,
        description: description || null,
        currentStock: parseNumber(currentStock, 0),
        unit,
        minimumStock: parseNumber(minimumStock, 0),
        location: normalizedLocation,
      }
    })

    return NextResponse.json(toInventoryResponse(item), { status: 201 })
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
    const normalizedLocation = normalizeLocation(data.location)
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (data.location !== undefined && !normalizedLocation) {
      return NextResponse.json({ error: `Location must be one of: ${LOCATION_OPTIONS.join(', ')}` }, { status: 400 })
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        itemName: data.itemName,
        description: data.description || null,
        currentStock: data.currentStock !== undefined ? parseNumber(data.currentStock, 0) : undefined,
        unit: data.unit,
        minimumStock: data.minimumStock !== undefined ? parseNumber(data.minimumStock, 0) : undefined,
        location: data.location !== undefined ? normalizedLocation : undefined,
      }
    })

    return NextResponse.json(toInventoryResponse(item))
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
