import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const parseDate = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const buildDateFilter = (from?: string | null, to?: string | null) => {
  const start = parseDate(from || null)
  const end = parseDate(to || null)
  if (!start && !end) return undefined
  const range: any = {}
  if (start) range.gte = start
  if (end) {
    const endDate = new Date(end)
    endDate.setHours(23, 59, 59, 999)
    range.lte = endDate
  }
  return range
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId') || ''
    const itemType = searchParams.get('itemType') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: any = {}
    const dateRange = buildDateFilter(dateFrom, dateTo)
    if (dateRange) where.date = dateRange
    if (itemId) where.itemId = itemId
    if (itemType) where.item = { itemType }

    const entries = await prisma.manufacturingStockUpdate.findMany({
      where,
      include: { item: true },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching stock updates:', error)
    return NextResponse.json({ error: 'Failed to fetch stock updates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itemId, date, newStock, unit, remarks, createdBy } = body

    if (!itemId || newStock === undefined || newStock === null || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const entryDate = parseDate(date || null) || new Date()
    const stockValue = Number(newStock)

    const entry = await prisma.$transaction(async (tx) => {
      const item = await tx.manufacturingInventoryItem.findUnique({ where: { id: itemId } })
      if (!item) throw new Error('Item not found')

      const adjustmentQty = stockValue - item.currentStock
      const updatedItem = await tx.manufacturingInventoryItem.update({
        where: { id: itemId },
        data: { currentStock: stockValue }
      })

      const created = await tx.manufacturingStockUpdate.create({
        data: {
          itemId,
          date: entryDate,
          newStock: stockValue,
          adjustmentQty,
          unit,
          remarks: remarks || null,
          createdBy: createdBy || null
        },
        include: { item: true }
      })

      return { entry: created, item: updatedItem }
    })

    return NextResponse.json(entry.entry, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create stock update'
    console.error('Error creating stock update:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
